import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: "50mb" }));

  // API to get image as base64
  app.get("/api/image/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), filename);
    
    if (fs.existsSync(filePath)) {
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString("base64");
      const mimeType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
      res.json({ base64: base64Image, mimeType });
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // API to save image from base64
  app.post("/api/image/save", (req, res) => {
    const { filename, base64 } = req.body;
    const filePath = path.join(process.cwd(), filename);
    
    try {
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
