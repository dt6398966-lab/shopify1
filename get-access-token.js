// get-access-token.js - Get access token from database
import dotenv from 'dotenv';
import prisma from './app/db.server.js';

dotenv.config();

async function getAccessToken() {
  try {
    console.log("🔍 Getting access token from database...\n");

    // Get all sessions
    const sessions = await prisma.session.findMany();
    
    console.log(`📊 Found ${sessions.length} sessions:`);
    
    sessions.forEach((session, index) => {
      console.log(`\n${index + 1}. Shop: ${session.shop}`);
      console.log(`   Access Token: ${session.accessToken.substring(0, 20)}...`);
      console.log(`   Email: ${session.email || 'N/A'}`);
      console.log(`   Created: ${session.expires || 'N/A'}`);
    });

    if (sessions.length > 0) {
      const latestSession = sessions[0];
      console.log(`\n✅ Latest access token for ${latestSession.shop}:`);
      console.log(`   ${latestSession.accessToken}`);
    } else {
      console.log("\n❌ No sessions found in database");
    }

  } catch (error) {
    console.error("❌ Error getting access token:", error);
  } finally {
    await prisma.$disconnect();
  }
}

getAccessToken();
