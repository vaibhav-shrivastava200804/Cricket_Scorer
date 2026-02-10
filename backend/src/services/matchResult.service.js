export const matchResult = async (conn, matchId) => {
  const [innings] = await conn.query(
    `SELECT innings_number, total_runs,wickets,batting_team_id
    FROM innings
    WHERE
    match_id=?
    ORDER BY innings_number`,
    [matchId],
  );

  if (innings.length < 2) return;

  const first = innings[0];
  const second = innings[1];
  let resultText = "";
  let winnerTeamId = null;

  if (second.total_runs > first.total_runs) {
    winnerTeamId = second.batting_team_id;
    resultText = `Won by ${10 - second.wickets} wickets`;
  } else if (second.total_runs < first.total_runs) {
    winnerTeamId = first.batting_team_id;
    resultText = `Won by ${first.total_runs - second.total_runs} runs`;
  } else {
    resultText = "Match Tied";
  }

  await conn.query(
    `
    UPDATE matches
    SET status = 'COMPLETED',
        result = ?,
        winner_team_id = ?
    WHERE id = ?
    `,
    [resultText, winnerTeamId, matchId],
  );
  return{
    winnerTeamId,
    resultText
  }
};
