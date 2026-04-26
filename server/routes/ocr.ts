import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { processImage, processBase64 } from "../services/ocr";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "ocr");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Apenas imagens permitidas"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function registerOCRRoutes(app: express.Application) {
  // Upload image and extract medications
  app.post("/api/ocr/extract", upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const result = await processImage(req.file.path);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        medications: result.medications,
        formatted: result.formattedString,
        raw: result.rawText,
      });
    } catch (error: any) {
      console.error("[OCR] Error:", error);
      res.status(500).json({ error: error.message || "Erro no processamento" });
    }
  });

  // Process base64 image
  app.post("/api/ocr/extract-base64", async (req: Request, res: Response) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Imagem base64 necessária" });
      }

      const result = await processBase64(image, mimeType || "image/jpeg");

      res.json({
        success: true,
        medications: result.medications,
        formatted: result.formattedString,
        raw: result.rawText,
      });
    } catch (error: any) {
      console.error("[OCR] Error:", error);
      res.status(500).json({ error: error.message || "Erro no processamento" });
    }
  });

  console.log("[OCR] Routes registered");
}
