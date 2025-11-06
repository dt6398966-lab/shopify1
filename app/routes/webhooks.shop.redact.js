import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`✅ GDPR Webhook verified: ${topic} for ${shop}`);
    console.log("Payload:", payload);

    // GDPR: Shop redaction webhook
    // Delete all shop data as per GDPR requirements
    try {
      // Delete all order events for this shop
      await prisma.orderEvent.deleteMany({
        where: { shop: shop }
      });
      
      // Delete all sessions for this shop
      await prisma.session.deleteMany({
        where: { shop: shop }
      });
      
      console.log(`✅ Deleted all data for shop ${shop}`);
    } catch (error) {
      console.error("❌ Error deleting shop data:", error);
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`❌ GDPR webhook error:`, error);
    return new Response("Unauthorized", { status: 401 });
  }
};

export const loader = () => new Response("Method Not Allowed", { status: 405 });

