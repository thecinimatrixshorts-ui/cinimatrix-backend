import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import reviewRoutes from "./routes/reviews.js";

dotenv.config();

const app =express();

app.use(cors());
app.use(express.json());

app.use("/api/reviews", reviewRoutes);

mongoose
.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("Mongo connected ");
    app.listen(process.env.PORT || 5000,() =>{
        console.log(`server running on port ${process.env.PORT || 5000}`);
    });
})
.catch((err)=> console.error("Mongo connection failed ",err));