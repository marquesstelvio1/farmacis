import express, { Express, Request, Response } from "express";
import { db } from "../db";
import { payments, insertPaymentSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export function registerPaymentRoutes(app: Express) {
  // Create payment intent (Stripe)
  app.post("/api/payments/create-intent", async (req: Request, res: Response) => {
    try {
      const { amount, currency = "aoa", orderId } = req.body;

      // Convert amount to cents/smallest currency unit
      const amountInCents = Math.round(parseFloat(amount) * 100);

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId.toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Erro ao criar pagamento" });
    }
  });

  // Process M-Pesa payment (simulated for Angola)
  app.post("/api/payments/mpesa", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, amount, orderId, userId } = req.body;

      // Validate input
      if (!phoneNumber || !amount || !orderId || !userId) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      // Create payment record
      const result = await db
        .insert(payments)
        .values({
          userId,
          orderId,
          amount: amount.toString(),
          currency: "AOA",
          status: "pending",
          paymentMethod: "mpesa",
        })
        .returning();

      if (result.length === 0) {
        return res.status(500).json({ message: "Erro ao criar pagamento" });
      }

      const payment = result[0];
      // Simulate M-Pesa API call
      // In production, integrate with actual M-Pesa API
      const transactionId = `MP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Simulate processing delay
      setTimeout(async () => {
        await db
          .update(payments)
          .set({
            status: "completed",
            transactionId,
          })
          .where(eq(payments.id, payment.id));
      }, 2000);

      res.json({
        message: "Pagamento M-Pesa iniciado",
        paymentId: payment.id,
        transactionId,
        status: "pending",
      });
    } catch (error) {
      console.error("Error processing M-Pesa payment:", error);
      res.status(500).json({ message: "Erro ao processar pagamento M-Pesa" });
    }
  });

  // Process bank transfer
  app.post("/api/payments/bank-transfer", async (req: Request, res: Response) => {
    try {
      const { bankName, accountNumber, amount, orderId, userId } = req.body;

      if (!bankName || !accountNumber || !amount || !orderId || !userId) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      // Create payment record
      const result = await db
        .insert(payments)
        .values({
          userId,
          orderId,
          amount: amount.toString(),
          currency: "AOA",
          status: "pending",
          paymentMethod: "bank_transfer",
        })
        .returning();

      if (result.length === 0) {
        return res.status(500).json({ message: "Erro ao criar pagamento" });
      }

      const payment = result[0];
      // Generate reference number
      const referenceNumber = `TR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      res.json({
        message: "Transferência bancária registrada",
        paymentId: payment.id,
        referenceNumber,
        bankDetails: {
          bankName,
          accountNumber,
          reference: referenceNumber,
        },
        status: "pending",
        instructions: `Por favor, efetue a transferência de ${amount} AOA para a conta acima e utilize a referência ${referenceNumber}. O pedido será processado após confirmação do pagamento.`,
      });
    } catch (error) {
      console.error("Error processing bank transfer:", error);
      res.status(500).json({ message: "Erro ao processar transferência bancária" });
    }
  });

  // Get payment status
  app.get("/api/payments/:id/status", async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id as string);

      const result = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }

      const payment = result[0];

      res.json({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar status do pagamento" });
    }
  });

  // Webhook for Stripe events
  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const sigHeader = req.headers["stripe-signature"];
    const sig = (Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader as string)) || "";
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!sig || !req.rawBody) {
      return res.status(400).send("Webhook Error: Missing stripe-signature or raw body");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, endpointSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent was successful!");
        // Update payment status in database
        break;
      case "payment_intent.payment_failed":
        console.log("Payment failed");
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });
}
