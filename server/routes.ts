import express, { type Express } from "express";
import type { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { registerAuthRoutes } from "./routes/auth";
import { registerPaymentRoutes } from "./routes/payment.ts";
import { registerUserPaymentMethodRoutes } from "./routes/userPaymentMethods";
import { registerPharmacyAdminRoutes } from "./routes/pharmacyAdmin";
import { registerAdminRoutes } from "./routes/admin";
import { registerPharmacyRoutes } from "./routes/pharmacy";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerUploadRoutes } from "./routes/upload";
import { ensureProductColumns } from "./utils/databaseUtils";

// OpenAI configuration from the AI integration blueprint
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Socket.IO instance
let io: SocketIOServer;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.IO connection handling
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join pharmacy room for notifications
    socket.on('join-pharmacy', (pharmacyId: number) => {
      socket.join(`pharmacy-${pharmacyId}`);
      console.log(`Socket ${socket.id} joined pharmacy-${pharmacyId}`);
    });

    // Leave pharmacy room
    socket.on('leave-pharmacy', (pharmacyId: number) => {
      socket.leave(`pharmacy-${pharmacyId}`);
      console.log(`Socket ${socket.id} left pharmacy-${pharmacyId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Register authentication routes
  registerAuthRoutes(app);

  // Health check endpoint for deployment monitoring
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      await storage.getPharmacies();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed"
      });
    }
  });

  // Register payment routes
  registerPaymentRoutes(app);

  // Register user payment method routes
  registerUserPaymentMethodRoutes(app);

  // Register pharmacy admin routes
  registerPharmacyAdminRoutes(app);

  // Register admin routes
  registerAdminRoutes(app);

  // Register pharmacy portal routes
  registerPharmacyRoutes(app);

  // Register catalog routes
  registerCatalogRoutes(app);

  // Register upload routes
  registerUploadRoutes(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0"
    });
  });

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
      // Only return active pharmacies for the client app
      const allPharmacies = await storage.getPharmacies();
      const activePharmacies = allPharmacies.filter(p => p.status === 'active');
      res.json(activePharmacies);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) return res.status(400).json({ message: "UserId required" });
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Erro ao buscar pedidos do usuário" });
    }
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      console.log("Creating order with data:", req.body);
      let { items, ...orderData } = req.body;

      // Handle items as string if requested from some clients
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (e) {
          console.error("Failed to parse items from string:", items);
          items = [];
        }
      }

      // Ensure mandatory fields have values to satisfy DB constraints
      const processedOrderData = {
        ...orderData,
        customerName: orderData.customerName || "Cliente",
        customerPhone: orderData.customerPhone || "+244900000000",
        customerAddress: orderData.customerAddress || "Endereço não fornecido",
        paymentMethod: orderData.paymentMethod || "cash",
        total: String(orderData.total || "0"),
        deliveryFee: String(orderData.deliveryFee || "0"),
        customerLat: orderData.customerLat ? String(orderData.customerLat) : null,
        customerLng: orderData.customerLng ? String(orderData.customerLng) : null,
      };

      console.log("Processed order data for insertion:", processedOrderData);
      const order = await storage.createOrder(processedOrderData);

      // Create order items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const orderItemsData = items.map((item: any) => {
          // Handle cases where item might have a nested product object
          const product = item.product || {};
          const productId = item.productId || product.id || 1;
          const productName = item.productName || item.name || product.name || "Produto";
          const unitPrice = item.unitPrice || item.price || product.price || "0";
          const quantity = item.quantity || 1;

          return {
            orderId: order.id,
            productId,
            productName,
            quantity,
            unitPrice: String(unitPrice),
            totalPrice: String((Number(unitPrice) * quantity) || 0),
          };
        });
        await storage.createOrderItems(orderItemsData);
      }

      // Emit real-time notification to pharmacy
      if (io) {
        try {
          io.to(`pharmacy-${order.pharmacyId}`).emit('new-order', {
            id: order.id,
            customerName: order.customerName,
            total: order.total,
            items: items || [],
          });
        } catch (socketError) {
          console.warn('socket emit falhou (pharmacy notification):', socketError);
          // Não falhar o pedido por erro de websocket
        }
      }

      console.log(`ALERTA: Novo pedido #${order.id} para a farmácia ${order.pharmacyId}. Valor: ${order.total} AOA`);
      res.status(201).json(order);
    } catch (err: any) {
      console.error("Error creating order:", err);
      res.status(500).json({
        message: "Erro ao criar pedido: " + (err.message || "Erro desconhecido"),
        detailed: err.message || err
      });
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

  // Create order items
  app.post("/api/order-items", async (req, res) => {
    try {
      const items = await storage.createOrderItems([req.body]);
      res.json(items[0]);
    } catch (err: any) {
      console.error("Error creating order item:", err);
      res.status(500).json({ message: "Erro ao criar item do pedido: " + err.message, detailed: err });
    }
  });

  // Call the seed function
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  // First ensure all columns exist
  try {
    await ensureProductColumns();
    console.log("Database columns ensured successfully");
  } catch (error) {
    console.error("Error ensuring database columns:", error);
    // Continue anyway - the columns might already exist
  }

  // Seed Admin Users
  const existingAdmins = await storage.getAdminUsers();
  if (existingAdmins.length === 0) {
    const adminPassword = await bcrypt.hash("admin123", 10);
    await storage.createAdminUser({
      email: "admin@farmacis.com",
      password: adminPassword,
      name: "Administrador Principal",
      role: "super_admin"
    });
    console.log("✓ Admin user created: admin@farmacis.com / admin123");
  }

  // Seed Pharmacies
  const pharmacyData = [
    { name: "Farmácia de Luanda", email: "luanda@farmacia.com", phone: "+244923456789", address: "Rua Rainha Ginga, Luanda", lat: "-8.8147", lng: "13.2306", status: "active" },
    { name: "Farmácia Popular", email: "popular@farmacia.com", phone: "+244923456790", address: "Avenida Comandante Valódia, Luanda", lat: "-8.8200", lng: "13.2400", status: "active" },
    { name: "Farmácia Central", email: "central@farmacia.com", phone: "+244923456791", address: "Largo do Kinaxixi, Luanda", lat: "-8.8100", lng: "13.2350", status: "active" }
  ];

  const existingPharmacies = await storage.getPharmacies();
  if (existingPharmacies.length === 0) {
    for (const p of pharmacyData) {
      await storage.createPharmacy(p);
    }
    console.log(`✓ ${pharmacyData.length} pharmacies created`);
  }

  // Ensure all pharmacies have admin credentials
  const allPharmacies = await storage.getPharmacies();
  const existingPharmacyAdmins = await storage.getPharmacyAdmins();
  
  for (const pharmacy of allPharmacies) {
    const hasAdmin = existingPharmacyAdmins.some(admin => admin.pharmacyId === pharmacy.id);
    
    if (!hasAdmin) {
      const farmPassword = await bcrypt.hash("farm123", 10);
      await storage.createPharmacyAdmin({
        pharmacyId: pharmacy.id,
        email: `admin.${pharmacy.name.toLowerCase().replace(/\s+/g, '')}@farmacia.com`,
        password: farmPassword,
        name: `Admin ${pharmacy.name}`,
        role: "admin"
      });
      console.log(`✓ Created admin for ${pharmacy.name}: admin.${pharmacy.name.toLowerCase().replace(/\s+/g, '')}@farmacia.com / farm123`);
    }
  }

  const seedData = [
    {
      name: "Paracetamol 500mg",
      description: "Analgésico e antitérmico indicado para o alívio temporário da dor leve a moderada associada a gripes e resfriados.",
      price: "1250",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60",
      diseases: ["dor de cabeça", "febre", "inflamação"],
      activeIngredient: "Paracetamol",
      category: "medicamento",
      brand: "Genérico",
      dosage: "500mg",
      prescriptionRequired: false,
      stock: 100,
      status: "active"
    },
    {
      name: "Ibuprofeno 400mg",
      description: "Anti-inflamatório, analgésico e antitérmico para o alívio das dores de cabeça, dores musculares e febre.",
      price: "1500",
      imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=60",
      diseases: ["dor de cabeça", "inflamação", "dor muscular"],
      activeIngredient: "Ibuprofeno",
      category: "medicamento",
      brand: "Genérico",
      dosage: "400mg",
      prescriptionRequired: false,
      stock: 80,
      status: "active"
    },
    {
      name: "Loratadina 400mg",
      description: "Anti-inflamatório, analgésico e antitérmico para o alívio das dores de cabeça, dores musculares e febre.",
      price: "1500",
      imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500&auto=format&fit=crop&q=60",
      diseases: ["alergia", "rinite", "urticária"],
      activeIngredient: "Loratadina",
      category: "medicamento",
      brand: "Genérico",
      dosage: "10mg",
      prescriptionRequired: false,
      stock: 60,
      status: "active"
    },
    {
      name: "Amoxicilina 500mg",
      description: "Antibiótico utilizado no tratamento de diversas infecções bacterianas.",
      price: "3500",
      imageUrl: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=500&auto=format&fit=crop&q=60",
      diseases: ["infecção de garganta", "infecção urinária", "pneumonia"],
      activeIngredient: "Amoxicilina",
      category: "medicamento",
      brand: "Genérico",
      dosage: "500mg",
      prescriptionRequired: true,
      stock: 40,
      status: "active"
    },
    {
      name: "Vitamina D3 2000UI",
      description: "Suplemento vitamínico essencial para a saúde óssea e imunidade.",
      price: "2500",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format&fit=crop&q=60",
      diseases: ["deficiência de vitamina D", "fraqueza óssea"],
      activeIngredient: "Colecalciferol",
      category: "vitamina",
      brand: "VitaPlus",
      dosage: "2000UI",
      prescriptionRequired: false,
      stock: 50,
      status: "active"
    }
  ];

  try {
    await storage.seedProducts(seedData);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
