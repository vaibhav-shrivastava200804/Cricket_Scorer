import jwt, { decode } from "jsonwebtoken";
export const protect = (roles=[])=>{
    return(req,res,next)=>{
        const token=req.headers.authorization?.split(" ")[1];
        if(!token) return res.sendStatus(401);
        try{
            const decoded=jwt.verify(token,process.env.JWT_SECRET);
            if(roles.length && !roles.includes(decoded.role)){
                return res.sendStatus(401);
            }
            req.user=decoded;
            next();
        } catch{
            res.sendStatus(401);
        }
    };
};