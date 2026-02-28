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
    // ... existing identify code
  });

  app.get(api.pharmacies.list.path, async (req, res) => {
    try {
      const allPharmacies = await storage.getPharmacies();
      res.json(allPharmacies);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
      // Aqui simularíamos o alerta para a farmácia
      console.log(`ALERTA: Novo pedido para a farmácia ${order.pharmacyId}. Valor: ${order.total} AOA`);
      res.status(201).json(order);
    } catch (err) {
      res.status(500).json({ message: "Erro ao criar pedido" });
    }
  });

  app.get(api.orders.status.path, async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar pedido" });
    }
  });

  // Call the seed function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const pharmacyData = [
    { name: "Farmácia de Luanda", address: "Rua Rainha Ginga, Luanda", lat: "-8.8147", lng: "13.2306" },
    { name: "Farmácia Popular", address: "Avenida Comandante Valódia, Luanda", lat: "-8.8200", lng: "13.2400" },
    { name: "Farmácia Central", address: "Largo do Kinaxixi, Luanda", lat: "-8.8100", lng: "13.2350" }
  ];

  const existingPharmacies = await storage.getPharmacies();
  if (existingPharmacies.length === 0) {
    for (const p of pharmacyData) {
      await storage.createPharmacy(p);
    }
  }

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
