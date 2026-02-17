import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import matchRoutes from "./src/routes/match.routes.js";
import inningsRoutes from "./src/routes/innings.routes.js"
import openingRoutes from "./src/routes/opening.routes.js"
import scoringRoutes from "./src/routes/scoring.routes.js";
import nextBowlerRoutes from "./src/routes/over.routes.js"; 
import newBatsman from "./src/routes/batsman.routes.js";
const app= express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/match", matchRoutes);
app.use("/innings",inningsRoutes);
app.use("/opening",openingRoutes);
app.use("/scoring",scoringRoutes);
app.use("/over",nextBowlerRoutes);
app.use("/select",newBatsman);
/*
    /auth/login


    /match/tournament
    /match/team
    /match/player
    /match/create

    /innings/start
    /innings/end

    /opening/select

    /scoring/ball

    /over/next

*/

app.get("/",(req,res)=>{
    res.send("Cricket Scoring API Running");
});


app.listen(process.env.PORT,()=>{
    console.log(`Server running on port ${process.env.PORT}`)
});