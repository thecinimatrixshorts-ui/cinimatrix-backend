import express from "express";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }); // newest first
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, role, review, rating } = req.body;
    const newReview = new Review({ name, role, review, rating });
    const saved = await newReview.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: "Failed to save review", error: err.message });
  }
});

export default router;