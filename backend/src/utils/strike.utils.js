export const shouldRotateStrike= ({runs,isExtra})=>{
    if(isExtra) return false;
    return runs%2===1;
}

export const rotateStrike=({strikerId,nonStrikerId})=>{
    return{
        strikerId:nonStrikerId,
        nonStrikerId:strikerId
    }
}