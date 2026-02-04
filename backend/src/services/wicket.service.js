import pool from "../config/db.js";

// Wicket types that credit the bowler
const BOWLER_CREDIT_WICKETS = ['BOWLED', 'CAUGHT', 'LBW', 'HIT_WICKET'];

// Wicket types that need fielder
const TEAM_WICKETS = ['CAUGHT', 'RUN_OUT','TIMED_OUT'];

export const createWicketEvent = async ({
  conn,
  inningsId,
  ballNumber,
  wicketType,
  batsmanId,
  fielderId = null,
  bowlerId
}) => {
  // Determine if bowler gets credit
  const shouldCreditBowler = BOWLER_CREDIT_WICKETS.includes(wicketType);
  const actualBowlerId = shouldCreditBowler ? bowlerId : null;

  // For stumped, bowler doesn't get credit
  const wicketBowlerId = wicketType === 'STUMPED' ? null : actualBowlerId;
  // Insert wicket event
  const [result] = await conn.query(
    `INSERT INTO wicket_events (innings_id, ball_over_number, wicket_type, batsman_id, fielder_id, bowler_id) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [inningsId, ballNumber, wicketType, batsmanId, fielderId, wicketBowlerId]
  );

  // Update batting scorecard
  await conn.query(
    `UPDATE batting_scorecards 
     SET is_out = 1, dismissal_type = ?, fielder_id = ?
     WHERE innings_id = ? AND player_id = ?`,
    [wicketType, fielderId, inningsId, batsmanId]
  );

  // Credit bowler if applicable
  if (shouldCreditBowler) {
    await conn.query(
      `UPDATE bowling_scorecards 
       SET wickets = wickets + 1 
       WHERE innings_id = ? AND player_id = ?`,
      [inningsId, bowlerId]
    );
  }

  return result;
};

export const getEligibleBatsmen = async ({ conn, inningsId, battingTeamId }) => {
  const [rows] = await conn.query(
    `SELECT p.id, p.name 
     FROM players p 
     WHERE p.team_id = ? 
     AND p.id NOT IN (
       SELECT bs.player_id FROM batting_scorecards bs 
       WHERE bs.innings_id = ? AND bs.is_out = 1
     )`,
    [battingTeamId, inningsId]
  );
  return rows;
};

