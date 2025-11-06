// verify-installation.js - Verify app installation and webhook creation
import dotenv from 'dotenv';
import prisma from './app/db.server.js';
import { createWebhooksForShop, getWebhookSecret } from './app/services/webhookService.js';

dotenv.config();

async function verifyInstallation() {
  try {
    console.log("🔍 Verifying app installation...\n");

    // Get latest session
    const sessions = await prisma.session.findMany({
      orderBy: { id: 'desc' },
      take: 1
    });

    if (sessions.length === 0) {
      console.log("❌ No sessions found - App not installed");
      return;
    }

    const session = sessions[0];
    console.log(`🏪 Shop: ${session.shop}`);
    console.log(`🔑 Access Token: ${session.accessToken.substring(0, 20)}...`);
    console.log(`📋 Scopes: ${session.scope}\n`);

    // Test API access
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

    // Create webhooks
    console.log("\n🔗 Creating webhooks...");
    const webhookResult = await createWebhooksForShop(session.shop, session.accessToken);
    
    console.log("\n📊 Webhook Creation Result:");
    console.log(JSON.stringify(webhookResult, null, 2));

    if (webhookResult.success) {
      console.log("\n✅ Webhook creation completed successfully!");
      
      // Verify webhook secret
      const secret = await getWebhookSecret(session.shop);
      console.log(`🔐 Webhook secret: ${secret ? secret.substring(0, 10) + '...' : 'Not found'}`);
      
      // Check webhook results
      const successCount = webhookResult.results.filter(r => r.status === 'created').length;
      const failCount = webhookResult.results.filter(r => r.status === 'failed').length;
      
      console.log(`\n📈 Summary:`);
      console.log(`   ✅ Webhooks created: ${successCount}`);
      console.log(`   ❌ Webhooks failed: ${failCount}`);
      
      if (failCount > 0) {
        console.log(`\n⚠️  Failed webhooks:`);
        webhookResult.results
          .filter(r => r.status === 'failed')
          .forEach(r => console.log(`   - ${r.topic}: ${r.error}`));
      }
    } else {
      console.log("\n❌ Webhook creation failed!");
      console.log("Error details:", webhookResult.error);
    }

  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyInstallation();
