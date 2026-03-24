import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    // Em alguns ambientes de build, a estrutura pode variar. 
    // Vamos tentar subir um nível se não encontrar.
    const altDistPath = path.resolve(__dirname, "..", "dist", "public");
    if (fs.existsSync(altDistPath)) {
      app.use(express.static(altDistPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(altDistPath, "index.html"));
      });
      return;
    }

    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Rota catch-all correta para o Express resolver o roteamento do frontend
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
