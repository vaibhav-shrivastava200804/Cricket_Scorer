import pool from "../config/db.js";
export const startMatch = async(req,res)=>{
    const {matchId}= req.body;
    if(!matchId){
        return res.status(400).json({message:"matchId is required"});
    }
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[match]]= await conn.query(
            "SELECT * FROM matches WHERE id =?",
            [matchId]
        )
        if(!match) throw new Error("Match not found");
        if(match.status !== "SCHEDULED"){
            throw new Error("match already started");
        }
        const {
            team_a_id,
            team_b_id,
            toss_winner_id,
            toss_decision,
        } = match;

        let battingFirst,bowlingFirst;
        if(toss_decision==="BAT"){
            battingFirst=toss_winner_id;
            bowlingFirst= toss_winner_id===team_a_id ? team_b_id : team_a_id;
        }else{
            bowlingFirst = toss_winner_id;
            battingFirst =toss_winner_id === team_a_id ? team_b_id : team_a_id;
        }

        await conn.query(
            "INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id) VALUES (?,1,?,?)",
            [matchId,battingFirst,bowlingFirst]
        );
        await conn.query(
            "INSERT INTO innings (match_id, innings_number, batting_team_id, bowling_team_id) VALUES (?,2,?,?)",
            [matchId, bowlingFirst,battingFirst]
        );

        await conn.query(
            "UPDATE matches SET status = 'LIVE' WHERE id=?",
            [matchId]
        );
        await conn.commit();
        res.json({
            message:"match started",
            battingFirst,
            bowlingFirst
        });
        console.log(res)
    } catch (error) {
        await conn.rollback();
        console.log(error)
        res.status(400).json({error:error.message});
    }finally{
        conn.release();
    }
}

export const endInnings = async(req,res)=>{
    const {inningsId}= req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[innings]]= await conn.query(
            "SELECT * FROM innings WHERE id = ?",
            [inningsId]
        );
        if(!innings) throw new Error("Innings not Found");
        if(innings.completed){
            throw new Error("Innings already completed");
        }

        await conn.query(
            "UPDATE innings SET completed=TRUE WHERE id=?",
            [inningsId]
        );

        const target=innings.total_runs+1;
        console.log(target);

        await conn.commit();

        res.json({
            message:"innings ended",
            target,
        });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ error: error.message});
    }finally{
        conn.release();
    }
}

export const selectNewBatsman = async (req, res) => {
    const { inningsId, newBatsmanId } = req.body;
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();
        
        const [[innings]] = await conn.query(
            "SELECT striker_id, non_striker_id, waiting_for_new_batsman FROM innings WHERE id = ?",
            [inningsId]
        );
        
        if (!innings) throw new Error("Innings not found");
        if (!innings.waiting_for_new_batsman) throw new Error("No wicket fallen");
        
        // Create batting scorecard for new batsman
        
        // Update innings with new striker (keep non-striker same)
        let striker_id=innings.striker_id;
        let non_striker_id=innings.non_striker_id;
        if(striker_id===null){
            striker_id=newBatsmanId;
        }       
        else if(non_striker_id===null){
            non_striker_id=newBatsmanId;
        }else{
            throw new Error("Invalid state:no vacant batting")
        }

        await conn.query(
            `UPDATE innings SET striker_id = ?,non_striker_id=?, waiting_for_new_batsman = FALSE WHERE id = ?`,
            [striker_id,non_striker_id, inningsId]
        );

        await conn.query(
            "INSERT INTO batting_scorecards (innings_id, player_id) VALUES (?, ?)",
            [inningsId, newBatsmanId]
        );
        
        await conn.commit();
        
        res.json({
            message: "New batsman selected",
            newBatsmanId
        });
        
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        conn.release();
    }
};
