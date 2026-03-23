import { Express, Request, Response } from "express";
import { db } from "../db";
import { pharmacies, orders, orderItems, users, pharmacyAdmins, adminUsers } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: Function) {
  // In production, implement proper session/JWT validation
  // For now, we'll check a custom header or session
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function registerAdminRoutes(app: Express) {
  console.log("[Admin] Registering Admin Routes...");
  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, email),
      });

      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, create a proper session/JWT
      res.json({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get dashboard stats
  app.get("/api/admin/dashboard-stats", async (req: Request, res: Response) => {
    try {
      const [pharmacyStats] = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`count(case when ${pharmacies.status} = 'active' then 1 end)`,
          pending: sql<number>`count(case when ${pharmacies.status} = 'pending' then 1 end)`,
        })
        .from(pharmacies);

      const [orderStats] = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(orders);

      const [todayOrderStats] = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= (now()::date)`);

      const [userStats] = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(users);

      const recentOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          pharmacyName: pharmacies.name,
        })
        .from(orders)
        .leftJoin(pharmacies, eq(orders.pharmacyId, pharmacies.id))
        .orderBy(desc(orders.createdAt))
        .limit(10);

      res.json({
        totalPharmacies: pharmacyStats.total,
        activePharmacies: pharmacyStats.active,
        pendingPharmacies: pharmacyStats.pending,
        totalOrders: orderStats.total,
        todayOrders: todayOrderStats.total || 0,
        totalUsers: userStats.total || 0,
        recentOrders,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all pharmacies
  app.get("/api/admin/pharmacies", async (req: Request, res: Response) => {
    try {
      const allPharmacies = await db
        .select({
          id: pharmacies.id,
          name: pharmacies.name,
          email: pharmacies.email,
          phone: pharmacies.phone,
          address: pharmacies.address,
          status: pharmacies.status,
          createdAt: pharmacies.createdAt,
          documentUrl: pharmacies.documentUrl,
        })
        .from(pharmacies)
        .orderBy(desc(pharmacies.createdAt));

      res.json(allPharmacies);
    } catch (error) {
      console.error("Fetch pharmacies error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });

  // Create a new pharmacy
  app.post("/api/admin/pharmacies", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, address, lat, lng } = req.body;

      if (!name || !email || !phone || !address) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const [pharmacy] = await db
        .insert(pharmacies)
        .values({
          name,
          email,
          phone,
          address,
          lat: lat || "0",
          lng: lng || "0",
          status: 'active',
        })
        .returning();

      // Create a default admin for the pharmacy
      const hashedPassword = await bcrypt.hash("farm123", 10);
      await db.insert(pharmacyAdmins).values({
        pharmacyId: pharmacy.id,
        email: email, // use pharmacy email as default admin email
        password: hashedPassword,
        name: `Admin ${name}`,
        role: 'admin',
      });

      res.status(201).json({
        ...pharmacy,
        credentials: {
          email: email,
          password: "farm123 (padrão)"
        }
      });
    } catch (error: any) {
      console.error("Create pharmacy error:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Uma farmácia com este e-mail já existe." });
      }
      res.status(500).json({ message: "Failed to create pharmacy" });
    }
  });

  // Get pharmacy credentials (email and a way to reset)
  app.get("/api/admin/pharmacies/:id/credentials", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);
      console.log(`[Admin] Fetching credentials for pharmacy ID: ${pharmacyId}`);
      // Write to a marker file
      try {
        require('fs').appendFileSync('/tmp/api_logs.txt', `${new Date().toISOString()} - Fetching creds for ID ${pharmacyId}\n`);
      } catch (e) { }


      let admins = await db
        .select({
          id: pharmacyAdmins.id,
          email: pharmacyAdmins.email,
          name: pharmacyAdmins.name,
          role: pharmacyAdmins.role,
        })
        .from(pharmacyAdmins)
        .where(eq(pharmacyAdmins.pharmacyId, pharmacyId));

      console.log(`[Admin] Found ${admins.length} admins for pharmacy ${pharmacyId}`);

      // If no admin exists (for older pharmacies), create a default one
      if (admins.length === 0) {
        console.log(`[Admin] No admins found for pharmacy ${pharmacyId}, attempting to create default...`);
        const [pharmacy] = await db
          .select()
          .from(pharmacies)
          .where(eq(pharmacies.id, pharmacyId))
          .limit(1);

        if (pharmacy) {
          console.log(`[Admin] Creating default admin for pharmacy: ${pharmacy.name} (${pharmacy.email})`);
          const hashedPassword = await bcrypt.hash("farm123", 10);
          try {
            await db.insert(pharmacyAdmins).values({
              pharmacyId: pharmacy.id,
              email: pharmacy.email,
              password: hashedPassword,
              name: `Admin ${pharmacy.name}`,
              role: 'admin',
            });
            console.log(`[Admin] Default admin created successfully`);
          } catch (insertErr: any) {
            console.error(`[Admin] Failed to insert default admin:`, insertErr.message);
          }

          // Fetch again
          admins = await db
            .select({
              id: pharmacyAdmins.id,
              email: pharmacyAdmins.email,
              name: pharmacyAdmins.name,
              role: pharmacyAdmins.role,
            })
            .from(pharmacyAdmins)
            .where(eq(pharmacyAdmins.pharmacyId, pharmacyId));
        } else {
          console.warn(`[Admin] Pharmacy with ID ${pharmacyId} not found in database`);
        }
      }

      res.json(admins);
    } catch (error) {
      console.error("Fetch credentials error:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  // Reset pharmacy admin password
  app.post("/api/admin/pharmacies/:id/reset-password", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);
      const { adminId, newPassword } = req.body;

      const password = newPassword || "farm123";
      const hashedPassword = await bcrypt.hash(password, 10);

      await db
        .update(pharmacyAdmins)
        .set({ password: hashedPassword })
        .where(
          and(
            eq(pharmacyAdmins.id, adminId),
            eq(pharmacyAdmins.pharmacyId, pharmacyId)
          )
        );

      res.json({ message: "Senha redefinida com sucesso", defaultPassword: password });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Get pharmacy details
  app.get("/api/admin/pharmacies/:id", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);

      const [pharmacy] = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);

      if (!pharmacy) {
        return res.status(404).json({ message: "Pharmacy not found" });
      }

      const [orderStats] = await db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
        })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));

      res.json({
        ...pharmacy,
        ordersCount: orderStats.count,
        totalRevenue: orderStats.revenue,
      });
    } catch (error) {
      console.error("Fetch pharmacy error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacy" });
    }
  });

  // Update pharmacy status
  app.patch("/api/admin/pharmacies/:id/status", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);
      const { status } = req.body;

      const validStatuses = ['pending', 'active', 'suspended', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await db
        .update(pharmacies)
        .set({ status, updatedAt: new Date() })
        .where(eq(pharmacies.id, pharmacyId));

      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Get all orders
  app.get("/api/admin/orders", async (req: Request, res: Response) => {
    try {
      const allOrders = await db
        .select({
          id: orders.id,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          customerAddress: orders.customerAddress,
          total: orders.total,
          deliveryFee: orders.deliveryFee,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
          pharmacyName: pharmacies.name,
        })
        .from(orders)
        .leftJoin(pharmacies, eq(orders.pharmacyId, pharmacies.id))
        .orderBy(desc(orders.createdAt));

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db
            .select({
              productName: orderItems.productName,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));
          return { ...order, items };
        })
      );

      res.json(ordersWithItems);
    } catch (error) {
      console.error("Fetch orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get all users
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      // Get order count for each user
      const usersWithOrders = await Promise.all(
        allUsers.map(async (user) => {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.userId, user.id));
          return { ...user, ordersCount: result?.count || 0 };
        })
      );

      res.json(usersWithOrders);
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get all admin users
  app.get("/api/admin/admin-users", async (req: Request, res: Response) => {
    try {
      const adminUsersData = await db
        .select({
          id: adminUsers.id,
          email: adminUsers.email,
          name: adminUsers.name,
          role: adminUsers.role,
          createdAt: adminUsers.createdAt,
        })
        .from(adminUsers)
        .orderBy(desc(adminUsers.createdAt));

      res.json(adminUsersData);
    } catch (error) {
      console.error("Fetch admin users error:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  // Create admin user
  app.post("/api/admin/admin-users", async (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password and name are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [adminUser] = await db
        .insert(adminUsers)
        .values({
          email,
          password: hashedPassword,
          name,
          role: role || 'admin',
        })
        .returning();

      res.status(201).json({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
      });
    } catch (error: any) {
      console.error("Create admin user error:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Admin user with this email already exists" });
      }
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Update admin user
  app.put("/api/admin/admin-users/:id", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.params.id);
      const { email, name, role, password } = req.body;

      const updateData: any = {
        email,
        name,
        role,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const [updatedAdmin] = await db
        .update(adminUsers)
        .set(updateData)
        .where(eq(adminUsers.id, adminId))
        .returning();

      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      res.json({
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        createdAt: updatedAdmin.createdAt,
      });
    } catch (error: any) {
      console.error("Update admin user error:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Admin user with this email already exists" });
      }
      res.status(500).json({ message: "Failed to update admin user" });
    }
  });

  // Delete admin user
  app.delete("/api/admin/admin-users/:id", async (req: Request, res: Response) => {
    try {
      const adminId = parseInt(req.params.id);

      const [deletedAdmin] = await db
        .delete(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .returning();

      if (!deletedAdmin) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      res.json({ message: "Admin user deleted successfully" });
    } catch (error) {
      console.error("Delete admin user error:", error);
      res.status(500).json({ message: "Failed to delete admin user" });
    }
  });

  // Get system revenue (admin balance)
  app.get("/api/admin/balance", async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total system revenue
      const [systemRevenue] = await db
        .select({
          total: sql<string>`coalesce(sum(${orders.total}), '0')`,
          count: sql<number>`count(*)`,
          completed: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)`,
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= ${startDate}`);

      // Revenue breakdown by pharmacy
      const pharmacyBreakdown = await db
        .select({
          pharmacyId: orders.pharmacyId,
          pharmacyName: pharmacies.name,
          revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
          ordersCount: sql<number>`count(*)`,
          completedOrders: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)`,
        })
        .from(orders)
        .leftJoin(pharmacies, eq(orders.pharmacyId, pharmacies.id))
        .where(sql`${orders.createdAt} >= ${startDate}`)
        .groupBy(orders.pharmacyId, pharmacies.name);

      res.json({
        totalSystemRevenue: systemRevenue.total || '0',
        totalSystemOrders: systemRevenue.count || 0,
        totalSystemCompleted: systemRevenue.completed || 0,
        pharmacyBreakdown: pharmacyBreakdown.map(pb => ({
          pharmacyId: pb.pharmacyId,
          pharmacyName: pb.pharmacyName || 'Unknown',
          revenue: pb.revenue || '0',
          ordersCount: pb.ordersCount || 0,
          completedOrders: pb.completedOrders || 0,
        })),
      });
    } catch (error) {
      console.error("Admin balance error:", error);
      res.status(500).json({ message: "Failed to fetch balance data" });
    }
  });
}
