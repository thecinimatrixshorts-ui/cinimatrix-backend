import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import rateLimit from "express-rate-limit";

import reviewRoutes from "./routes/reviews.js";
import authRoutes   from "./routes/auth.js";
import videoRoutes  from "./routes/videos.js";
import adminRoutes  from "./routes/admin.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/reviews", reviewRoutes);
app.use("/api/auth",    authRoutes);
app.use("/api/videos",  videoRoutes);
app.use("/api/admin",   adminRoutes);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get("/", (req, res) => res.json({ message: "Cinimatrix API running 🎬" }));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));