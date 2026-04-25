import { Express, Request, Response } from "express";
import { db } from "../db";
import { pharmacies, orders, orderItems, users, pharmacyAdmins, adminUsers, systemSettings, pharmacySettlements } from "@shared/schema";
import { eq, and, desc, or, sql, isNull } from "drizzle-orm";
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
  // Admin login - checks admin_users table AND users table with role ADMIN/FARMACIA
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // First try admin_users table (legacy admins)
      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, email),
      });

      if (admin) {
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        res.json({
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        });
        return;
      }

      // Check users table for ADMIN or FARMACIA roles
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user has permission (not CLIENTE)
      if (user.role === 'CLIENTE') {
        return res.status(403).json({ message: "Access denied. Client users cannot access admin panel." });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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
      const pharmacyStatsResult = await db
        .select({
          total: sql<number>`count(*)`,
          active: sql<number>`count(case when ${pharmacies.status} = 'active' then 1 end)`,
          pending: sql<number>`count(case when ${pharmacies.status} = 'pending' then 1 end)`,
        })
        .from(pharmacies);
      if (pharmacyStatsResult.length === 0) throw new Error("Failed to fetch pharmacy statistics");
      const pharmacyStats = pharmacyStatsResult[0];

      const orderStatsResult = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(orders);
      if (orderStatsResult.length === 0) throw new Error("Failed to fetch order statistics");
      const orderStats = orderStatsResult[0];

      const todayOrderStatsResult = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(orders)
        .where(sql`${orders.createdAt} >= (now()::date)`);
      if (todayOrderStatsResult.length === 0) throw new Error("Failed to fetch today's order statistics");
      const todayOrderStats = todayOrderStatsResult[0];

      const userStatsResult = await db
        .select({
          total: sql<number>`count(*)`,
        })
        .from(users);
      if (userStatsResult.length === 0) throw new Error("Failed to fetch user statistics");
      const userStats = userStatsResult[0];

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

      const revenueStatsResult = await db
        .select({
          total: sql<string>`coalesce(sum(${orders.total}), 0)`,
        })
        .from(orders)
        .where(eq(orders.status, 'delivered'));
      if (revenueStatsResult.length === 0) throw new Error("Failed to fetch revenue statistics");
      const revenueStats = revenueStatsResult[0];

      const totalRevenue = parseFloat(revenueStats.total);
      // Comissão de 10% sobre cada venda (sobre o preço de venda, não sobre preço base)
      const totalProfit = (totalRevenue * 0.10).toFixed(2);

      res.json({
        totalPharmacies: pharmacyStats.total,
        activePharmacies: pharmacyStats.active,
        pendingPharmacies: pharmacyStats.pending,
        totalOrders: orderStats.total,
        todayOrders: todayOrderStats.total || 0,
        totalUsers: userStats.total || 0,
        totalRevenue: totalRevenue.toFixed(2),
        totalProfit: totalProfit,
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
      const { name, email, phone, address, lat, lng, iban, multicaixaExpress, accountName } = req.body;

      if (!name || !email || !phone || !address) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const pharmacyResult = await db
        .insert(pharmacies)
        .values({
          name,
          email,
          phone,
          address,
          lat: lat || "-8.8387",
          lng: lng || "13.2344",
          status: 'active',
          iban: iban || null,
          multicaixaExpress: multicaixaExpress || null,
          accountName: accountName || null,
        })
        .returning();
      if (pharmacyResult.length === 0) throw new Error("Failed to create pharmacy");
      const pharmacy = pharmacyResult[0];

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
        const pharmacyResult = await db
          .select()
          .from(pharmacies)
          .where(eq(pharmacies.id, pharmacyId))
          .limit(1);
        if (pharmacyResult.length === 0) {
          console.warn(`[Admin] Pharmacy with ID ${pharmacyId} not found in database`);
          return res.json([]);
        }
        const pharmacy = pharmacyResult[0];

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

      const pharmacyResult = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);
      if (pharmacyResult.length === 0) {
        return res.status(404).json({ message: "Pharmacy not found" });
      }
      const pharmacy = pharmacyResult[0];

      const orderStatsResult = await db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<string>`coalesce(sum(${orders.total}), '0')`,
        })
        .from(orders)
        .where(eq(orders.pharmacyId, pharmacyId));
      if (orderStatsResult.length === 0) throw new Error("Failed to fetch order stats");
      const orderStats = orderStatsResult[0];

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

  // Get pharmacy payment info (for orders)
  app.get("/api/admin/pharmacies/:id/payment-info", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);
      const pharmacyResult = await db
        .select({ id: pharmacies.id, name: pharmacies.name })
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);
      if (pharmacyResult.length === 0) {
        return res.status(404).json({ message: "Pharmacy not found" });
      }

      const ibanSetting = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(sql`key = 'platform_global_iban'`)
        .limit(1);

      const mcxSetting = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(sql`key = 'platform_global_multicaixa_express'`)
        .limit(1);
      const accountNameSetting = await db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(sql`key = 'platform_global_account_name'`)
        .limit(1);

      const globalIban = ibanSetting[0]?.value || null;
      const globalMulticaixa = mcxSetting[0]?.value || null;
      const globalAccountName = accountNameSetting[0]?.value || null;
      const pharmacy = pharmacyResult[0];

      res.json({
        hasIban: !!globalIban,
        hasMulticaixaExpress: !!globalMulticaixa,
        iban: globalIban,
        multicaixaExpress: globalMulticaixa,
        accountName: globalAccountName,
        pharmacyName: pharmacy.name,
      });
    } catch (error) {
      console.error("Fetch payment info error:", error);
      res.status(500).json({ message: "Failed to fetch payment info" });
    }
  });

  // Update pharmacy payment info
  app.patch("/api/admin/pharmacies/:id/payment-info", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id as string);
      const { iban, multicaixaExpress, accountName } = req.body;

      const pharmacyResult = await db
        .select({ id: pharmacies.id })
        .from(pharmacies)
        .where(eq(pharmacies.id, pharmacyId))
        .limit(1);
      if (pharmacyResult.length === 0) {
        return res.status(404).json({ message: "Pharmacy not found" });
      }

      await db
        .insert(systemSettings)
        .values({
          key: "platform_global_iban",
          value: iban || "",
          description: "IBAN único para pagamentos de todas as farmácias",
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: iban || "", updatedAt: new Date() },
        });

      await db
        .insert(systemSettings)
        .values({
          key: "platform_global_multicaixa_express",
          value: multicaixaExpress || "",
          description: "Multicaixa Express global para pagamentos",
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: multicaixaExpress || "", updatedAt: new Date() },
        });
      await db
        .insert(systemSettings)
        .values({
          key: "platform_global_account_name",
          value: accountName || "",
          description: "Titular global da conta para pagamentos",
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: accountName || "", updatedAt: new Date() },
        });

      res.json({
        message: "Dados de pagamento globais atualizados",
        paymentInfo: {
          iban: iban || null,
          multicaixaExpress: multicaixaExpress || null,
          accountName: accountName || null,
        },
      });
    } catch (error) {
      console.error("Update payment info error:", error);
      res.status(500).json({ message: "Failed to update payment info" });
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

  // Get all users - filtered by role query param (ADMIN, FARMACIA, CLIENTE)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const { role } = req.query;

      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users);

      // Filter by role if provided
      if (role) {
        query = query.where(eq(users.role, String(role)));
      }

      const allUsers = await query.orderBy(desc(users.createdAt));

      // Get order count for each user
      const usersWithOrders = await Promise.all(
        allUsers.map(async (user) => {
          const resultArray = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.userId, user.id));
          const result = resultArray.length > 0 ? resultArray[0] : null;
          return { ...user, ordersCount: result?.count || 0 };
        })
      );

      res.json(usersWithOrders);
    } catch (error) {
      console.error("Fetch users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get admin and pharmacy users (ADMIN + FARMACIA roles only)
  app.get("/api/admin/team-users", async (req: Request, res: Response) => {
    try {
      const teamUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          or(
            eq(users.role, 'ADMIN'),
            eq(users.role, 'FARMACIA')
          )
        )
        .orderBy(desc(users.createdAt));

      // Get order count for each user
      const usersWithOrders = await Promise.all(
        teamUsers.map(async (user) => {
          const resultArray = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(eq(orders.userId, user.id));
          const result = resultArray.length > 0 ? resultArray[0] : null;
          return { ...user, ordersCount: result?.count || 0 };
        })
      );

      res.json(usersWithOrders);
    } catch (error) {
      console.error("Fetch team users error:", error);
      res.status(500).json({ message: "Failed to fetch team users" });
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

      const adminUserResult = await db
        .insert(adminUsers)
        .values({
          email,
          password: hashedPassword,
          name,
          role: role || 'admin',
        })
        .returning();
      if (adminUserResult.length === 0) throw new Error("Failed to create admin user");
      const adminUser = adminUserResult[0];

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
      const adminId = parseInt(req.params.id as string);
      const { email, name, role, password } = req.body;

      const updateData: any = {
        email,
        name,
        role,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedAdminResult = await db
        .update(adminUsers)
        .set(updateData)
        .where(eq(adminUsers.id, adminId))
        .returning();
      if (updatedAdminResult.length === 0) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      const updatedAdmin = updatedAdminResult[0];

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
      const adminId = parseInt(req.params.id as string);
      console.log(`[Admin] Attempting to delete admin user with ID: ${adminId}`);

      // First, check if the admin exists
      const existingAdminResult = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .limit(1);
      if (existingAdminResult.length === 0) {
        console.log(`[Admin] Admin user with ID ${adminId} not found`);
        return res.status(404).json({ message: "Administrador não encontrado" });
      }

      const deletedAdminResult = await db
        .delete(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .returning();
      if (deletedAdminResult.length === 0) {
        console.log(`[Admin] Failed to delete admin user with ID ${adminId}`);
        return res.status(500).json({ message: "Falha ao excluir administrador" });
      }
      const deletedAdmin = deletedAdminResult[0];

      console.log(`[Admin] Successfully deleted admin user: ${deletedAdmin.email}`);
      res.json({ message: "Administrador excluído com sucesso" });
    } catch (error) {
      console.error("Delete admin user error:", error);
      res.status(500).json({ message: "Erro ao excluir administrador" });
    }
  });

  // Get system revenue (admin balance)
  app.get("/api/admin/balance", async (req: Request, res: Response) => {
    try {
      // Fetch platform fee from settings
      const feeSettingResult = await db
        .select()
        .from(systemSettings)
        .where(sql`key = 'platform_fee_percent'`)
        .limit(1);
      const feeSetting = feeSettingResult.length > 0 ? feeSettingResult[0] : null;
      const feePercent = feeSetting ? parseFloat(feeSetting.value) / 100 : 0.10;

      // Pending system revenue (orders that haven't been settled yet)
      const systemRevenueResult = await db
        .select({
          total: sql<string>`coalesce(sum(${orders.total}), '0')`,
          count: sql<number>`count(*)`,
          completed: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)`,
        })
        .from(orders)
        .where(isNull(orders.settlementId));

      if (systemRevenueResult.length === 0) throw new Error("Failed to fetch system revenue");
      const systemRevenue = systemRevenueResult[0];

      // Revenue breakdown by pharmacy (only for unpaid/unsettled orders)
      const pharmacyBreakdown = await db
        .select({
          pharmacyId: orders.pharmacyId,
          pharmacyName: pharmacies.name,
          // Total amount for orders paid to the platform (electronic)
          platformRevenue: sql<string>`coalesce(sum(case when ${orders.paymentMethod} IN ('multicaixa_express', 'transferencia', 'atm') then ${orders.total} else '0' end), '0')`,
          // Total amount for orders paid directly to the pharmacy (cash)
          directRevenue: sql<string>`coalesce(sum(case when ${orders.paymentMethod} = 'cash' then ${orders.total} else '0' end), '0')`,
          ordersCount: sql<number>`count(*)`,
          completedOrders: sql<number>`count(case when ${orders.status} = 'delivered' then 1 end)`,
        })
        .from(orders)
        .leftJoin(pharmacies, eq(orders.pharmacyId, pharmacies.id))
        .where(isNull(orders.settlementId))
        .groupBy(orders.pharmacyId, pharmacies.name);

      const formattedBreakdown = pharmacyBreakdown.map(pb => {
        const platRev = parseFloat(pb.platformRevenue || '0');
        const dirRev = parseFloat(pb.directRevenue || '0');
        const totalRev = platRev + dirRev;

        // Platform's 10% on EVERYTHING
        const totalProfit = totalRev * feePercent;

        // What we owe the pharmacy for electronic sales (90%) 
        // MINUS what they owe us for cash sales (10%)
        const payable = (platRev * (1 - feePercent)) - (dirRev * feePercent);

        return {
          pharmacyId: pb.pharmacyId,
          pharmacyName: pb.pharmacyName || 'Unknown',
          revenue: totalRev.toFixed(2),
          platformRevenue: platRev.toFixed(2),
          directRevenue: dirRev.toFixed(2),
          profit: totalProfit.toFixed(2),
          payableToPharmacy: payable.toFixed(2),
          ordersCount: pb.ordersCount || 0,
          completedOrders: pb.completedOrders || 0,
        };
      });

      res.json({
        totalSystemRevenue: systemRevenue.total || '0',
        totalSystemProfit: (parseFloat(systemRevenue.total || '0') * feePercent).toFixed(2),
        totalSystemOrders: systemRevenue.count || 0,
        totalSystemCompleted: systemRevenue.completed || 0,
        platformFeePercent: feeSetting ? feeSetting.value : '10',
        pharmacyBreakdown: formattedBreakdown,
      });

    } catch (error) {
      console.error("Admin balance error:", error);
      res.status(500).json({ message: "Failed to fetch balance data" });
    }
  });

  // Create a new settlement for a pharmacy
  app.post("/api/admin/pharmacies/:id/settle", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id);
      const { amount, platformProfit, totalRevenue, proofUrl, notes } = req.body;

      if (!pharmacyId || !amount) {
        return res.status(400).json({ message: "Pharmacy ID and amount are required" });
      }

      // 1. Create the settlement record
      const settlementResult = await db
        .insert(pharmacySettlements)
        .values({
          pharmacyId,
          amount: String(amount),
          platformProfit: String(platformProfit || 0),
          totalRevenue: String(totalRevenue || amount),
          proofUrl: proofUrl || null,
          notes: notes || null,
        })
        .returning();

      if (settlementResult.length === 0) throw new Error("Failed to create settlement");
      const settlement = settlementResult[0];

      // 2. Mark all currently delivered and unsettled orders for this pharmacy as settled
      await db
        .update(orders)
        .set({ settlementId: settlement.id })
        .where(
          and(
            eq(orders.pharmacyId, pharmacyId),
            eq(orders.status, 'delivered'),
            isNull(orders.settlementId)
          )
        );

      res.status(201).json(settlement);
    } catch (error) {
      console.error("Create settlement error:", error);
      res.status(500).json({ message: "Failed to process settlement" });
    }
  });

  // Get settlement history for a pharmacy
  app.get("/api/admin/pharmacies/:id/settlements", async (req: Request, res: Response) => {
    try {
      const pharmacyId = parseInt(req.params.id);
      const history = await db
        .select()
        .from(pharmacySettlements)
        .where(eq(pharmacySettlements.pharmacyId, pharmacyId))
        .orderBy(desc(pharmacySettlements.createdAt));

      res.json(history);
    } catch (error) {
      console.error("Fetch settlements error:", error);
      res.status(500).json({ message: "Failed to fetch settlement history" });
    }
  });

  // Get all settlements history
  app.get("/api/admin/settlements", async (req: Request, res: Response) => {
    try {
      const history = await db
        .select({
          id: pharmacySettlements.id,
          pharmacyId: pharmacySettlements.pharmacyId,
          pharmacyName: pharmacies.name,
          amount: pharmacySettlements.amount,
          platformProfit: pharmacySettlements.platformProfit,
          totalRevenue: pharmacySettlements.totalRevenue,
          proofUrl: pharmacySettlements.proofUrl,
          createdAt: pharmacySettlements.createdAt,
        })
        .from(pharmacySettlements)
        .leftJoin(pharmacies, eq(pharmacySettlements.pharmacyId, pharmacies.id))
        .orderBy(desc(pharmacySettlements.createdAt));

      res.json(history);
    } catch (error) {
      console.error("Fetch all settlements error:", error);
      res.status(500).json({ message: "Failed to fetch settlement history" });
    }
  });

  // Get generic pharmacy details for admin
  app.get("/api/admin/pharmacies/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await db
        .select()
        .from(pharmacies)
        .where(eq(pharmacies.id, id))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Pharmacy not found" });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Get pharmacy error:", error);
      res.status(500).json({ message: "Failed to fetch pharmacy details" });
    }
  });
}
