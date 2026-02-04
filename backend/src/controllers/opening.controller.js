import pool from "../config/db.js";
export const selectOpeners = async (req,res) => {
    const {
        inningsId,
        strikerId,
        nonStrikerId,
        bowlerId
    }= req.body;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[innings]]= await conn.query(
            "SELECT * FROM innings WHERE id=?",
            [inningsId]
        );
        if(!innings) throw new Error("Innings Not Found");
        await conn.query(
            "INSERT INTO batting_scorecards (innings_id,player_id) VALUES (?,?), (?,?)",
            [inningsId,strikerId,inningsId,nonStrikerId]
        );
        await conn.query(
            "INSERT INTO bowling_scorecards (innings_id,player_id) VALUES (?,?)",
            [inningsId,bowlerId]
        );
        await conn.query(
            "INSERT INTO overs (innings_id,over_number,bowler_id) VALUES (?,1,?)",
            [inningsId,bowlerId]
        );

        await conn.query(
            "UPDATE innings SET striker_id = ?, non_striker_id = ? WHERE id = ?",
            [strikerId, nonStrikerId, inningsId]
        );

        await conn.commit();
        res.json({
            message:"Opening batsmen and bowler set"
        });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({error:error.message});
    }finally{
        conn.release();
    }
}