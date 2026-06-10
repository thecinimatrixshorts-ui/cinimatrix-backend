import { Router } from "express";
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getVideos,
  updateVideoStatus,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/stats",        getStats);
router.get("/users",        getUsers);
router.patch("/users/:id",  updateUser);
router.delete("/users/:id", deleteUser);
router.get("/videos",       getVideos);
router.patch("/videos/:id", updateVideoStatus);

export default router;