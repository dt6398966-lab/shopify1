// debug-webhook.js - Debug webhook creation process
import { createWebhooksForShop } from "./app/services/webhookService.js";

async function debugWebhookCreation() {
  console.log("🔍 Debugging webhook creation process...\n");

  // Test with a sample shop and access token
  const testShop = "dispatch-solutions.myshopify.com"; // Your actual shop
  const testAccessToken = "shpat_1234567890abcdef"; // You'll need to get this from your session

  console.log(`📝 Test Shop: ${testShop}`);
  console.log(`🔑 Test Access Token: ${testAccessToken.substring(0, 15)}...`);
  console.log(`🌐 App URL: ${process.env.SHOPIFY_APP_URL}`);
  console.log(`🔧 API Key: ${process.env.SHOPIFY_API_KEY}`);
  console.log(`🔐 API Secret: ${process.env.SHOPIFY_API_SECRET?.substring(0, 10)}...\n`);

  try {
    console.log("🚀 Starting webhook creation...");
    
    const result = await createWebhooksForShop(testShop, testAccessToken);
    
    console.log("\n📊 Result:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log("\n✅ Webhook creation successful!");
    } else {
      console.log("\n❌ Webhook creation failed!");
      console.log("Error:", result.error);
    }
    
  } catch (error) {
    console.error("\n💥 Error during webhook creation:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

debugWebhookCreation();
