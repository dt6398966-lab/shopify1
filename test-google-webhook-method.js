// test-google-webhook-method.js - Test Google's registerWebhooks method
import dotenv from 'dotenv';
import shopify from './app/shopify.server.js';
import prisma from './app/db.server.js';

dotenv.config();

async function testGoogleWebhookMethod() {
  try {
    console.log("🧪 Testing Google's registerWebhooks method...\n");

    // Get latest session
    const sessions = await prisma.session.findMany({
      orderBy: { id: 'desc' },
      take: 1
    });

    if (sessions.length === 0) {
      console.log("❌ No sessions found - Please install the app first");
      return;
    }

    const session = sessions[0];
    console.log(`🏪 Shop: ${session.shop}`);
    console.log(`🔑 Access Token: ${session.accessToken.substring(0, 20)}...\n`);

    // Test API access first
    console.log("🧪 Testing API access...");
    const response = await fetch(`https://${session.shop}/admin/api/2024-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': session.accessToken,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ API access failed: ${response.status} - ${error.substring(0, 200)}...`);
      console.log("\n💡 Please reinstall the app to get a fresh access token");
      return;
    }

    const shopData = await response.json();
    console.log(`✅ API access successful - Shop: ${shopData.shop?.name}`);

    // Test Google's registerWebhooks method
    console.log("\n🔗 Testing Google's registerWebhooks method...");
    
    try {
      // This will use the webhook configuration from shopify.app.toml
      await shopify.registerWebhooks();
      console.log("✅ Google's registerWebhooks method executed successfully!");
      
      // Check if webhooks were created
      console.log("\n🔍 Checking created webhooks...");
      const webhookResponse = await fetch(`https://${session.shop}/admin/api/2024-07/webhooks.json`, {
        headers: {
          'X-Shopify-Access-Token': session.accessToken,
          'Content-Type': 'application/json',
        }
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        const webhooks = webhookData.webhooks || [];
        
        console.log(`📊 Found ${webhooks.length} webhooks:`);
        
        webhooks.forEach((webhook, index) => {
          console.log(`\n${index + 1}. Topic: ${webhook.topic}`);
          console.log(`   Address: ${webhook.address}`);
          console.log(`   Format: ${webhook.format}`);
          console.log(`   Created: ${webhook.created_at}`);
          console.log(`   Updated: ${webhook.updated_at}`);
        });

        if (webhooks.length === 0) {
          console.log("\n⚠️  No webhooks found. This could mean:");
          console.log("   1. Webhooks were not created");
          console.log("   2. Webhooks were created but not visible");
          console.log("   3. API version mismatch");
        } else {
          console.log("\n✅ Webhooks found! Google's method is working!");
        }
      } else {
        const error = await webhookResponse.text();
        console.log(`❌ Failed to fetch webhooks: ${webhookResponse.status} - ${error.substring(0, 200)}...`);
      }

    } catch (error) {
      console.error("❌ Google's registerWebhooks method failed:", error);
      console.error("Error details:", error.message);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleWebhookMethod();
