import { Express, Request, Response } from "express";
import { db } from "../db";
import { pharmacies, orders, orderItems, products, pharmacyAdmins } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Middleware to check if user is pharmacy admin
async function requirePharmacyAdmin(req: Request, res: Response, next: Function) {
  // In production, implement proper session/JWT validation
  const pharmacyToken = req.headers['x-pharmacy-token'];
  if (!pharmacyToken || Array.isArray(pharmacyToken)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function registerPharmacyRoutes(app: Express) {
  // Pharmacy login
  app.post("/api/pharmacy/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const admin = await db.query.pharmacyAdmins.findFirst({
        where: eq(pharmacyAdmins.email, email),
      });

      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get pharmacy info
      const pharmacyResult = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, admin.pharmacyId))
        .limit(1);
      
      if (pharmacyResult.length === 0) {
        throw new Error("Pharmacy not found");
      }
      const pharmacy = pharmacyResult[0];

      // In production, create a proper session/JWT
      res.json({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          pharmacyId: admin.pharmacyId,
          pharmacyName: pharmacy.name || '',
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Pharmacy login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get dashboard stats
  app.get("/api/pharmacy/dashboard-stats", async (req: Request, res: Response) => {
    try {
      const pharmacyIdParam = req.query.pharmacyId;
      const pharmacyId = typeof pharmacyIdParam === 'string' ? parseInt(pharmacyIdParam) : NaN;
      
      if (!pharmacyId) {
        return res.status(400).json({ message: "Pharmacy ID required" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayResults = await db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            sql`${orders.createdAt} >= ${today}`
          )
        );

      const todayStats = todayResults.length > 0 ? todayResults[0] : { count: 0, revenue: '0' };

      const pendingResults = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            eq(orders.status, 'pending')
          )
        );

      const pendingStats = pendingResults.length > 0 ? pendingResults[0] : { count: 0 };

      const recentOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId))
        .orderBy(desc(orders.createdAt))
        .limit(5);

      res.json({
        todayOrders: todayStats.count,
        todayRevenue: todayStats.revenue,
        pendingOrders: pendingStats.count,
        totalProducts: 0, // Get from products table
        recentOrders,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get pending orders count
  app.get("/api/pharmacy/orders/pending-count", async (req: Request, res: Response) => {
    try {
      const pharmacyIdParam = req.query.pharmacyId;
      const pharmacyId = typeof pharmacyIdParam === 'string' ? parseInt(pharmacyIdParam) : NaN;
      
      if (!pharmacyId) {
        return res.status(400).json({ message: "Pharmacy ID required" });
      }

      const results = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            eq(orders.status, 'pending')
          )
        );

      const count = results.length > 0 ? results[0].count : 0;
      res.json({ count });
    } catch (error) {
      console.error("Pending count error:", error);
      res.status(500).json({ message: "Failed to fetch count" });
    }
  });

  // Get all pharmacy admins for debugging
  app.get("/api/pharmacy/admins", async (req: Request, res: Response) => {
    try {
      const pharmacyAdmins = await db
        .select({
          id: pharmacyAdmins.id,
          email: pharmacyAdmins.email,
          name: pharmacyAdmins.name,
          pharmacyId: pharmacyAdmins.pharmacyId,
          role: pharmacyAdmins.role,
        })
        .from(pharmacyAdmins);

      console.log('All pharmacy admins:', pharmacyAdmins);
      res.json(pharmacyAdmins);
    } catch (error) {
      console.error("Fetch pharmacy admins error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacy admins" });
    }
  });

  // Get all pharmacies for map display
  app.get("/api/pharmacy/list", async (req: Request, res: Response) => {
    try {
      const allPharmacies = await db
        .select({
          id: pharmacies.id,
          name: pharmacies.name,
          email: pharmacies.email,
          phone: pharmacies.phone,
          address: pharmacies.address,
          status: pharmacies.status,
          logoUrl: pharmacies.logoUrl,
          lat: pharmacies.lat,
          lng: pharmacies.lng,
          description: pharmacies.description,
          openingHours: pharmacies.openingHours,
        })
        .from(pharmacies)
        .where(eq(pharmacies.status, 'active'))
        .orderBy(pharmacies.name);

      // Convert numeric strings to numbers for map coordinates
      const formattedPharmacies = allPharmacies.map(pharm => ({
        ...pharm,
        latitude: parseFloat(String(pharm.lat || 0)),
        longitude: parseFloat(String(pharm.lng || 0)),
      }));

      console.log('Active pharmacies:', formattedPharmacies);
      res.json(formattedPharmacies);
    } catch (error) {
      console.error("Fetch pharmacies error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });

  // Get pharmacy orders
  app.get("/api/pharmacy/orders", async (req: Request, res: Response) => {
    try {
      const pharmacyIdParam = req.query.pharmacyId;
      const pharmacyId = typeof pharmacyIdParam === 'string' ? parseInt(pharmacyIdParam) : NaN;
      
      console.log(`Fetching orders for pharmacy ID: ${pharmacyId} (param: ${pharmacyIdParam})`);
      console.log('Request headers:', req.headers);
      console.log('Request query:', req.query);
      
      if (!pharmacyId) {
        console.log('Invalid pharmacy ID, returning 400');
        return res.status(400).json({ message: "Pharmacy ID required" });
      }

      console.log(`Querying orders for pharmacy ${pharmacyId}...`);
      const pharmacyOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          customerAddress: orders.customerAddress,
          total: orders.total,
          deliveryFee: orders.deliveryFee,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          paymentStatus: orders.paymentStatus,
          isLocked: orders.isLocked,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId))
        .orderBy(desc(orders.createdAt));

      console.log(`Found ${pharmacyOrders.length} orders for pharmacy ${pharmacyId}`);
      console.log('Orders sample:', pharmacyOrders.slice(0, 1));

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        pharmacyOrders.map(async (order) => {
          console.log(`Fetching items for order ${order.id}...`);
          const items = await db
            .select({
              productName: orderItems.productName,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          console.log(`Order ${order.id} has ${items.length} items:`, items);
          return { ...order, items };
        })
      );

      console.log(`Returning ${ordersWithItems.length} orders with items`);
      console.log('Final data sample:', ordersWithItems.slice(0, 1));
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Fetch orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get order details
  app.get("/api/pharmacy/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderIdParam = req.params.id;
      const orderId = typeof orderIdParam === 'string' ? parseInt(orderIdParam) : NaN;
      
      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
      const order = orderResult[0];

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      res.json({ ...order, items });
    } catch (error) {
      console.error("Fetch order error:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Digital payment methods that trigger order locking
  const LOCKABLE_PAYMENT_METHODS = ['multicaixa_express', 'transferencia', 'atm'];

  // Forbidden status transitions for locked orders
  const FORBIDDEN_TRANSITIONS = ['pending', 'cancelled', 'rejected'];

  // Update order status
  app.patch("/api/pharmacy/orders/:id/status", async (req: Request, res: Response) => {
    try {
      const orderIdParam = req.params.id;
      const orderId = typeof orderIdParam === 'string' ? parseInt(orderIdParam) : NaN;
      const { status, adminId, iban, multicaixaExpress, paymentProof, paymentStatus } = req.body;

      const validStatuses = ['pending', 'accepted', 'awaiting_proof', 'proof_submitted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'rejected', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Fetch current order to check locking status
      const existingOrderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (existingOrderResult.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
      const existingOrder = existingOrderResult[0];

      // Check if order is locked - prevent any modifications
      if (existingOrder.isLocked) {
        // Allow only forward progress (preparing -> ready -> out_for_delivery -> delivered)
        const allowedForwardStatuses = ['preparing', 'ready', 'out_for_delivery', 'delivered'];
        const currentStatusIndex = allowedForwardStatuses.indexOf(existingOrder.status);
        const newStatusIndex = allowedForwardStatuses.indexOf(status);
        
        // Block transitions to forbidden statuses
        if (FORBIDDEN_TRANSITIONS.includes(status)) {
          return res.status(403).json({ 
            message: "Este pedido está bloqueado. Não é possível cancelar ou reverter o status pois o pagamento já foi processado.",
            code: "ORDER_LOCKED"
          });
        }

        // Block changing payment method data on locked orders
        if (iban || multicaixaExpress) {
          return res.status(403).json({
            message: "Não é possível alterar dados de pagamento de um pedido bloqueado.",
            code: "PAYMENT_LOCKED"
          });
        }
      }

      // Determine if this update should lock the order
      // Lock when: accepting order with digital payment method (ATM, Multicaixa Express)
      const shouldLockOrder = (
        (status === 'accepted' || status === 'awaiting_proof') &&
        LOCKABLE_PAYMENT_METHODS.includes(existingOrder.paymentMethod)
      );

      await db
        .update(orders)
        .set({ 
          status, 
          updatedAt: new Date(),
          ...(shouldLockOrder && { isLocked: true }),
          ...(iban && { pharmacyIban: iban }),
          ...(multicaixaExpress && { pharmacyMulticaixaExpress: multicaixaExpress }),
          ...(paymentProof && { paymentProof: paymentProof }),
          ...(paymentStatus && { paymentStatus: paymentStatus })
        })
        .where(eq(orders.id, orderId));

      res.json({ 
        message: "Status updated successfully",
        isLocked: shouldLockOrder || existingOrder.isLocked
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Get pharmacy products
  app.get("/api/pharmacy/products", async (req: Request, res: Response) => {
    try {
      const pharmacyIdParam = req.query.pharmacyId;
      const pharmacyId = typeof pharmacyIdParam === 'string' ? parseInt(pharmacyIdParam) : NaN;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const filters: any[] = [];
      if (!Number.isNaN(pharmacyId) && pharmacyId > 0) {
        filters.push(eq(products.pharmacyId, pharmacyId));
      }
      if (search) {
        filters.push(
          sql`(${products.name} ILIKE ${`%${search}%`} OR ${products.diseases}::text ILIKE ${`%${search}%`} OR COALESCE(${products.brand}, '') ILIKE ${`%${search}%`})`
        );
      }
      if (category) {
        filters.push(eq(products.category, category));
      }
      if (status) {
        filters.push(eq(products.status, status));
      }

      const rows = await db
        .select({
          product: products,
          pharmacyName: pharmacies.name,
        })
        .from(products)
        .leftJoin(pharmacies, eq(products.pharmacyId, pharmacies.id))
        .where(filters.length > 0 ? and(...filters) : sql`true`)
        .orderBy(products.name);

      const allProducts = rows.map(({ product, pharmacyName }) => ({
        ...product,
        pharmacyName: pharmacyName || "Farmácia sem nome",
        inStock: true,
      }));

      res.json(allProducts);
    } catch (error) {
      console.error("Fetch products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Update pharmacy settings
  app.put("/api/pharmacy/settings", async (req: Request, res: Response) => {
    try {
      const { pharmacyId, name, email, phone, address, description, lat, lng, iban, multicaixaExpress, accountName } = req.body;

      await db
        .update(pharmacies)
        .set({
          name,
          email,
          phone,
          address,
          description,
          lat,
          lng,
          iban,
          multicaixaExpress,
          accountName,
          updatedAt: new Date(),
        })
        .where(eq(pharmacies.id, pharmacyId));

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get pharmacy balance/revenue
  app.get("/api/pharmacy/:pharmacyId/balance", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total revenue for this pharmacy
      const revenueStatsResult = await db
        .select({
          total: sql<string>`coalesce(sum(${orders.total}), '0')`,
          count: sql<number>`count(*)`,
          completed: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            sql`${orders.createdAt} >= ${startDate}`
          )
        );
      
      if (revenueStatsResult.length === 0) {
        throw new Error("Failed to calculate revenue stats");
      }
      const revenueStats = revenueStatsResult[0];

      // Pending revenue (orders not yet delivered)
      const pendingStatsResult = await db
        .select({
          total: sql<string>`coalesce(sum(${orders.total}), '0')`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            sql`${orders.status} != 'delivered' AND ${orders.createdAt} >= ${startDate}`
          )
        );
      
      if (pendingStatsResult.length === 0) {
        throw new Error("Failed to calculate pending stats");
      }
      const pendingStats = pendingStatsResult[0];

      // Order breakdown by day
      const orderBreakdown = await db
        .select({
          date: sql<string>`DATE(${orders.createdAt})`,
          total: sql<string>`coalesce(sum(${orders.total}), '0')`,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            sql`${orders.createdAt} >= ${startDate}`
          )
        )
        .groupBy(sql<string>`DATE(${orders.createdAt})`)
        .orderBy(sql`DATE(${orders.createdAt}) DESC`);

      res.json({
        totalRevenue: revenueStats.total || '0',
        totalOrders: revenueStats.count || 0,
        completedOrders: revenueStats.completed || 0,
        pendingRevenue: pendingStats.total || '0',
        orderBreakdown,
      });
    } catch (error) {
      console.error("Pharmacy balance error:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });
}
