export const getEligibleBowlers = async ({
  conn,
  inningsId,
  bowlingTeamId,
  previousBowlerId,
  baseOvers,
  extraOversAllowed
}) => {

  // Count extra overs already used
  const [[{ extraOversUsed }]] = await conn.query(
    `
    SELECT COUNT(*) AS extraOversUsed
    FROM (
      SELECT bowler_id, COUNT(*) AS overs
      FROM overs
      WHERE innings_id = ?
      GROUP BY bowler_id
      HAVING overs > ?
    ) t
    `,
    [inningsId, baseOvers]
  );

  // Get eligible bowlers
  const [rows] = await conn.query(
    `
    SELECT 
      p.id AS player_id,
      p.name,
      COUNT(o.id) AS overs_bowled
    FROM players p
    LEFT JOIN overs o
      ON o.bowler_id = p.id
     AND o.innings_id = ?
    WHERE p.team_id = ?
      AND p.id != ?
    GROUP BY p.id
    HAVING
      COUNT(o.id) < ?
      OR (
        COUNT(o.id) = ?
        AND ?
      )
    ORDER BY overs_bowled ASC
    `,
    [
      inningsId,
      bowlingTeamId,
      previousBowlerId,
      baseOvers,
      baseOvers,
      extraOversUsed < extraOversAllowed
    ]
  );

  if (rows.length === 0) {
    throw new Error("No eligible bowler available");
  }

  return rows;
};
