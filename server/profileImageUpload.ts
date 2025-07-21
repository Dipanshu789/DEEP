import type { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "uploads");
const storageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Use userId and timestamp for uniqueness
    const userId = req.body.userId || req.query.userId || "unknown";
    const ext = path.extname(file.originalname);
    cb(null, `profile_${userId}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storageEngine });

export function registerProfileImageRoute(app: Express) {
  app.post("/api/user/profile-image", upload.single("profileImage"), async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId || req.query.userId;
      if (!userId) return res.status(400).json({ message: "Missing userId" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      // Save the relative URL to DB
      const imageUrl = `/uploads/${req.file.filename}`;
      await storage.updateUserProfile(userId, { profileImageUrl: imageUrl });
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image", error: (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Serve uploaded images statically
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    res.sendFile(filePath, (err) => {
      if (err) next();
    });
  });
}
