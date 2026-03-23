import { db } from "./server/db";
import { orders, orderItems, orderStatusHistory } from "./shared/schema";
import { eq, sql } from "drizzle-orm";

async function clearOrderHistory() {
  try {
    console.log("🚨 INICIANDO LIMPEZA DE HISTÓRICO DE PEDIDOS...");
    
    // Opção 1: Deletar TODOS os pedidos (descomente se quiser)
    // console.log("Deletando todos os order items...");
    // await db.delete(orderItems);
    // console.log("Deletando todos os order status history...");
    // await db.delete(orderStatusHistory);
    // console.log("Deletando todos os pedidos...");
    // await db.delete(orders);

    // Opção 2: Deletar apenas pedidos antigos (mais de 90 dias)
    const daysAgo = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    console.log(`\n📅 Deletando pedidos anteriores a ${cutoffDate.toLocaleDateString('pt-BR')}...`);

    // Buscar IDs dos pedidos para deletar
    const oldOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(sql`${orders.createdAt} < ${cutoffDate}`);

    if (oldOrders.length === 0) {
      console.log("✅ Nenhum pedido antigo para deletar.");
      return;
    }

    console.log(`🔍 Encontrados ${oldOrders.length} pedidos antigos.`);
    const orderIds = oldOrders.map(o => o.id);

    // Deletar items dos pedidos antigos
    console.log("Deletando itens dos pedidos antigos...");
    const deletedItemsResult = await db
      .delete(orderItems)
      .where(sql`${orderItems.orderId} IN (${sql.raw(orderIds.join(','))})`)
      .returning();
    const deletedItems = deletedItemsResult.length;
    console.log(`✅ ${deletedItems} itens deletados.`);

    // Deletar histórico de status
    console.log("Deletando histórico de status...");
    const deletedHistoryResult = await db
      .delete(orderStatusHistory)
      .where(sql`${orderStatusHistory.orderId} IN (${sql.raw(orderIds.join(','))})`)
      .returning();
    const deletedHistory = deletedHistoryResult.length;
    console.log(`✅ ${deletedHistory} registros de histórico deletados.`);

    // Deletar pedidos antigos
    console.log("Deletando pedidos antigos...");
    const deletedOrdersResult = await db
      .delete(orders)
      .where(sql`${orders.createdAt} < ${cutoffDate}`)
      .returning();
    const deletedOrders = deletedOrdersResult.length;
    console.log(`✅ ${deletedOrders} pedidos deletados.`);

    console.log("\n✅ LIMPEZA CONCLUÍDA COM SUCESSO!");
    console.log(`📊 Total de registros removidos: ${deletedItems + deletedHistory + deletedOrders}`);
  } catch (error) {
    console.error("❌ Erro ao limpar histórico de pedidos:", error);
    process.exit(1);
  }
}

clearOrderHistory();
