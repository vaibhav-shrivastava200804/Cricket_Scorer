import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export const register = async(req,res)=>{
    const {name,email,password}=req.body;
    const hashed= await bcrypt.hash(password,10);
    await pool.query(
        "INSERT INTO users (name,email,password) VALUES (?,?,?)",[name,email,hashed]
    );
    res.status(201).json({message:"user registered succesfully"});
};

export const login = async (req,res)=>{
    const {email,password}=req.body;
    const [rows]= await pool.query(
        "SELECT * FROM users WHERE email=?",
        [email]
    );
    if(!rows.length){
            return res.status(401).json({ message: "Invalid credentials" });
    }
    const user=rows[0];
    const match = await bcrypt.compare(password,user.password);
    if(!match){
        return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
        { id:user.id, role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    );
    res.json({token});
};