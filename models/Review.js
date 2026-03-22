import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true },
    role:   { type: String, required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

export default mongoose.model("Review", reviewSchema);