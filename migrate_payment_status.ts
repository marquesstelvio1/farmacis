// Migration script to fix payment status for orders with payment proof
import "dotenv/config";
import { db } from './server/db';
import { orders } from './shared/schema';
import { sql } from 'drizzle-orm';

async function migratePaymentStatus() {
  console.log('=== MIGRAÇÃO: Atualizar payment_status para pedidos com comprovativo ===\n');
  
  try {
    console.log('Checking orders...');
    
    // Use select instead of execute for proper typing
    const ordersToUpdate = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        paymentStatus: orders.paymentStatus,
        paymentProof: orders.paymentProof,
      })
      .from(orders)
      .where(sql`payment_proof IS NOT NULL AND payment_proof != '' AND payment_status != 'paid'`);
    
    console.log(`Found ${ordersToUpdate.length} orders with payment proof but unpaid status`);
    
    if (ordersToUpdate.length > 0) {
      console.log('\nOrders to update:');
      ordersToUpdate.forEach((order) => {
        console.log(`  - Order #${order.id}: ${order.customerName} (${order.paymentStatus})`);
      });
      
      // Update them
      await db
        .update(orders)
        .set({ 
          paymentStatus: 'paid',
          updatedAt: new Date()
        })
        .where(
          sql`payment_proof IS NOT NULL 
           AND payment_proof != '' 
           AND payment_status != 'paid'`
        );
      
      console.log(`\n✅ Successfully updated ${ordersToUpdate.length} orders`);
      console.log('All orders with payment proof now have payment_status = "paid"');
    } else {
      console.log('\n✅ No orders need updating. All good!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

migratePaymentStatus();
