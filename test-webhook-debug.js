// test-webhook-debug.js - Debug webhook creation with proper environment setup
import dotenv from 'dotenv';
import { createWebhooksForShop, getWebhookSecret } from './app/services/webhookService.js';

// Load environment variables
dotenv.config();

async function debugWebhookCreation() {
  try {
    console.log("🧪 Debugging webhook creation...\n");

    // Check environment variables
    console.log("🔍 Environment Check:");
    console.log(`SHOPIFY_API_KEY: ${process.env.SHOPIFY_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`SHOPIFY_API_SECRET: ${process.env.SHOPIFY_API_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`SHOPIFY_APP_URL: ${process.env.SHOPIFY_APP_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}\n`);

    // Test data (replace with your actual shop and access token)
    const testShop = "dispatch-solutions.myshopify.com";
    const testAccessToken = process.env.SHOPIFY_ACCESS_TOKEN || "your-access-token-here";

    console.log(`📝 Testing with shop: ${testShop}`);
    console.log(`🔑 Access token: ${testAccessToken.substring(0, 10)}...\n`);

    // Test webhook creation
    console.log("🔗 Creating webhooks...");
    const result = await createWebhooksForShop(testShop, testAccessToken);
    
    console.log("\n📊 Webhook Creation Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ Webhook creation test completed successfully!");
      
      // Test getting webhook secret
      const secret = await getWebhookSecret(testShop);
      console.log(`🔐 Retrieved webhook secret: ${secret ? secret.substring(0, 10) + '...' : 'Not found'}`);
    } else {
      console.log("\n❌ Webhook creation test failed!");
      console.log("Error details:", result.error);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Run the test
debugWebhookCreation();
