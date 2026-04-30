import fs from "fs";

// Vanessa é o serviço principal para OCR
const VANESSA_API_KEY = process.env.VITE_AI_API_KEY || process.env.VITE_SPLIT_SEARCH_AI_KEY || process.env.AI_API_KEY;
const VANESSA_API_URL = "https://vanessa-gateway-api.tuyenecomesso.com/v1/inference";

export interface Medication {
  nome: string;
  dosagem: string;
  marca?: string;
  quantidade?: string;
  periodo_consumo?: string;
  frequencia?: string;
  instrucoes?: string;
  preco_caixa?: string;
  preco_caixa_tipo?: 'individual' | 'por';
  preco_lamina?: string;
  preco_lamina_tipo?: 'individual' | 'por';
  quantidade_comprimidos?: string;
  quantidade_laminas?: string;
}

export interface OCRResult {
  medications: Medication[];
  formattedString: string;
  rawText: string;
}

function getMimeType(path: string): string {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function processImage(imagePath: string): Promise<OCRResult> {
  const buffer = fs.readFileSync(imagePath);
  return processBase64(buffer.toString("base64"), getMimeType(imagePath));
}

export async function processBase64(base64: string, mime: string): Promise<OCRResult> {
  if (!VANESSA_API_KEY) {
    throw new Error("API Key da Vanessa não configurada");
  }

  return await processWithVanessa(base64, mime);
}

async function processWithVanessa(base64: string, mime: string): Promise<OCRResult> {
  const SYSTEM_PROMPT = `Extrai informações de medicamentos da imagem de uma receita médica. Responde em JSON estrito:
{
  "medicamentos": [
    {
      "nome": "Nome do medicamento",
      "dosagem": "500mg",
      "marca": "Marca/Genérico do fabricante",
      "quantidade": "30 comprimidos",
      "periodo_consumo": "30 dias",
      "frequencia": "1x ao dia",
      "instrucoes": "Tomar após as refeições",
      "preco_caixa": "15.50",
      "preco_caixa_tipo": "individual",
      "preco_lamina": "0.52",
      "preco_lamina_tipo": "por",
      "quantidade_comprimidos": "30",
      "quantidade_laminas": "10"
    }
  ]
}

IMPORTANTE sobre marca:
- Extrai a marca/fabricante/laboratório do medicamento se visível na receita ou embalagem
- Se for genérico, indica "Genérico" ou o laboratório fabricante
- Exemplos: "Bayer", "Pfizer", "Genérico", "Medley", "Teuto"

IMPORTANTE sobre quantidade:
- Se a receita indicar período de consumo (ex: "30 dias", "2 meses") e frequência (ex: "2x ao dia", "a cada 8h"), CALCULA a quantidade total necessária
- Exemplo: "30 dias, 2x ao dia" = 60 unidades
- Exemplo: "7 dias, 3x ao dia" = 21 unidades
- Se não conseguires calcular, deixa "quantidade" vazio

IMPORTANTE sobre preços e quantidades:
- Extrai preço da caixa se visível (ex: "R$ 15,50")
- Indica se o preço é "individual" (por unidade) ou "por" (por caixa)
- Extrai preço por lâmina/comprimido se visível
- Indica tipo para preço por lâmina: "individual" ou "por"
- Extrai quantidade de comprimidos na caixa
- Extrai quantidade de lâminas na caixa (se aplicável, ex: número de tiras)

Se não encontrares medicamentos, retorna {"medicamentos": []}.`;

  const requestBody = {
    service: 'vision',
    input: {
      text: 'Extrai medicamentos desta imagem em formato JSON.',
      image_base64: base64
    },
    request_prompt: SYSTEM_PROMPT,
    conversation: [],
  };

  const response = await fetch(VANESSA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VANESSA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Vanessa API] Status ${response.status}:`, errorText);
    throw new Error(`Vanessa API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.output_text || "";
  let meds: Medication[] = [];

  try {
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (json) {
      const p = JSON.parse(json);
      meds = p.medicamentos || p.medications || [];
    }
  } catch {
    meds = parseText(content);
  }

  return {
    medications: meds,
    formattedString: meds.map(m => `${m.nome}${m.marca ? ` (${m.marca})` : ''}, ${m.dosagem}`).join("; "),
    rawText: content,
  };
}

function parseText(text: string): Medication[] {
  const meds: Medication[] = [];
  for (const line of text.split("\n")) {
    const m = line.match(/([A-Za-z\s]+)\s*(\d+(?:mg|ml|g))/i);
    if (m) meds.push({ nome: m[1].trim(), dosagem: m[2] });
  }
  return meds;
}
