import pool from "../config/db.js";

export const startNextOver= async(req,res)=>{
    const {inningsId,bowlerId}=req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        
        // Fetch innings details
        const [[innings]] = await conn.query(
            `SELECT i.*, m.overs_per_innings
             FROM innings i
             JOIN matches m ON i.match_id = m.id
             WHERE i.id = ?`,
            [inningsId]
        );
        
        if (!innings) throw new Error("Innings not found");
        
        // Validate bowler belongs to bowling team
        const [[bowler]] = await conn.query(
            `SELECT * FROM players WHERE id = ? AND team_id = ?`,
            [bowlerId, innings.bowling_team_id]
        );
        
        if (!bowler) throw new Error("Bowler does not belong to bowling team");
        
        // Check if bowler already has bowling scorecard for this innings
        const [[existingScorecard]] = await conn.query(
            `SELECT * FROM bowling_scorecards WHERE innings_id = ? AND player_id = ?`,
            [inningsId, bowlerId]
        );
        
        const [[lastOver]]= await conn.query(
            `SELECT * FROM overs 
            WHERE innings_id=?
            ORDER BY over_number DESC
            LIMIT 1`,
            [inningsId]
        );
        console.log("inningsId received:", inningsId);
        console.log(lastOver)

        if(!lastOver || lastOver.balls_in_over !==6){
            throw new Error("PREVIOUS OVER NOT COMPLETED");
        }
        else{
            await conn.query(
                `INSERT INTO overs (innings_id, over_number, bowler_id, balls_in_over) VALUES (?,?,?,0)`,
                [inningsId,lastOver.over_number+1,bowlerId]
            );
            
            // Only create bowling scorecard if it doesn't exist
            if (!existingScorecard) {
                await conn.query(
                    `INSERT INTO bowling_scorecards (innings_id,player_id) VALUES (?,?)`,
                    [inningsId,bowlerId]
                );
            }
        }

        await conn.commit();

        res.json({
            message:"NEW OVER STARTED",
            bowlerId,
            overNumber:lastOver.over_number + 1
        })
    } catch (error) {
        await conn.rollback();
        res.status(400).json({error:error.message})
    }finally{
        conn.release();
    }
}
