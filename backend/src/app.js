import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(["image", "video"]);
const EXT = {
  image: new Set(["jpg", "jpeg", "png", "gif", "webp"]),
  video: new Set(["mp4", "webm", "ogg", "mov"]),
};

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function publicBase(req) {
  return (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "") || `http://127.0.0.1:${process.env.PORT || 5000}`;
}

function buildImageDto(img, userId) {
  const ratings = img.ratings || [];
  const vals = ratings.map((r) => r.value);
  const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  let myRating = null;
  if (userId) {
    const mine = ratings.find((r) => r.userId === userId);
    if (mine) myRating = mine.value;
  }
  const reactionCounts = { like: 0, happy: 0, love: 0 };
  let myReaction = null;
  for (const r of img.reactions || []) {
    if (reactionCounts[r.reactionType] !== undefined) reactionCounts[r.reactionType]++;
    if (userId && r.userId === userId) myReaction = r.reactionType;
  }
  const uploader = img.uploader ? img.uploader.username : "Unknown";
  return {
    id: img.id,
    title: img.title,
    caption: img.caption || "",
    location: img.location || "",
    people: img.people || "",
    image_url: img.imageUrl,
    media_url: img.imageUrl,
    media_type: img.mediaType || "image",
    upload_method: img.uploadMethod || "url",
    created_at: img.createdAt ? img.createdAt.toISOString() : null,
    uploader,
    avg_rating: avg,
    rating_count: ratings.length,
    comment_count: (img.comments || []).length,
    reaction_counts: reactionCounts,
    my_reaction: myReaction,
    my_rating: myRating,
  };
}

function decodeAuth(req, secret) {
  const h = req.headers.authorization || "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function optionalUserId(req, secret) {
  const p = decodeAuth(req, secret);
  return p ? p.user_id : null;
}

function requireAuth(secret) {
  return (req, res, next) => {
    const p = decodeAuth(req, secret);
    if (!p) return res.status(401).json({ message: "Token missing" });
    req.userId = p.user_id;
    req.userRole = p.role;
    next();
  };
}

function requireCreator(secret) {
  return (req, res, next) => {
    const p = decodeAuth(req, secret);
    if (!p) return res.status(401).json({ message: "Token missing" });
    if (p.role !== "creator") return res.status(403).json({ message: "Creator access required" });
    req.userId = p.user_id;
    req.userRole = p.role;
    next();
  };
}

function signUserToken(user, secret) {
  const hours = Number(process.env.JWT_EXPIRY_HOURS) || 24;
  return jwt.sign({ user_id: user.id, role: user.role }, secret, {
    algorithm: "HS256",
    expiresIn: `${hours}h`,
  });
}

const imageInclude = [
  { association: "uploader", attributes: ["id", "username"] },
  { association: "ratings" },
  { association: "comments" },
  { association: "reactions" },
];

export function createApp(sequelize, models) {
  const likeKey = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
  ensureUploadDir();
  const { User, Image, Comment, Rating, Reaction } = models;
  const secret = process.env.SECRET_KEY || "pixshare-secret-key-change-in-prod";
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGINS || "*").trim();
  if (corsOrigins === "*") {
    app.use(cors());
  } else {
    const list = corsOrigins.split(",").map((s) => s.trim()).filter(Boolean);
    app.use(cors({ origin: list.length ? list : true }));
  }

  app.use(express.json());
  app.use("/uploads", express.static(UPLOAD_DIR));

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || "").toLowerCase().replace(/^\./, "");
      cb(null, `${uuidv4().replace(/-/g, "")}.${ext || "bin"}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: MAX_SIZE },
  });

  app.get("/", (_req, res) => {
    res.json({ message: "Lumina API running" });
  });

  app.post("/signup", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    const exists = await User.findOne({ where: { username } });
    if (exists) return res.status(409).json({ message: "Username already taken" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, role: "consumer" });
    const token = signUserToken(user, secret);
    return res.status(201).json({ message: "Account created", token, role: user.role, username: user.username });
  });

  app.post("/login", async (req, res) => {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = signUserToken(user, secret);
    return res.json({ message: "Login successful", token, role: user.role, username: user.username });
  });

  app.get("/me", requireAuth(secret), async (req, res) => {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "Not found" });
    return res.json({ id: user.id, username: user.username, role: user.role });
  });

  app.get("/images", async (req, res) => {
    const userId = optionalUserId(req, secret);
    const images = await Image.findAll({
      order: [["createdAt", "DESC"]],
      include: imageInclude,
    });
    res.json(images.map((img) => buildImageDto(img, userId)));
  });

  app.get("/images/search", async (req, res) => {
    const userId = optionalUserId(req, secret);
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);
    const pat = `%${q}%`;
    const images = await Image.findAll({
      where: {
        [Op.or]: [
          { title: { [likeKey]: pat } },
          { caption: { [likeKey]: pat } },
          { location: { [likeKey]: pat } },
          { people: { [likeKey]: pat } },
        ],
      },
      order: [["createdAt", "DESC"]],
      include: imageInclude,
    });
    res.json(images.map((img) => buildImageDto(img, userId)));
  });

  app.get("/images/:id", async (req, res) => {
    const userId = optionalUserId(req, secret);
    const img = await Image.findByPk(req.params.id, { include: imageInclude });
    if (!img) return res.status(404).json({ message: "Not found" });
    res.json(buildImageDto(img, userId));
  });

  const optionalFileUpload = (req, res, next) => {
    if (req.is("application/json")) return next();
    return upload.single("media_file")(req, res, next);
  };

  app.post("/images", requireCreator(secret), optionalFileUpload, async (req, res) => {
    let mediaType = "image";
    let uploadMethod = "url";
    let title = "";
    let caption = "";
    let location = "";
    let people = "";
    let mediaUrl = "";

    if (req.is("multipart/form-data")) {
      mediaType = String(req.body.media_type || "image").toLowerCase();
      uploadMethod = String(req.body.upload_method || "local").toLowerCase();
      title = String(req.body.title || "").trim();
      caption = String(req.body.caption || "").trim();
      location = String(req.body.location || "").trim();
      people = String(req.body.people || "").trim();
    } else {
      const b = req.body || {};
      mediaType = String(b.media_type || "image").toLowerCase();
      uploadMethod = String(b.upload_method || "url").toLowerCase();
      title = String(b.title || "").trim();
      caption = String(b.caption || "").trim();
      location = String(b.location || "").trim();
      people = String(b.people || "").trim();
      mediaUrl = String(b.media_url || b.image_url || "").trim();
    }

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!ALLOWED_MEDIA.has(mediaType)) return res.status(400).json({ message: "Media type must be image or video" });
    if (!["local", "url"].includes(uploadMethod)) return res.status(400).json({ message: "Upload method must be local or url" });

    if (uploadMethod === "local") {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Media file is required" });
      const ext = (path.extname(file.originalname) || "").slice(1).toLowerCase();
      if (!EXT[mediaType].has(ext)) return res.status(400).json({ message: `Unsupported ${mediaType} file type` });
      const mime = file.mimetype || "";
      const prefix = mediaType === "image" ? "image/" : "video/";
      if (mime && !mime.startsWith(prefix)) return res.status(400).json({ message: `Selected file does not match ${mediaType} media type` });
      mediaUrl = `${publicBase(req)}/uploads/${file.filename}`;
    } else {
      if (!mediaUrl || (!mediaUrl.startsWith("http://") && !mediaUrl.startsWith("https://"))) {
        return res.status(400).json({ message: "A valid media URL is required" });
      }
    }

    const row = await Image.create({
      title,
      caption,
      location,
      people,
      imageUrl: mediaUrl,
      mediaType,
      uploadMethod,
      userId: req.userId,
    });
    return res.status(201).json({ message: "Media uploaded successfully", id: row.id, media_url: mediaUrl });
  });

  app.delete("/images/:id", requireCreator(secret), async (req, res) => {
    const img = await Image.findByPk(req.params.id);
    if (!img) return res.status(404).json({ message: "Not found" });
    if (img.userId !== req.userId) return res.status(403).json({ message: "Not authorized" });
    const local = img.imageUrl && img.imageUrl.includes("/uploads/");
    if (local) {
      const name = img.imageUrl.split("/uploads/").pop();
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(name)));
      } catch {
        /* ignore */
      }
    }
    await img.destroy();
    return res.json({ message: "Image deleted" });
  });

  app.get("/images/:id/stats", requireCreator(secret), async (req, res) => {
    const img = await Image.findByPk(req.params.id, {
      include: [
        { association: "ratings", include: [{ association: "rater", attributes: ["username"] }] },
        { association: "reactions", include: [{ association: "reactor", attributes: ["username"] }] },
        { association: "comments", include: [{ association: "author", attributes: ["username"] }] },
      ],
    });
    if (!img) return res.status(404).json({ message: "Not found" });
    if (img.userId !== req.userId) return res.status(403).json({ message: "You can only view stats for your own images" });

    const ratings = img.ratings || [];
    const reactions = img.reactions || [];
    const reactionCounts = { like: 0, happy: 0, love: 0 };
    for (const r of reactions) {
      if (reactionCounts[r.reactionType] !== undefined) reactionCounts[r.reactionType]++;
    }
    const comments = img.comments || [];

    return res.json({
      image_id: img.id,
      title: img.title,
      image_url: img.imageUrl,
      media_url: img.imageUrl,
      media_type: img.mediaType,
      upload_method: img.uploadMethod,
      avg_rating: ratings.length ? Math.round((ratings.reduce((s, r) => s + r.value, 0) / ratings.length) * 10) / 10 : 0,
      rating_count: ratings.length,
      ratings: ratings.map((r) => ({ username: r.rater?.username || "Deleted", value: r.value })),
      reactions: reactions.map((r) => ({
        username: r.reactor?.username || "Deleted",
        reaction_type: r.reactionType,
        created_at: r.createdAt ? r.createdAt.toISOString() : null,
      })),
      reaction_counts: reactionCounts,
      comments: comments.map((c) => ({
        username: c.author?.username || "Anonymous",
        text: c.text,
        created_at: c.createdAt ? c.createdAt.toISOString() : null,
      })),
    });
  });

  app.get("/comments/:imageId", async (req, res) => {
    const rows = await Comment.findAll({
      where: { imageId: req.params.imageId },
      order: [["createdAt", "DESC"]],
      include: [{ association: "author", attributes: ["username"] }],
    });
    res.json(
      rows.map((c) => ({
        id: c.id,
        text: c.text,
        username: c.author?.username || "Anonymous",
        created_at: c.createdAt ? c.createdAt.toISOString() : null,
      }))
    );
  });

  app.post("/comments", requireAuth(secret), async (req, res) => {
    const imageId = req.body?.image_id;
    const text = String(req.body?.text || "").trim();
    if (!imageId || !text) return res.status(400).json({ message: "image_id and text required" });
    const img = await Image.findByPk(imageId);
    if (!img) return res.status(404).json({ message: "Not found" });
    const c = await Comment.create({ imageId, userId: req.userId, text });
    return res.status(201).json({ message: "Comment added", id: c.id });
  });

  app.post("/ratings", requireAuth(secret), async (req, res) => {
    const imageId = req.body?.image_id;
    const value = Number(req.body?.value);
    if (!imageId || value < 1 || value > 5) return res.status(400).json({ message: "Invalid rating" });
    const img = await Image.findByPk(imageId);
    if (!img) return res.status(404).json({ message: "Not found" });
    const [row, created] = await Rating.findOrCreate({
      where: { imageId, userId: req.userId },
      defaults: { value },
    });
    if (!created) await row.update({ value });
    return res.json({ message: "Rating saved" });
  });

  app.get("/ratings/:imageId", async (req, res) => {
    const img = await Image.findByPk(req.params.imageId);
    if (!img) return res.status(404).json({ message: "Not found" });
    const ratings = await Rating.findAll({ where: { imageId: req.params.imageId } });
    const avg = ratings.length
      ? Math.round((ratings.reduce((s, r) => s + r.value, 0) / ratings.length) * 10) / 10
      : 0;
    res.json({ avg, count: ratings.length });
  });

  app.post("/reactions", requireAuth(secret), async (req, res) => {
    const imageId = req.body?.image_id;
    const reactionType = String(req.body?.reaction_type || "").toLowerCase();
    const allowed = new Set(["like", "happy", "love"]);
    if (!imageId || !allowed.has(reactionType)) {
      return res.status(400).json({ message: "image_id and valid reaction_type are required" });
    }
    const img = await Image.findByPk(imageId);
    if (!img) return res.status(404).json({ message: "Not found" });
    const [row, created] = await Reaction.findOrCreate({
      where: { imageId, userId: req.userId },
      defaults: { reactionType },
    });
    if (!created) await row.update({ reactionType });
    return res.json({ message: "Reaction saved" });
  });

  app.get("/reactions/:imageId", async (req, res) => {
    const img = await Image.findByPk(req.params.imageId);
    if (!img) return res.status(404).json({ message: "Not found" });
    const userId = optionalUserId(req, secret);
    const reactions = await Reaction.findAll({ where: { imageId: req.params.imageId } });
    const counts = { like: 0, happy: 0, love: 0 };
    let my_reaction = null;
    for (const r of reactions) {
      if (counts[r.reactionType] !== undefined) counts[r.reactionType]++;
      if (userId && r.userId === userId) my_reaction = r.reactionType;
    }
    res.json({ counts, my_reaction });
  });

  app.get("/users", requireCreator(secret), async (_req, res) => {
    const users = await User.findAll({
      where: { role: "consumer" },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "username", "createdAt"],
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        created_at: u.createdAt ? u.createdAt.toISOString() : null,
      }))
    );
  });

  app.delete("/users/:id", requireCreator(secret), async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.userId) return res.status(403).json({ message: "Cannot delete yourself" });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Not found" });
    if (user.role === "creator") return res.status(403).json({ message: "Cannot delete creator accounts" });
    const name = user.username;
    await user.destroy();
    return res.json({ message: `User '${name}' deleted successfully` });
  });

  app.post("/admin/seed-creator", async (_req, res) => {
    res.status(501).json({ message: "Not implemented; creator is seeded on server start" });
  });

  return app;
}
