import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import s3    from "../config/aws.js";
import Video from "../models/Video.js";

const BUCKET  = process.env.AWS_S3_BUCKET;
const REGION  = process.env.AWS_REGION;
const EXPIRES = parseInt(process.env.S3_PRESIGNED_URL_EXPIRES || "300", 10);

// POST /api/videos/presigned-url
export const getPresignedUrl = async (req, res) => {
  try {
    const { fileName, mimeType } = req.body;
    if (!fileName || !mimeType)
      return res.status(400).json({ error: "fileName and mimeType are required" });

    const ext    = fileName.split(".").pop();
    const s3Key  = `videos/${uuidv4()}.${ext}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: mimeType });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: EXPIRES });
    const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

    res.json({ presignedUrl, s3Key, s3Url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/videos
export const createVideo = async (req, res) => {
  try {
    const { title, description, s3Key, s3Url, thumbnailUrl, duration, fileSize, mimeType, tags, category } = req.body;

    if (!title || !s3Key || !s3Url)
      return res.status(400).json({ error: "title, s3Key and s3Url are required" });

    const video = await Video.create({
      title, description, s3Key, s3Url, thumbnailUrl,
      duration, fileSize, mimeType,
      tags:       tags     || [],
      category:   category || "General",
      status:     "published",
      uploadedBy: req.user._id,
    });

    res.status(201).json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos
export const getVideos = async (req, res) => {
  try {
    const page     = parseInt(req.query.page  || "1",  10);
    const limit    = parseInt(req.query.limit || "12", 10);
    const query    = { status: "published" };

    if (req.query.category) query.category = req.query.category;
    if (req.query.search)   query.title = { $regex: req.query.search, $options: "i" };

    const total  = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .populate("uploadedBy", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ videos, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos/my
export const getMyVideos = async (req, res) => {
  try {
    const videos = await Video.find({
      uploadedBy: req.user._id,
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/videos/:id
export const getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate("uploadedBy", "name avatar");
    if (!video || video.status === "deleted")
      return res.status(404).json({ error: "Video not found" });

    video.views += 1;
    await video.save();
    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/videos/:id
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const isOwner = video.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin")
      return res.status(403).json({ error: "Not authorized" });

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: video.s3Key }));
    video.status = "deleted";
    await video.save();

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 60 }); // cache for 60 seconds

export const getVideos = async (req, res) => {
  try {
    const cacheKey = `videos_${req.query.page || 1}_${req.query.category || "all"}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // If not cached, hit MongoDB
    const page  = parseInt(req.query.page  || "1",  10);
    const limit = parseInt(req.query.limit || "12", 10);
    // ... rest of your existing code ...

    const result = { videos, pagination: { total, page, pages: Math.ceil(total / limit), limit } };
    
    // Save to cache
    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};