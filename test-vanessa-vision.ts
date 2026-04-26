// Script de teste para a API Vanessa Vision
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:5001/api/vanessa";

async function testVanessaVision() {
  console.log("=== Teste da API Vanessa Vision ===\n");

  // Test 1: Status endpoint
  console.log("1. Testando endpoint de status...");
  try {
    const response = await fetch(`${API_URL}/status`);
    const data = await response.json();
    console.log("Status:", data);
    console.log("✅ Status OK\n");
  } catch (error: any) {
    console.log("❌ Erro no status:", error.message, "\n");
  }

  // Test 2: Verificar se há imagens na pasta uploads/ocr para testar
  const ocrDir = path.join(process.cwd(), "uploads", "ocr");
  const files = fs.existsSync(ocrDir) ? fs.readdirSync(ocrDir) : [];

  if (files.length === 0) {
    console.log("2. Nenhuma imagem encontrada em uploads/ocr para teste");
    console.log("   Coloque uma imagem na pasta uploads/ocr e rode o teste novamente\n");
    return;
  }

  // Test 3: Analisar imagem com base64
  console.log(`2. Testando análise de imagem (${files[0]})...`);
  try {
    const imagePath = path.join(ocrDir, files[0]);
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    const response = await fetch(`${API_URL}/analyze-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        prompt: "Identifica o que está nesta imagem médica ou farmacêutica."
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Análise concluída!");
      console.log("Resposta:", data.analysis?.substring(0, 200) + "..." || "Sem análise");
    } else {
      console.log("❌ Erro na análise:", data.error);
    }
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
  }

  console.log("\n=== Teste concluído ===");
}

testVanessaVision();
