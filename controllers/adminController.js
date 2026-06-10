import User  from "../models/User.js";
import Video from "../models/Video.js";

// GET /api/admin/stats
export const getStats = async (req, res) => {
  try {
    const [totalUsers, totalVideos, publishedVideos, viewsAgg] = await Promise.all([
      User.countDocuments(),
      Video.countDocuments({ status: { $ne: "deleted" } }),
      Video.countDocuments({ status: "published" }),
      Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    ]);

    const recentUsers  = await User.find().sort({ createdAt: -1 }).limit(5).select("name email createdAt role");
    const recentVideos = await Video.find({ status: { $ne: "deleted" } })
      .sort({ createdAt: -1 }).limit(5).populate("uploadedBy", "name");

    res.json({
      stats: {
        totalUsers,
        totalVideos,
        publishedVideos,
        totalViews: viewsAgg[0]?.total || 0,
      },
      recentUsers,
      recentVideos,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || "1",  10);
    const limit = parseInt(req.query.limit || "20", 10);
    const total = await User.countDocuments();
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password");

    res.json({ users, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/users/:id
export const updateUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ error: "Can't modify your own account here" });

    const { isActive, role } = req.body;
    const updates = {};
    if (typeof isActive !== "undefined") updates.isActive = isActive;
    if (role && ["user", "admin"].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ error: "Can't delete your own account" });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/videos
export const getVideos = async (req, res) => {
  try {
    const page   = parseInt(req.query.page  || "1",  10);
    const limit  = parseInt(req.query.limit || "20", 10);
    const query  = req.query.status ? { status: req.query.status } : {};
    const total  = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ videos, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/videos/:id
export const updateVideoStatus = async (req, res) => {
  try {
    const allowed = ["processing", "published", "unlisted", "deleted"];
    const { status } = req.body;

    if (!allowed.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(", ")}` });

    const video = await Video.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate("uploadedBy", "name email");
    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json({ video });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};