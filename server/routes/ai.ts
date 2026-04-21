import express, { Express, Request, Response } from "express";

// Check if we're in Node 18+ where fetch is native
const hasNativeFetch = typeof globalThis.fetch === 'function';

// Generate fallback response when network is unavailable
function generateFallbackResponse(text: string, isVisionRequest: boolean): string {
    if (isVisionRequest) {
        return "Modo Offline\n\nNao consigo analisar imagens neste momento porque estou sem ligacao a internet.\n\nPor favor, tente novamente mais tarde ou descreva o que ves na imagem.";
    }

    const lowerText = text.toLowerCase();

    // Simple pattern matching for common medication queries
    if (lowerText.includes('paracetamol') || lowerText.includes('ben-u-ron')) {
        return "Paracetamol (Ben-u-ron)\n\nUso: Analgesico e antipiretico para dor e febre\nDosagem Adultos: 500-1000mg a cada 4-6 horas (max 4g/dia)\nPrecaucoes: Nao exceder dose maxima. Cuidado com problemas hepaticos.\n\nVer no catalogo: /catalogo?search=paracetamol\n\nNota: Este e um modo offline. Consulte um profissional de saude para diagnostico.";
    }

    if (lowerText.includes('ibuprofeno') || lowerText.includes('brufen') || lowerText.includes('adv')) {
        return "Ibuprofeno (Brufen/Advil)\n\nUso: Anti-inflamatorio, analgesico e antipiretico\nDosagem Adultos: 200-400mg a cada 6-8 horas (max 1200mg/dia sem receita)\nContraindicacoes: Ulceras, problemas renais, gravidez (3o trimestre)\n\nVer no catalogo: /catalogo?search=ibuprofeno\n\nNota: Este e um modo offline. Consulte um profissional de saude.";
    }

    if (lowerText.includes('amoxicilina')) {
        return "Amoxicilina\n\nUso: Antibiotico para infeccoes bacterianas\nDosagem: Conforme prescricao medica (geralmente 500mg a cada 8 horas)\nATENCAO: Requer receita medica!\n\nVer no catalogo: /catalogo?search=amoxicilina\n\nNota: Este e um modo offline. Consulte um medico antes de usar antibioticos.";
    }

    if (lowerText.includes('dor') || lowerText.includes('cabeça')) {
        return "Dor de Cabeca\n\nSugestoes comuns:\n- Paracetamol: Mais seguro para a maioria das pessoas\n- Ibuprofeno: Se nao houver contraindicacoes\n- Repouso em local escuro e silencioso\n- Hidratacao adequada\n\nVer no catalogo: /catalogo?search=paracetamol\n\nNota: Se a dor persistir ou for intensa, consulte um medico. Modo offline ativo.";
    }

    if (lowerText.includes('febre')) {
        return "Febre\n\nMedicamentos sugeridos:\n- Paracetamol: Reduz febre de forma segura\n- Ibuprofeno: Alternativa se nao houver contraindicacoes\n\nCuidados gerais:\n- Hidratacao frequente\n- Repouso\n- Roupas leves\n\nVer no catalogo: /catalogo?search=paracetamol\n\nNota: Febre maior que 39C ou mais de 3 dias requer consulta medica. Modo offline ativo.";
    }

    // Default response
    return `Assistente Farmacis (Modo Offline)\n\nRecebi a tua mensagem: "${text}"\n\nInfelizmente, estou em modo offline porque nao consigo ligar aos servidores de IA.\n\nPosso ajudar com:\n- Informacoes basicas sobre medicamentos comuns (paracetamol, ibuprofeno, amoxicilina)\n- Dicas gerais para dores de cabeca e febre\n- Direcionar para consulta medica\n\nVer catalogo completo: /catalogo\n\nPara outras questoes, consulte um profissional de saude.\n\nNota: Modo offline ativo - respostas limitadas.`;
}

export function registerAIRoutes(app: Express) {
    app.post("/api/ai/chat", async (req: Request, res: Response) => {
        try {
            const { text, imageBase64, conversationHistory } = req.body;
            console.log("[AI Proxy] Received request for Vanessa AI");
            console.log("[AI Proxy] Node version:", process.version);
            console.log("[AI Proxy] Native fetch available:", hasNativeFetch);

            const SYSTEM_PROMPT = `És um assistente de saúde profissional e empático para uma plataforma de farmácia digital chamada Farmacis. Ajuda os utilizadores com: Informações sobre medicamentos e dosagens; Identificação de sintomas (sem diagnosticar); Orientação sobre consultas médicas; Análise de receitas médicas (quando enviadas por imagem); Recomendações de produtos do catálogo.

IMPORTANTE - Formatação de medicamentos:
Quando recomendares ou mencionares nomes de medicamentos, envolve SEMPRE o nome do medicamento com duplos colchetes assim: [[NomeMedicamento]]

Exemplos:
- "Recomendo [[Paracetamol]] para dor de cabeça"
- "Podes tomar [[Ibuprofeno]] ou [[Aspirina]]"
- "O [[Amoxicilina 500mg]] é um antibiótico comum"

Regras:
- Usa [[ ]] APENAS para nomes de medicamentos concretos
- Não uses [[ ]] para sintomas, doenças ou instruções gerais
- Mantém o nome exacto como apareceria numa farmácia
- Continua a responder em português de Angola

IMPORTANTE: Nunca substituís um médico. Sempre recomenda consultar um profissional de saúde para diagnósticos e tratamentos. Responde em português de Angola de forma clara e concisa.`;

            // Use any AI API key available in env
            const apiKey = process.env.VITE_AI_API_KEY || process.env.VITE_SPLIT_SEARCH_AI_KEY || process.env.AI_API_KEY;

            console.log("[AI Proxy] Checking API key...", apiKey ? "Key found (length: " + apiKey.length + ")" : "Key NOT found");

            if (!apiKey) {
                console.error("[AI Proxy] API Key not found. Env vars:", Object.keys(process.env).filter(k => k.includes('AI') || k.includes('KEY')));
                return res.status(500).json({ error: "AI API Key not configured on server" });
            }

            const isVisionRequest = !!imageBase64;
            const requestBody = {
                service: isVisionRequest ? 'vision' : 'text',
                input: isVisionRequest
                    ? { text: text || 'Analisa esta imagem médica.', image_base64: imageBase64 }
                    : { text: text || 'Olá' },
                request_prompt: SYSTEM_PROMPT,
                conversation: conversationHistory || [],
            };

            console.log("[AI Proxy] Calling Vanessa API...");

            let response;
            try {
                response = await fetch('https://vanessa-getway.tuyenecomesso.com/v1/inference', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
            } catch (fetchError: any) {
                console.error('[AI Proxy] Fetch error:', fetchError);
                console.log('[AI Proxy] Network unavailable - using fallback mode');

                // Fallback mode for offline development
                const fallbackResponse = generateFallbackResponse(text, isVisionRequest);
                return res.json({
                    output_text: fallbackResponse,
                    raw: { fallback: true, reason: 'Network unavailable' }
                });
            }

            console.log("[AI Proxy] Vanessa API response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[AI Proxy] Vanessa API error response:', response.status, errorData);
                return res.status(response.status).json({
                    error: "Vanessa API error",
                    status: response.status,
                    details: errorData
                });
            }

            const data = await response.json();
            console.log("[AI Proxy] Success - output length:", data.output_text?.length || 0);
            res.json({ output_text: data.output_text || null, raw: data });
        } catch (err: any) {
            console.error('[AI Proxy] Catch error:', err);
            console.error('[AI Proxy] Error stack:', err.stack);
            console.error('[AI Proxy] Request body received:', JSON.stringify(req.body, null, 2).substring(0, 500));
            res.status(500).json({
                error: "Internal Server Error",
                message: err.message,
                cause: err.cause?.message,
                stack: err.stack,
            });
        }
    });

    app.get("/api/ai/ping", (req, res) => {
        res.json({
            status: "ok",
            node: process.version,
            hasKey: !!(process.env.VITE_AI_API_KEY || process.env.VITE_SPLIT_SEARCH_AI_KEY || process.env.AI_API_KEY)
        });
    });
}
