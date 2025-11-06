import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { shop, topic, payload } = await authenticate.webhook(request);

    console.log(`✅ GDPR Webhook verified: ${topic} for ${shop}`);
    console.log("Payload:", payload);

    // GDPR: Customer data request webhook
    // Shopify will send: {shop_id, shop_domain, customer}
    // We need to return customer data in JSONL format
    // For now, return empty response with 200 status
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`❌ GDPR webhook error:`, error);
    return new Response("Unauthorized", { status: 401 });
  }
};

export const loader = () => new Response("Method Not Allowed", { status: 405 });

