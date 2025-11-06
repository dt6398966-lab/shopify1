// test-webhook-creation.js - Test webhook creation manually
import { createWebhooksForShop, getWebhookSecret } from "./app/services/webhookService.js";

async function testWebhookCreation() {
  try {
    console.log("🧪 Testing webhook creation...\n");

    // Test data (replace with your actual shop and access token)
    const testShop = "your-shop.myshopify.com";
    const testAccessToken = "your-access-token";

    console.log(`📝 Testing with shop: ${testShop}`);
    console.log(`🔑 Access token: ${testAccessToken.substring(0, 10)}...`);

    // Test webhook creation
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
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testWebhookCreation();
