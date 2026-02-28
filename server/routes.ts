import express, { type Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// OpenAI configuration from the AI integration blueprint
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.products.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const allProducts = await storage.getProducts(search);
      res.json(allProducts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post(api.ai.identifyPill.path, express.json({ limit: '10mb' }), async (req, res) => {
    try {
      const input = api.ai.identifyPill.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Você é um farmacêutico assistente especialista em identificar medicamentos. 
Analise a imagem da pílula/caixa/receita enviada.
Retorne um JSON estritamente neste formato:
{
  "identifiedPill": "Nome do medicamento",
  "description": "Uma breve descrição do que ele é e como age",
  "diseases": ["Doença 1", "Doença 2"]
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique esta pílula/medicamento." },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${input.imageBase64}`,
                }
              }
            ]
          }
        ]
      });

      const aiContent = response.choices[0]?.message?.content;
      if (!aiContent) throw new Error("No response from AI");

      const parsedAiResponse = JSON.parse(aiContent);
      
      // Encontrar produtos recomendados baseados nas doenças
      const allProducts = await storage.getProducts();
      
      const recommended = allProducts.filter(p => 
        p.diseases.some(d => 
          parsedAiResponse.diseases?.some((ad: string) => 
            d.toLowerCase().includes(ad.toLowerCase()) || ad.toLowerCase().includes(d.toLowerCase())
          )
        )
      );

      res.status(200).json({
        identifiedPill: parsedAiResponse.identifiedPill || "Medicamento Desconhecido",
        description: parsedAiResponse.description || "Não foi possível descrever.",
        diseases: parsedAiResponse.diseases || [],
        recommendedProductIds: recommended.map(r => r.id)
      });
      
    } catch (err) {
      console.error(err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Erro ao identificar o medicamento." });
    }
  });

  // Call the seed function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const seedData = [
    {
      name: "Paracetamol 500mg",
      description: "Analgésico e antitérmico indicado para o alívio temporário da dor leve a moderada associada a gripes e resfriados.",
      price: "1250",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      diseases: ["dor de cabeça", "febre", "gripe"],
      activeIngredient: "Paracetamol"
    },
    {
      name: "Ibuprofeno 750mg",
      description: "Anti-inflamatório não esteroide (AINE) indicado para alívio de dor, inflamação e febre.",
      price: "1890",
      imageUrl: "https://images.unsplash.com/photo-1550572017-0d5ab1c572bb?w=500&auto=format&fit=crop&q=60",
      diseases: ["dor muscular", "inflamação", "febre"],
      activeIngredient: "Ibuprofeno"
    },
    {
      name: "Loratadina 400mg",
      description: "Anti-inflamatório, analgésico e antitérmico para o alívio das dores de cabeça, dores musculares e febre.",
      price: "1500",
      imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=60",
      diseases: ["alergia", "rinite", "urticária"],
      activeIngredient: "Loratadina"
    },
    {
      name: "Amoxicilina 500mg",
      description: "Antibiótico utilizado no tratamento de diversas infecções bacterianas.",
      price: "3500",
      imageUrl: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=500&auto=format&fit=crop&q=60",
      diseases: ["infecção de garganta", "infecção urinária", "pneumonia"],
      activeIngredient: "Amoxicilina"
    }
  ];

  try {
    await storage.seedProducts(seedData);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
