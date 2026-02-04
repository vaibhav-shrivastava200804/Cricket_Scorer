import pool from "../config/db.js";

export const createTournament= async(req,res)=>{
  try{
    const {name}= req.body;
    const [result] = await pool.query(
      "INSERT INTO tournaments (name) VALUES (?)",
      [name]
    )
    res.status(201).json({
      message:"tournamnet created",
      tournamentID:result.insertId,
    })
  }catch (error) { 
    console.error("Create Tournament Error:", error);
    res.status(500).json({
      message: "Failed to create tournament",
      error: error.message,
    });
  }
};

export const createTeam= async (req,res)=>{
  try {
    const {tournamentID, name} = req.body;
    console.log(tournamentID,name)
    const [result]= await pool.query(
      "INSERT INTO teams (tournament_id,name) VALUES (?,?)",
      [tournamentID,name]
    );
    res.status(201).json({
      message:"Team created",
      teamID:result.insertId,
    });
  } catch (error) {
    res.status(500).json({error:error.message});
  }
}

export const addPlayer = async(req,res)=>{
  try {
    const {teamID,name,isCaptain,isWicketkeeper}=req.body;
    console.log(teamID,name,isCaptain,isWicketkeeper)
    const [[{count}]] = await pool.query(
      "SELECT COUNT(*) AS count FROM players WHERE team_id=?",
      [teamID]
    );
    if(count>=11){
      return res.status(400).json({message:"only 11 players allowed"});
    }
    await pool.query(
      "INSERT INTO players (team_id,name,is_captain,is_wicketkeeper) VALUES (?,?,?,?)",
      [teamID,name,isCaptain|| false, isWicketkeeper||false]
    );
    res.status(201).json({message:"player added"});
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
}

export const createMatch = async(req,res)=>{
  try {
    const {
      tournamentID,
      teamAId,
      teamBId,
      name,
      venue,
      matchDate,
      oversPerInnings,
      tossWinnerId,
      TossDecision
    }= req.body;
    if(!oversPerInnings || oversPerInnings<1){
      return res.status(400).json({message:"overs are required"});
    }
    const [result] = await pool.query(
      "INSERT INTO matches (tournament_id, team_a_id, team_b_id, name, venue, match_date,overs_per_innings, toss_winner_id, toss_decision) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [tournamentID,
        teamAId,
        teamBId,
        name,
        venue,
        matchDate,
        oversPerInnings,
        tossWinnerId,
        TossDecision
      ]
    );
    res.status(201).json({
      message:"match created",
      matchId:result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message:error.message
    })
  }
}