import pool from "../config/db.js";
export const selectNewBatsman = async (req, res) => {
    const { inningsId, newBatsmanId } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [[innings]] = await conn.query(
            `SELECT striker_id,
                    non_striker_id,
                    waiting_for_new_batsman,
                    last_batsman_out_end
             FROM innings
             WHERE id = ?`,
            [inningsId]
        );

        if (!innings) throw new Error("Innings not found");
        if (!innings.waiting_for_new_batsman) throw new Error("No wicket fallen");

        let striker_id = innings.striker_id;
        let non_striker_id = innings.non_striker_id;

        if (innings.last_batsman_out_end === "striker_end") {
            // 🏏 New batsman takes striker end
            non_striker_id = striker_id !== null ? striker_id : non_striker_id;
            striker_id = newBatsmanId;

        } else if (innings.last_batsman_out_end === "non_striker_end") {
            // 🏏 New batsman takes non-striker end
            striker_id = non_striker_id !== null ? non_striker_id : striker_id;
            non_striker_id = newBatsmanId;

        } else {
            throw new Error("Invalid last_batsman_out_end value");
        }

        await conn.query(
            `UPDATE innings
             SET striker_id = ?,
                 non_striker_id = ?,
                 waiting_for_new_batsman = FALSE
             WHERE id = ?`,
            [striker_id, non_striker_id, inningsId]
        );

        await conn.query(
            `INSERT INTO batting_scorecards (innings_id, player_id)
             VALUES (?, ?)`,
            [inningsId, newBatsmanId]
        );

        await conn.commit();

        res.json({
            message: "New batsman selected",
            striker_id,
            non_striker_id
        });

    } catch (error) {
        await conn.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        conn.release();
    }
};