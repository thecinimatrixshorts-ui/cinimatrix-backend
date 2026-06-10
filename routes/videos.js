import { Router } from "express";
import {
  getPresignedUrl,
  createVideo,
  getVideos,
  getMyVideos,
  getVideo,
  deleteVideo,
} from "../controllers/videoController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/",               getVideos);
router.get("/my",             protect, getMyVideos);
router.get("/:id",            getVideo);
router.post("/presigned-url", protect, getPresignedUrl);
router.post("/",              protect, createVideo);
router.delete("/:id",         protect, deleteVideo);

export default router;