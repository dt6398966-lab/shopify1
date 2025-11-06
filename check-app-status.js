// check-app-status.js - Check if app is still installed and get fresh token
import dotenv from 'dotenv';
import prisma from './app/db.server.js';

dotenv.config();

async function checkAppStatus() {
  try {
    console.log("🔍 Checking app installation status...\n");

    // Get all sessions
    const sessions = await prisma.session.findMany();
    
    if (sessions.length === 0) {
      console.log("❌ No sessions found - App not installed");
      return;
    }

    console.log(`📊 Found ${sessions.length} sessions:`);
    
    for (const session of sessions) {
      console.log(`\n🏪 Shop: ${session.shop}`);
      console.log(`🔑 Access Token: ${session.accessToken.substring(0, 20)}...`);
      console.log(`📧 Email: ${session.email || 'N/A'}`);
      console.log(`⏰ Expires: ${session.expires || 'N/A'}`);
      console.log(`🔄 Is Online: ${session.isOnline}`);
      console.log(`👤 User ID: ${session.userId || 'N/A'}`);
      console.log(`📋 Scopes: ${session.scope || 'N/A'}`);
      
      // Check if token is expired
      if (session.expires) {
        const now = new Date();
        const expires = new Date(session.expires);
        const isExpired = now > expires;
        console.log(`⏳ Token Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
      }
    }

    // Test the latest session
    const latestSession = sessions[0];
    console.log(`\n🧪 Testing latest session for ${latestSession.shop}...`);
    
    try {
      const response = await fetch(`https://${latestSession.shop}/admin/api/2024-07/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': latestSession.accessToken,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Token is VALID - Shop: ${data.shop?.name || 'Unknown'}`);
        console.log(`🏪 Shop Domain: ${data.shop?.domain || 'Unknown'}`);
        console.log(`🌍 Country: ${data.shop?.country || 'Unknown'}`);
      } else {
        const error = await response.text();
        console.log(`❌ Token is INVALID: ${response.status} - ${error.substring(0, 200)}...`);
        
        if (response.status === 401) {
          console.log("\n💡 Solution: Reinstall the app to get a fresh access token");
        }
      }
    } catch (error) {
      console.log(`❌ Error testing token: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Error checking app status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppStatus();
