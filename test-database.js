// test-database.js - Test script to check database tables
import prisma from "./app/db.server.js";

async function testDatabase() {
  try {
    console.log("🔍 Testing database tables...\n");

    // Test OrderEvent table
    console.log("📊 OrderEvent table:");
    const orderEvents = await prisma.orderEvent.findMany({
      take: 5,
      orderBy: { receivedAt: 'desc' }
    });
    console.log(`Found ${orderEvents.length} OrderEvent records:`);
    orderEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ID: ${event.id}, Shop: ${event.shop}, Topic: ${event.topic}, OrderID: ${event.orderId}`);
    });

    // Test User table
    console.log("\n👤 User table:");
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${users.length} User records:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}, Email: ${user.email}, Shop: ${user.shop}, Created: ${user.createdAt}`);
    });

    // Test Session table
    console.log("\n🔐 Session table:");
    const sessions = await prisma.session.findMany({
      take: 5,
      orderBy: { expires: 'desc' }
    });
    console.log(`Found ${sessions.length} Session records:`);
    sessions.forEach((session, index) => {
      console.log(`  ${index + 1}. ID: ${session.id}, Shop: ${session.shop}, Online: ${session.isOnline}, Expires: ${session.expires}`);
    });

    // Count all records
    console.log("\n📈 Table counts:");
    const orderEventCount = await prisma.orderEvent.count();
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    
    console.log(`  OrderEvent: ${orderEventCount} records`);
    console.log(`  User: ${userCount} records`);
    console.log(`  Session: ${sessionCount} records`);

    console.log("\n✅ Database test completed successfully!");

  } catch (error) {
    console.error("❌ Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase();
