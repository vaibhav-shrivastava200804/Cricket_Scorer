export const shouldEndInnings=({
    balls,
    wickets,
    oversPerInnings,
    inningsNumber,
    totalRuns,
    target,
})=>{
    const maxBalls=oversPerInnings*6;
    if(balls>=maxBalls) return true;
    if(wickets>=10) return true;
    if(inningsNumber===2 && totalRuns>=target){
        return true;
    }
    return false;
}