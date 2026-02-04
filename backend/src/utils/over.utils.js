export const isOverCompleted = (ballsInOver)=>{
    return ballsInOver===6;
}

export const swapStrikeEndofOver=({strikerId,nonStrikerId})=>{
    return{
        strikerId:nonStrikerId,
        nonStrikerId:strikerId
    }
}