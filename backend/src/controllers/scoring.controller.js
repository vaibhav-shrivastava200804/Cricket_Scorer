import pool from "../config/db.js";
import { checkAndEndInnings } from "../services/innings.service.js";
import { getEligibleBowlers } from "../services/bowler.service.js";
import {
  createWicketEvent,
  getEligibleBatsmen,
} from "../services/wicket.service.js";
import { isOverCompleted, swapStrikeEndofOver } from "../utils/over.utils.js";
import { matchResult } from "../services/matchResult.service.js";

export const scoreBall = async (req, res) => {
  const {
    inningsId,
    runs,
    extraType = null,
    isWicket = false,
    wicketType = "BOWLED",
    fielderId = null,
    outBatsmanId = null,
    outEnd = "striker_end",
  } = req.body;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Fetch innings
    const [[innings]] = await conn.query(
      `
      SELECT i.*, m.overs_per_innings
      FROM innings i
      JOIN matches m ON i.match_id = m.id
      WHERE i.id = ?
      `,
      [inningsId],
    );

    if (!innings) throw new Error("Innings not found");
    if (innings.completed) throw new Error("Innings already completed");
    if (innings.waiting_for_bowler)
      throw new Error("Select new bowler before scoring");
    if (innings.waiting_for_new_batsman)
      throw new Error("Select batsman before scoring");

    //  Fetch current over
    const [[currentOver]] = await conn.query(
      `
      SELECT *
      FROM overs
      WHERE innings_id = ?
      ORDER BY over_number DESC
      LIMIT 1
      `,
      [inningsId],
    );

    console.log(currentOver);

    if (!currentOver) throw new Error("No active over found");
    if (currentOver.balls_in_over >= 6) {
      throw new Error("over completed");
    }

    const isWide = extraType === "WIDE";
    const isNoBall = extraType === "NO_BALL";
    const legalBall = !isWide && !isNoBall;

    //  Update innings totals
    let teamRunsThisBall = runs;

    if (isWide || isNoBall) {
      teamRunsThisBall += 1;
    }

    const newBalls = legalBall ? innings.balls + 1 : innings.balls;
    const newRuns = innings.total_runs + teamRunsThisBall;
    const newWickets = isWicket ? innings.wickets + 1 : innings.wickets;

    // Initialize striker/non-striker before wicket check
    let strikerId = innings.striker_id;
    let nonStrikerId = innings.non_striker_id;
    const facedBatsmanId = strikerId;

    //wicket flag
    let wicketFallen = false;
    let wicketResponseData = null;
    //over, innings, match flag
    let overEnded = false;
    let overResponseData = null;
    let inningsEnded = false;
    let inningsResponseData = null;
    let matchEnded = false;
    let matchResponseData = null;

    await conn.query(
      `
      UPDATE innings
      SET balls = ?, total_runs = ?, wickets = ?
      WHERE id = ?
      `,
      [newBalls, newRuns, newWickets, inningsId],
    );

    const batsmanRuns = isWide ? 0 : runs;
    const batsmanIncrementBall = isWide ? 0 : 1;

    //update bowling_scorecard with runs conceded (including wide/no-ball extra runs)
    await conn.query(
      `UPDATE bowling_scorecards
      SET
        runs_conceded=runs_conceded+?
        WHERE innings_id=? AND player_id=?`,
      [teamRunsThisBall, inningsId, currentOver.bowler_id],
    );

    // Update balls in over
    let ballsInOver = currentOver.balls_in_over;

    if (legalBall) {
      const fours = batsmanRuns === 4 ? 1 : 0;
      const sixes = batsmanRuns === 6 ? 1 : 0;

      await conn.query(
        `UPDATE batting_scorecards
        SET 
            runs=runs+?,
            balls=balls+?,
            fours=fours+?,
            sixes=sixes+?
          WHERE innings_id=? AND player_id=?`,
        [
          batsmanRuns,
          batsmanIncrementBall,
          fours,
          sixes,
          inningsId,
          facedBatsmanId,
        ],
      );
      console.log("balls before this ball:" + currentOver.balls_in_over);
      ballsInOver += 1;
      await conn.query(` UPDATE overs SET balls_in_over=? WHERE id=?`, [
        ballsInOver,
        currentOver.id,
      ]);
    }

    if (runs % 2 === 1) {
      [strikerId, nonStrikerId] = [nonStrikerId, strikerId];

      await conn.query(
        `
        UPDATE innings
        SET striker_id = ?, non_striker_id = ?
        WHERE id = ?
        `,
        [strikerId, nonStrikerId, inningsId],
      );
    }

    if (isWicket) {
      // Get ball number for wicket event
      const ballNumber = currentOver.balls_in_over + 1;
      // Create wicket event with all details
      await createWicketEvent({
        conn,
        inningsId,
        ballNumber,
        wicketType,
        batsmanId: outBatsmanId,
        fielderId,
        bowlerId: currentOver.bowler_id,
      });

      wicketFallen = true;
      let finalOutEnd = "striker_end";
      if (wicketType === "RUN_OUT") {
        finalOutEnd = outEnd;
        if (outBatsmanId === strikerId) {
          strikerId = null;
        } else if (outBatsmanId === nonStrikerId) {
          nonStrikerId = null;
        }
        await conn.query(
          `UPDATE innings SET striker_id=?, non_striker_id=?,waiting_for_new_batsman = 1, last_batsman_out_end=? WHERE id = ?`,
          [strikerId, nonStrikerId, finalOutEnd, inningsId],
        );
      } else {
        await conn.query(
          `UPDATE innings SET striker_id=null, non_striker_id=?,waiting_for_new_batsman = 1,last_batsman_out_end=? WHERE id =?`,
          [nonStrikerId, finalOutEnd, inningsId],
        );
      }

      const eligibleBatsmen = await getEligibleBatsmen({
        conn,
        inningsId,
        battingTeamId: innings.batting_team_id,
      });

      wicketResponseData = {
        wicketType,
        outEnd: finalOutEnd,
        eligibleBatsmen,
      };
    }

    //END OF OVER LOGIC
    const [[checkOver]] = await conn.query(
      `
      SELECT *
      FROM overs
      WHERE innings_id = ?
      ORDER BY over_number DESC
      LIMIT 1
      `,
      [inningsId],
    );
    console.log("updated balls in over " + checkOver.balls_in_over);
    console.log(isOverCompleted(checkOver.balls_in_over));

    if (isOverCompleted(checkOver.balls_in_over)) {
      overEnded = true;
      ({ strikerId, nonStrikerId } = swapStrikeEndofOver({
        strikerId,
        nonStrikerId,
      }));

      await conn.query(
        `UPDATE bowling_scorecards
      SET
        overs=overs+1
        WHERE innings_id=? AND player_id=?`,
        [inningsId, currentOver.bowler_id],
      );

      const updatedInnings = {
        ...innings,
        balls: newBalls,
        total_runs: newRuns,
        wickets: newWickets,
        overs_per_innings: innings.overs_per_innings,
      };

      const inningsResult = await checkAndEndInnings(conn, updatedInnings);

      if (inningsResult.ended) {
        inningsEnded = true;
        if (innings.innings_number === 2) {
          matchEnded = true;
          matchResponseData = await matchResult(conn, innings.match_id);
        }
        inningsResponseData = {
          target: inningsResult.target,
        };
      }

      if (!inningsEnded) {
        await conn.query(
          `UPDATE innings
        SET 
          striker_id=?,
          non_striker_id=?
          WHERE id= ?`,
          [strikerId, nonStrikerId, inningsId],
        );
      }

      const baseOvers = Math.max(1, Math.floor(innings.overs_per_innings / 5));
      const extraOversAllowed = innings.overs_per_innings % 5;
      const eligibleBowlers = await getEligibleBowlers({
        conn,
        inningsId,
        bowlingTeamId: innings.bowling_team_id,
        previousBowlerId: currentOver.bowler_id,
        baseOvers,
        extraOversAllowed,
      });
      overResponseData = { eligibleBowlers };
    }

    // Normal ball response (over not completed)
    const updatedInnings = {
      ...innings,
      balls: newBalls,
      total_runs: newRuns,
      wickets: newWickets,
      overs_per_innings: innings.overs_per_innings,
    };

    const result = await checkAndEndInnings(conn, updatedInnings);
    if (result.ended) {
      inningsEnded = true;
      inningsResponseData = { target: result.target };
      if (innings.innings_number === 2) {
        matchEnded = true;
        matchResponseData = await matchResult(conn, innings.match_id);
      }
    }

    //final commit
    await conn.commit();

    return res.json({
      message: matchEnded
        ? "Match ended"
        : inningsEnded
          ? "Innings ended"
          : overEnded
            ? "Over completed"
            : wicketFallen
              ? "Wicket fallen"
              : "Ball recorded",

      // FLAGS
      wicketFallen,
      overEnded,
      inningsEnded,
      matchEnded,

      // DATA
      ...wicketResponseData,
      ...overResponseData,
      ...inningsResponseData,
      matchResult: matchResponseData,

      strikerId,
      nonStrikerId,
    });
  } catch (error) {
    await conn.rollback();
    res.status(400).json({ error: error.message });
  } finally {
    conn.release();
  }
};
