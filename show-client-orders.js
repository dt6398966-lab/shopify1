// Show orders by client/shop
import { mySqlQury } from './app/dbMysl.js';

async function showClientOrders() {
  try {
    console.log("📊 Orders by Client/Shop:\n");
    
    const result = await mySqlQury(`
      SELECT 
        shop_name,
        COUNT(*) as total_orders,
        SUM(grand_total) as total_amount,
        AVG(grand_total) as avg_order_value
      FROM tbl_ecom_orders
      GROUP BY shop_name
      ORDER BY total_orders DESC
    `);
    
    if (result.length === 0) {
      console.log("⚠️  No orders found yet");
      console.log("💡 Create a test order in Shopify to see data!");
      return;
    }
    
    console.log(`✅ Found ${result.length} clients:\n`);
    
    result.forEach((client, index) => {
      console.log(`${index + 1}. Client: ${client.shop_name || 'Unknown'}`);
      console.log(`   📦 Total Orders: ${client.total_orders}`);
      console.log(`   💰 Total Amount: ₹${client.total_amount || 0}`);
      console.log(`   📊 Avg Order: ₹${Math.round(client.avg_order_value || 0)}`);
      
      // Show latest orders for this client
      console.log(`   🕐 Recent Orders:`);
    });
    
    // Show detailed breakdown
    console.log("\n" + "=".repeat(60));
    console.log("📝 DETAILED BREAKDOWN:");
    console.log("=".repeat(60));
    
    for (const client of result) {
      console.log(`\n🏬 ${client.shop_name}:`);
      const orders = await mySqlQury(`
        SELECT id, orderid, grand_total, shop_name
        FROM tbl_ecom_orders 
        WHERE shop_name = ?
        ORDER BY id DESC
        LIMIT 5
      `, [client.shop_name]);
      
      orders.forEach(order => {
        console.log(`   - Order #${order.orderid} - ₹${order.grand_total}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

showClientOrders();


