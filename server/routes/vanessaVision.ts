import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "vanessa");
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

function fileToBase64(filePath: string): string {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString('base64');
}

async function analyzeImageWithVanessa(imageBase64: string, prompt?: string): Promise<any> {
  const apiKey = process.env.VITE_AI_API_KEY || process.env.VITE_SPLIT_SEARCH_AI_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key da Vanessa não configurada");
  }

  const SYSTEM_PROMPT = `És um assistente de saúde profissional e empático para uma plataforma de farmácia digital chamada Farmacis. 

Quando analisares imagens médicas:
1. Identifica medicamentos, embalagens farmacêuticas, ou documentos médicos
2. Descreve o que vês na imagem de forma clara
3. Se for uma receita médica, extrai os medicamentos prescritos
4. Se for um medicamento, identifica o nome, dosagem se visível
5. Dá informações úteis sobre o que identificaste

IMPORTANTE: Nunca substituís um médico. Sempre recomenda consultar um profissional de saúde para diagnósticos e tratamentos. Responde em português de Angola de forma clara e concisa.`;

  const requestBody = {
    service: 'vision',
    input: {
      text: prompt || 'Analisa esta imagem médica/farmacêutica.',
      image_base64: imageBase64
    },
    request_prompt: SYSTEM_PROMPT,
    conversation: [],
  };

  const response = await fetch('https://vanessa-gateway-api.tuyenecomesso.com/v1/inference', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Vanessa API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}

export function registerVanessaVisionRoutes(app: express.Application) {
  // Upload image and analyze with Vanessa
  app.post("/api/vanessa/analyze-image", upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const { prompt } = req.body;

      console.log("[Vanessa Vision] Processando imagem:", req.file.filename);

      // Convert image to base64
      const imageBase64 = fileToBase64(req.file.path);

      // Clean up uploaded file after processing
      fs.unlinkSync(req.file.path);

      // Analyze with Vanessa
      const result = await analyzeImageWithVanessa(imageBase64, prompt);

      console.log("[Vanessa Vision] Análise concluída");

      res.json({
        success: true,
        analysis: result.output_text || "Sem resposta da Vanessa",
        raw: result,
      });
    } catch (error: any) {
      console.error("[Vanessa Vision] Erro:", error);
      res.status(500).json({
        error: error.message || "Erro no processamento da imagem",
      });
    }
  });

  // Analyze base64 image directly
  app.post("/api/vanessa/analyze-base64", async (req: Request, res: Response) => {
    try {
      const { imageBase64, prompt } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Imagem base64 necessária" });
      }

      console.log("[Vanessa Vision] Processando imagem base64");

      // Analyze with Vanessa
      const result = await analyzeImageWithVanessa(imageBase64, prompt);

      console.log("[Vanessa Vision] Análise concluída");

      res.json({
        success: true,
        analysis: result.output_text || "Sem resposta da Vanessa",
        raw: result,
      });
    } catch (error: any) {
      console.error("[Vanessa Vision] Erro:", error);
      res.status(500).json({
        error: error.message || "Erro no processamento da imagem",
      });
    }
  });

  // Health check endpoint
  app.get("/api/vanessa/status", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.VITE_AI_API_KEY || process.env.VITE_SPLIT_SEARCH_AI_KEY || process.env.AI_API_KEY;

      if (!apiKey) {
        return res.status(503).json({
          status: "unconfigured",
          message: "API Key da Vanessa não configurada",
        });
      }

      // Simple ping to Vanessa API
      const response = await fetch('https://vanessa-gateway-api.tuyenecomesso.com/v1/inference', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }).catch(() => null);

      res.json({
        status: "ok",
        apiConnected: response !== null,
        hasApiKey: true,
      });
    } catch (error) {
      res.status(503).json({
        status: "error",
        message: "Erro ao verificar status",
      });
    }
  });

  console.log("[Vanessa Vision] Rotas registradas");
}
