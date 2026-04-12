import express, { type Express } from "express";
import type { Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { db } from "./db";
import { prescriptions, orders, systemSettings } from "@shared/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { registerAuthRoutes } from "./routes/auth";
import { registerPaymentRoutes } from "./routes/payment";
import { registerUserPaymentMethodRoutes } from "./routes/userPaymentMethods";
import { registerPharmacyAdminRoutes } from "./routes/pharmacyAdmin";
import { registerAdminRoutes } from "./routes/admin";
import { registerPharmacyRoutes } from "./routes/pharmacy";
import { registerCatalogRoutes } from "./routes/catalog";
import { registerUploadRoutes } from "./routes/upload";
import { registerPrescriptionRoutes } from "./routes/prescriptions";
import { registerSettingsRoutes } from "./routes/settings";
import { registerLocationRoutes } from "./routes/location";
import { registerMedicalRoutes } from "./routes/medical";
import { ensureProductColumns, ensureOrderColumns, ensurePharmacyColumns } from "./utils/databaseUtils";

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

  // Register pharmacy portal routes (must be before pharmacyAdmin for specific routes like /pending-count)
  registerPharmacyRoutes(app);

  // Register pharmacy admin routes
  registerPharmacyAdminRoutes(app);

  // Register admin routes
  registerAdminRoutes(app);

  // Register catalog routes
  registerCatalogRoutes(app);

  // Register upload routes
  registerUploadRoutes(app);

  // Register prescription routes
  registerPrescriptionRoutes(app);

  // Register settings routes
  registerSettingsRoutes(app);

  // Register location routes
  registerLocationRoutes(app);

  // Register medical routes
  registerMedicalRoutes(app);

  app.get(api.products.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      let products = await storage.getProducts();
      
      if (search) {
        const query = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.activeIngredient && p.activeIngredient.toLowerCase().includes(query)) ||
          (Array.isArray(p.diseases) && p.diseases.some(d => d.toLowerCase().includes(query)))
        );
      }
      res.json(products);
    } catch (err) {
      console.error("DETAILED ERROR in GET /api/products:", err);
      res.status(500).json({ 
        message: "Failed to fetch products",
        error: err instanceof Error ? err.message : String(err),
        stack: process.env.NODE_ENV === 'development' ? (err as Error).stack : undefined
      });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      res.json(product);
    } catch (err) {
      console.error("Error in GET /api/products/:id:", err);
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
      console.error("[API] Error fetching user orders:", err);
      if (err instanceof Error) {
        console.error("[API] Error stack:", err.stack);
      }
      res.status(500).json({ 
        message: "Erro ao buscar pedidos do usuário",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // Update order status (user app) - for cash payment confirmation
  app.patch("/api/user/orders/:orderId/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { paymentStatus, status } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      // Update paymentStatus if provided
      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      // Update status if provided
      if (status) {
        updateData.status = status;
      }

      await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      res.json({ message: "Order status updated successfully" });
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ message: "Erro ao atualizar status do pedido" });
    }
  });

  // Submit payment proof (user app)
  app.patch("/api/user/orders/:orderId/payment-proof", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { paymentProof, status, paymentStatus, clientIban, clientMulticaixaExpress, clientAccountName } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }

      if (!paymentProof) {
        return res.status(400).json({ message: "Payment proof required" });
      }

      const updateData: any = { 
        status: status || "proof_submitted",
        paymentProof: paymentProof,
        updatedAt: new Date()
      };

      // Update paymentStatus if provided
      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      // Store client payment details if provided
      if (clientIban) {
        updateData.clientIban = clientIban;
      }
      if (clientMulticaixaExpress) {
        updateData.clientMulticaixaExpress = clientMulticaixaExpress;
      }
      if (clientAccountName) {
        updateData.clientAccountName = clientAccountName;
      }

      await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId));

      res.json({ message: "Payment proof submitted successfully" });
    } catch (err) {
      console.error("Error submitting payment proof:", err);
      res.status(500).json({ message: "Erro ao enviar comprovativo" });
    }
  });

  app.patch("/api/user/orders/:orderId/review", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { userId, rating, comment } = req.body;

      if (!orderId || !userId) {
        return res.status(400).json({ message: "Order ID e User ID são obrigatórios" });
      }

      const numericRating = Number(rating);
      if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
        return res.status(400).json({ message: "A avaliação deve estar entre 0 e 5" });
      }

      const existing = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          status: orders.status,
          reviewRating: orders.reviewRating,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      const order = existing[0];
      if (!order) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }
      if (order.userId !== Number(userId)) {
        return res.status(403).json({ message: "Sem permissão para avaliar este pedido" });
      }
      if (order.status !== "delivered") {
        return res.status(400).json({ message: "Só é possível avaliar pedidos entregues" });
      }
      if (order.reviewRating !== null && order.reviewRating !== undefined) {
        return res.status(400).json({ message: "Este pedido já foi avaliado" });
      }

      await db
        .update(orders)
        .set({
          reviewRating: numericRating,
          reviewComment: typeof comment === "string" ? comment.trim().slice(0, 500) : "",
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      res.json({ message: "Avaliação enviada com sucesso" });
    } catch (err) {
      console.error("Error submitting order review:", err);
      res.status(500).json({ message: "Erro ao enviar avaliação" });
    }
  });

  app.get("/api/pharmacies/:pharmacyId/reviews/summary", async (req, res) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId);
      if (!pharmacyId) {
        return res.status(400).json({ message: "Pharmacy ID é obrigatório" });
      }

      const summary = await db
        .select({
          averageRating: sql<number>`COALESCE(AVG(${orders.reviewRating}), 0)`,
          ratingsCount: sql<number>`COUNT(${orders.reviewRating})`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            eq(orders.status, "delivered"),
            isNotNull(orders.reviewRating),
          ),
        );

      const result = summary[0] || { averageRating: 0, ratingsCount: 0 };
      res.json({
        averageRating: Number(result.averageRating || 0),
        ratingsCount: Number(result.ratingsCount || 0),
      });
    } catch (err) {
      console.error("Error fetching pharmacy reviews summary:", err);
      res.status(500).json({ message: "Erro ao obter resumo de avaliações" });
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

      // Validate minimum order amount
      const minOrderSettingResult = await db
        .select()
        .from(systemSettings)
        .where(sql`key = 'min_order_amount'`)
        .limit(1);
      const minOrderSetting = minOrderSettingResult.length > 0 ? minOrderSettingResult[0] : null;
      const minOrderAmount = minOrderSetting ? parseFloat(minOrderSetting.value) : 500;
      const orderSubtotal = parseFloat(orderData.total || "0") - parseFloat(orderData.deliveryFee || "0");
      
      if (orderSubtotal < minOrderAmount) {
        return res.status(400).json({
          message: `Valor mínimo de ${minOrderAmount.toLocaleString('pt-AO')} AOA para encomendar`,
          minOrderAmount,
        });
      }

      console.log("Processed order data for insertion:", processedOrderData);
      const order = await storage.createOrder(processedOrderData);

      // Create order items and prescriptions if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const orderItemsData = await Promise.all(items.map(async (item: any) => {
          // Handle cases where item might have a nested product object
          const product = item.product || {};
          const productId = item.productId || product.id || 1;
          const productName = item.productName || item.name || product.name || "Produto";
          const unitPrice = item.unitPrice || item.price || product.price || "0";
          const quantity = item.quantity || 1;
          const prescriptionRequired = item.prescriptionRequired || false;
          
          let prescriptionId = null;
          
          // If item has prescription data, create prescription record
          if (item.prescription && prescriptionRequired) {
            try {
              const prescriptionResult = await db
                .insert(prescriptions)
                .values({
                  orderId: order.id,
                  productId,
                  userId: orderData.userId || null,
                  imageUrl: item.prescription.imageUrl || item.prescription.base64,
                  status: "pending",
                })
                .returning();
              
              if (prescriptionResult.length === 0) {
                throw new Error("Failed to create prescription");
              }
              
              const prescription = prescriptionResult[0];
              prescriptionId = prescription.id;
              console.log(`Created prescription #${prescription.id} for order #${order.id}, product #${productId}`);
            } catch (prescriptionError) {
              console.error("Error creating prescription:", prescriptionError);
            }
          }

          return {
            orderId: order.id,
            productId,
            productName,
            quantity,
            unitPrice: String(unitPrice),
            totalPrice: String((Number(unitPrice) * quantity) || 0),
            prescriptionRequired,
            prescriptionId,
          };
        }));
        
        await storage.createOrderItems(orderItemsData);
        console.log(`Created ${orderItemsData.length} order items for order #${order.id}`);
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
          
          // Also emit notification about pending prescriptions
          const itemsWithPrescription = items?.filter((i: any) => i.prescription) || [];
          if (itemsWithPrescription.length > 0) {
            io.to(`pharmacy-${order.pharmacyId}`).emit('new-prescription', {
              orderId: order.id,
              count: itemsWithPrescription.length,
            });
          }
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
      const order = await storage.getOrder(parseInt(req.params.id as string));
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
    await ensureOrderColumns();
    await ensurePharmacyColumns();
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
    },
    {
      name: "Diazepam 10mg",
      description: "Ansiolítico utilizado no tratamento de ansiedade, insônia e espasmos musculares. Uso sob prescrição médica.",
      price: "4500",
      imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60",
      diseases: ["ansiedade", "insônia", "espasmos musculares"],
      activeIngredient: "Diazepam",
      category: "medicamento",
      brand: "Genérico",
      dosage: "10mg",
      prescriptionRequired: true,
      stock: 30,
      status: "active"
    }
  ];

  try {
    if (allPharmacies.length > 0) {
      const dataWithPharmacy = seedData.map(p => ({
        ...p,
        pharmacyId: allPharmacies[0].id
      }));
      await storage.seedProducts(dataWithPharmacy as any);
      console.log(`Database seeded with ${seedData.length} products for pharmacy: ${allPharmacies[0].name}`);

      // Seed some sample orders if none exist
      const existingOrders = await storage.getUserOrders(1).catch(() => []);
      // Actually we need a more general check since getUserOrders needs a userId
      if (existingOrders.length === 0) {
        console.log("Seeding sample orders for admin testing...");
        for (let i = 0; i < allPharmacies.length; i++) {
          const pharm = allPharmacies[i];
          const orderTotal = 5000 + (i * 2500);
          await storage.createOrder({
            userId: 1,
            pharmacyId: pharm.id,
            customerName: `Cliente Teste ${i + 1}`,
            customerPhone: `+24490000000${i}`,
            customerAddress: "Rua de Teste, 123",
            total: String(orderTotal),
            deliveryFee: "500",
            status: "delivered", // Important for revenue/profit
            paymentMethod: "cash",
            paymentStatus: "paid",
          });
        }
        console.log(`✓ Seeded ${allPharmacies.length} sample delivered orders`);
      }
    } else {
      console.log("No pharmacies found to seed products/orders into");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
