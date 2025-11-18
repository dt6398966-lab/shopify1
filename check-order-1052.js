// Check if order #1052 is synced in database
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrder() {
  try {
    console.log('🔍 Checking database for order #1052...\n');
    
    // Order ID from the URL: 5714027839572
    const orderId = 5714027839572;
    
    // Check OrderEvent table
    console.log('📊 Checking OrderEvent table...');
    const orderEvents = await prisma.orderEvent.findMany({
      where: {
        orderId: BigInt(orderId)
      },
      orderBy: {
        receivedAt: 'desc'
      }
    });
    
    if (orderEvents.length > 0) {
      console.log(`✅ Found ${orderEvents.length} order event(s) for order ID: ${orderId}\n`);
      
      orderEvents.forEach((event, index) => {
        console.log(`--- Event ${index + 1} ---`);
        console.log(`ID: ${event.id}`);
        console.log(`Shop: ${event.shop}`);
        console.log(`Topic: ${event.topic}`);
        console.log(`Order ID: ${event.orderId}`);
        console.log(`Received At: ${event.receivedAt}`);
        
        // Show order number from payload if available
        if (event.payload && event.payload.order_number) {
          console.log(`Order Number: #${event.payload.order_number}`);
        }
        if (event.payload && event.payload.name) {
          console.log(`Order Name: ${event.payload.name}`);
        }
        console.log('');
      });
      
      // Show first event payload summary
      if (orderEvents[0].payload) {
        const payload = orderEvents[0].payload;
        console.log('📦 Order Details:');
        console.log(`   Order Number: #${payload.order_number || 'N/A'}`);
        console.log(`   Order Name: ${payload.name || 'N/A'}`);
        console.log(`   Total Price: ${payload.total_price || 'N/A'} ${payload.currency || ''}`);
        console.log(`   Financial Status: ${payload.financial_status || 'N/A'}`);
        console.log(`   Fulfillment Status: ${payload.fulfillment_status || 'N/A'}`);
        console.log(`   Customer: ${payload.customer ? (payload.customer.first_name + ' ' + payload.customer.last_name) : 'N/A'}`);
        console.log(`   Items Count: ${payload.line_items ? payload.line_items.length : 0}`);
        if (payload.line_items && payload.line_items.length > 0) {
          console.log(`   First Item: ${payload.line_items[0].title || 'N/A'}`);
        }
      }
      
      console.log('\n✅ ORDER IS SYNCED TO DATABASE!');
    } else {
      console.log(`❌ No order events found for order ID: ${orderId}`);
      console.log('\n🔍 Checking all recent orders...\n');
      
      // Check recent orders
      const recentOrders = await prisma.orderEvent.findMany({
        where: {
          topic: 'orders/create'
        },
        orderBy: {
          receivedAt: 'desc'
        },
        take: 10
      });
      
      if (recentOrders.length > 0) {
        console.log(`Found ${recentOrders.length} recent order(s):\n`);
        recentOrders.forEach((order, index) => {
          const payload = order.payload;
          console.log(`${index + 1}. Order ID: ${order.orderId}`);
          console.log(`   Order Number: #${payload?.order_number || 'N/A'}`);
          console.log(`   Shop: ${order.shop}`);
          console.log(`   Received: ${order.receivedAt}`);
          console.log('');
        });
      } else {
        console.log('❌ No orders found in database at all!');
        console.log('⚠️  This might mean:');
        console.log('   1. Webhooks are not being received');
        console.log('   2. Webhook authentication is failing (401 errors)');
        console.log('   3. App needs to be reinstalled to fix webhook secrets');
      }
    }
    
    // Check total count
    const totalCount = await prisma.orderEvent.count({
      where: {
        topic: 'orders/create'
      }
    });
    console.log(`\n📊 Total orders in database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();

