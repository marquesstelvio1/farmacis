import { Express, Request, Response } from "express";
import { db } from "../db";
import { orders, orderStatusHistory, pharmacies, pharmacyAdmins, payments, orderItems, products, systemSettings } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Middleware to check pharmacy admin authentication
async function authenticatePharmacyAdmin(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  // Simple token check - in production use JWT
  const token = authHeader.substring(7);
  if (token !== "pharmacy-admin-token") {
    return res.status(401).json({ message: "Token inválido" });
  }

  next();
}

export function registerPharmacyAdminRoutes(app: Express) {
  // Pharmacy Admin Login
  app.post("/api/pharmacy/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const adminResult = await db
        .select()
        .from(pharmacyAdmins)
        .where(eq(pharmacyAdmins.email, email))
        .limit(1);

      if (adminResult.length === 0) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      const admin = adminResult[0];

      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }

      // Get pharmacy info
      const pharmacyResult = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, admin.pharmacyId))
        .limit(1);

      if (pharmacyResult.length === 0) {
        throw new Error("Farmácia não encontrada");
      }

      const pharmacy = pharmacyResult[0];

      const { password: _, ...adminWithoutPassword } = admin;

      res.json({
        message: "Login realizado com sucesso",
        user: {
          ...adminWithoutPassword,
          pharmacyName: pharmacy?.name || "Farmácia",
        },
        token: "pharmacy-admin-token", // In production, use JWT
      });
    } catch (error) {
      console.error("Error in pharmacy admin login:", error);
      res.status(500).json({ message: "Erro ao fazer login" });
    }
  });

  // Get orders for pharmacy
  app.get("/api/pharmacy/:pharmacyId/orders", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const rawStatus = req.query.status;
      const status = typeof rawStatus === 'string' ? rawStatus : undefined;

      let query = db
        .select()
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId))
        .orderBy(desc(orders.createdAt));

      const allOrders = await query;

      // Filter by status if provided
      const filteredOrders = status
        ? allOrders.filter(o => o.status === status)
        : allOrders;

      // Fetch items for each order to match frontend expectations
      const ordersWithItems = await Promise.all(
        filteredOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            ...order,
            items: items || []
          };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
  });

  // Get order details with history
  app.get("/api/pharmacy/orders/:orderId", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const order = orderResult[0];

      const history = await db
        .select()
        .from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, orderId))
        .orderBy(desc(orderStatusHistory.createdAt));

      res.json({
        ...order,
        history,
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do pedido" });
    }
  });

  // Accept order
  app.post("/api/pharmacy/orders/:orderId/accept", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);
      const { adminId, notes } = req.body;

      // Update order status
      const orderResult = await db
        .update(orders)
        .set({ status: "accepted" })
        .where(eq(orders.id, orderId))
        .returning();

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const order = orderResult[0];

      // Add to history
      await db.insert(orderStatusHistory).values({
        orderId,
        status: "accepted",
        notes: notes || "Pedido aceito pela farmácia",
        createdBy: adminId?.toString() || "admin",
      });

      res.json({
        message: "Pedido aceito com sucesso",
        order,
      });
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "Erro ao aceitar pedido" });
    }
  });

  // Reject order
  app.post("/api/pharmacy/orders/:orderId/reject", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);
      const { adminId, reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Motivo da recusa é obrigatório" });
      }

      // Update order status
      const orderResult = await db
        .update(orders)
        .set({ status: "rejected" })
        .where(eq(orders.id, orderId))
        .returning();

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const order = orderResult[0];

      // Add to history
      await db.insert(orderStatusHistory).values({
        orderId,
        status: "rejected",
        notes: reason,
        createdBy: adminId?.toString() || "admin",
      });

      res.json({
        message: "Pedido recusado",
        order,
      });
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Erro ao recusar pedido" });
    }
  });

  // Mark order as paid (after payment received)
  app.post("/api/pharmacy/orders/:orderId/mark-paid", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);
      const { adminId, paymentMethod, transactionId } = req.body;

      // Update order status
      const orderResult = await db
        .update(orders)
        .set({ status: "paid" })
        .where(eq(orders.id, orderId))
        .returning();

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const order = orderResult[0];

      // Add to history
      await db.insert(orderStatusHistory).values({
        orderId,
        status: "paid",
        notes: `Pagamento recebido via ${paymentMethod}. Transação: ${transactionId || 'N/A'}`,
        createdBy: adminId?.toString() || "admin",
      });

      res.json({
        message: "Pagamento confirmado",
        order,
      });
    } catch (error) {
      console.error("Error marking order as paid:", error);
      res.status(500).json({ message: "Erro ao confirmar pagamento" });
    }
  });

  // Update order status (processing, shipped, delivered)
  app.post("/api/pharmacy/orders/:orderId/status", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId as string);
      const { status, adminId, notes, iban, multicaixaExpress, paymentProof, paymentStatus } = req.body;

      const validStatuses = ["processing", "shipped", "delivered", "awaiting_proof", "proof_submitted"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const globalIbanResult = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(sql`key = 'platform_global_iban'`)
        .limit(1);
      const globalMulticaixaResult = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(sql`key = 'platform_global_multicaixa_express'`)
        .limit(1);
      const globalIban = globalIbanResult[0]?.value?.trim();
      const globalMulticaixa = globalMulticaixaResult[0]?.value?.trim();

      // Update order status with optional payment info
      const orderResult = await db
        .update(orders)
        .set({ 
          status,
          ...((globalIban || iban) && { pharmacyIban: globalIban || iban }),
          ...((globalMulticaixa || multicaixaExpress) && { pharmacyMulticaixaExpress: globalMulticaixa || multicaixaExpress }),
          ...(paymentProof && { paymentProof: paymentProof }),
          ...(paymentStatus && { paymentStatus: paymentStatus })
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (orderResult.length === 0) {
        return res.status(404).json({ message: "Pedido não encontrado" });
      }

      const order = orderResult[0];

      // Add to history
      await db.insert(orderStatusHistory).values({
        orderId,
        status,
        notes: notes || `Status atualizado para ${status}`,
        createdBy: adminId?.toString() || "admin",
      });

      res.json({
        message: "Status atualizado",
        order,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Get pharmacy statistics
  app.get("/api/pharmacy/:pharmacyId/statistics", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);

      const allOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      const stats = {
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === "pending").length,
        accepted: allOrders.filter(o => o.status === "accepted").length,
        rejected: allOrders.filter(o => o.status === "rejected").length,
        paid: allOrders.filter(o => o.status === "paid").length,
        processing: allOrders.filter(o => o.status === "processing").length,
        shipped: allOrders.filter(o => o.status === "shipped").length,
        delivered: allOrders.filter(o => o.status === "delivered").length,
        totalRevenue: allOrders
          .filter(o => ["paid", "processing", "shipped", "delivered"].includes(o.status))
          .reduce((sum, o) => sum + parseFloat(o.total), 0),
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Get dashboard stats for pharmacy
  app.get("/api/pharmacy/:pharmacyId/dashboard-stats", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);

      if (isNaN(pharmacyId)) {
        return res.status(400).json({ message: "Pharmacy ID inválido" });
      }

      const allOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);

      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(o => ({
          id: o.id,
          customerName: o.customerName,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        }));

      res.json({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0).toString(),
        pendingOrders: allOrders.filter(o => o.status === "pending").length,
        totalProducts: 4,
        recentOrders,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas do dashboard" });
    }
  });

  // Get pending orders count
  app.get("/api/pharmacy/:pharmacyId/orders/pending-count", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);

      if (isNaN(pharmacyId)) {
        return res.status(400).json({ message: "Pharmacy ID inválido" });
      }

      const pendingOrders = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      res.json({ count: pendingOrders[0]?.count || 0 });
    } catch (error) {
      console.error("Error fetching pending orders count:", error);
      res.status(500).json({ message: "Erro ao buscar contagem de pedidos pendentes" });
    }
  });

  // Get products with discounts for pharmacy
  app.get("/api/pharmacy/:pharmacyId/products/discounts", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);

      if (isNaN(pharmacyId)) {
        return res.status(400).json({ message: "Pharmacy ID inválido" });
      }

      const pharmacyProducts = await db
        .select()
        .from(products)
        .where(eq(products.pharmacyId, pharmacyId));

      res.json(pharmacyProducts);
    } catch (error) {
      console.error("Error fetching pharmacy products for discounts:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });

  // Update product discount
  app.put("/api/pharmacy/products/:productId/discount", async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId as string);
      const { discountPercentage, discountActive, discountStartDate, discountEndDate } = req.body;

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Product ID inválido" });
      }

      // Validate discount percentage
      if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
        return res.status(400).json({ message: "Desconto deve estar entre 0 e 100%" });
      }

      const updateData: any = {
        discountPercentage: discountPercentage ?? 0,
        discountActive: discountActive ?? false,
        updatedAt: new Date(),
      };

      if (discountStartDate) {
        updateData.discountStartDate = new Date(discountStartDate);
      }
      if (discountEndDate) {
        updateData.discountEndDate = new Date(discountEndDate);
      }

      const updatedProduct = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, productId))
        .returning();

      if (updatedProduct.length === 0) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.json({
        message: "Desconto atualizado com sucesso",
        product: updatedProduct[0],
      });
    } catch (error) {
      console.error("Error updating product discount:", error);
      res.status(500).json({ message: "Erro ao atualizar desconto" });
    }
  });

  // Batch update discounts for multiple products
  app.post("/api/pharmacy/:pharmacyId/products/discounts/batch", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.pharmacyId as string);
      const { productIds, discountPercentage, discountActive, discountEndDate } = req.body;

      if (isNaN(pharmacyId)) {
        return res.status(400).json({ message: "Pharmacy ID inválido" });
      }

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Lista de produtos inválida" });
      }

      if (discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({ message: "Desconto deve estar entre 0 e 100%" });
      }

      const updateData: any = {
        discountPercentage: discountPercentage ?? 0,
        discountActive: discountActive ?? false,
        updatedAt: new Date(),
      };

      if (discountEndDate) {
        updateData.discountEndDate = new Date(discountEndDate);
      }

      const updatedProducts = [];
      for (const productId of productIds) {
        const result = await db
          .update(products)
          .set(updateData)
          .where(and(
            eq(products.id, productId),
            eq(products.pharmacyId, pharmacyId)
          ))
          .returning();

        if (result.length > 0) {
          updatedProducts.push(result[0]);
        }
      }

      res.json({
        message: `${updatedProducts.length} produtos atualizados com desconto de ${discountPercentage}%`,
        products: updatedProducts,
      });
    } catch (error) {
      console.error("Error batch updating product discounts:", error);
      res.status(500).json({ message: "Erro ao atualizar descontos em lote" });
    }
  });
}
