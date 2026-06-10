import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: "" },
  s3Key:        { type: String, required: true },
  s3Url:        { type: String, required: true },
  thumbnailUrl: { type: String, default: "" },
  duration:     { type: Number, default: 0 },
  fileSize:     { type: Number, default: 0 },
  mimeType:     { type: String, default: "video/mp4" },
  tags:         [{ type: String, trim: true }],
  category:     { type: String, default: "General" },
  status: {
    type: String,
    enum: ["processing", "published", "unlisted", "deleted"],
    default: "processing",
  },
  views:      { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Video", videoSchema);