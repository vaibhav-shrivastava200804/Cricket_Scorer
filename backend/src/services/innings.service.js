import pool from "../config/db.js";
import { shouldEndInnings } from "../utils/innings.utils.js";
export const checkAndEndInnings= async(conn, innings)=>{
    const {
        id:inningsId,
        innings_number,
        balls,
        wickets,
        total_runs,
        match_id,
        overs_per_innings
    }=innings;
    let target= null;

    if(innings_number===2){
        const [[firstInnings]]= await conn.query(
            "SELECT total_runs FROM innings WHERE match_id= ? AND innings_number=1",
            [match_id]
        );
        const [[secondInnigs]]= await conn.query(
            "SELECT total_runs FROM innings WHERE match_id= ? AND innings_number=2",
            [match_id]
        );
        console.log(secondInnigs);
        target=firstInnings.total_runs+1;
    }
    const shouldEnd= shouldEndInnings({
        balls,
        wickets,
        oversPerInnings:overs_per_innings,
        inningsNumber:innings_number,
        totalRuns:total_runs,
        target,
    });
    if(shouldEnd){
        await conn.query(
            "UPDATE innings SET completed= TRUE WHERE id=?",
            [inningsId]
        )
    }
    return{
        ended:shouldEnd,
        target,
    };
};