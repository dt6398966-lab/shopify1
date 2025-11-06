// manual-webhook-test.js - Manual webhook creation test
import dotenv from 'dotenv';
dotenv.config();

async function testManualWebhookCreation() {
  console.log("🧪 Manual Webhook Creation Test\n");
  
  // Your actual shop details (get these from Shopify admin)
  const shop = "dispatch-solutions.myshopify.com";
  const accessToken = "YOUR_ACCESS_TOKEN_HERE"; // Get this from your app's session
  
  console.log(`🏪 Shop: ${shop}`);
  console.log(`🔑 Access Token: ${accessToken.substring(0, 15)}...`);
  console.log(`🌐 App URL: ${process.env.SHOPIFY_APP_URL}\n`);

  try {
    // Test 1: Check if we can access Shopify API
    console.log("📡 Testing Shopify API access...");
    const testResponse = await fetch(`https://${shop}/admin/api/2025-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.ok) {
      const shopData = await testResponse.json();
      console.log("✅ Shopify API access successful!");
      console.log(`🏪 Shop Name: ${shopData.shop.name}`);
    } else {
      console.log("❌ Shopify API access failed!");
      console.log("Status:", testResponse.status);
      console.log("Response:", await testResponse.text());
      return;
    }

    // Test 2: Create webhook
    console.log("\n🔗 Creating webhook...");
    const webhookResponse = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: "orders/create",
          address: `${process.env.SHOPIFY_APP_URL}/webhooks/orders/create`,
          format: "json"
        }
      })
    });

    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log("✅ Webhook created successfully!");
      console.log(`🆔 Webhook ID: ${webhookData.webhook.id}`);
      console.log(`📍 Webhook URL: ${webhookData.webhook.address}`);
    } else {
      console.log("❌ Webhook creation failed!");
      console.log("Status:", webhookResponse.status);
      console.log("Response:", await webhookResponse.text());
    }

  } catch (error) {
    console.error("💥 Error:", error);
  }
}

testManualWebhookCreation();
