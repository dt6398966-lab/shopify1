import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`✅ GDPR Webhook verified: ${topic} for ${shop}`);
    console.log("Payload:", payload);

    // GDPR: Customer redaction webhook
    // Delete customer data as per GDPR requirements
    const { customer_id, shop_id } = payload;
    
    if (customer_id) {
      // Delete customer data from database
      // Note: In a real app, you would delete customer-specific data
      // For now, we'll log the request
      console.log(`✅ Customer redaction request for ${customer_id}`);
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`❌ GDPR webhook error:`, error);
    return new Response("Unauthorized", { status: 401 });
  }
};

export const loader = () => new Response("Method Not Allowed", { status: 405 });

