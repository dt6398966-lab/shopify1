// app/routes/webhooks.js - Main webhook handler for compliance webhooks
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    console.log("📦 Main webhook handler - Incoming webhook...");

    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log("✅ HMAC verified:", topic, shop);

    // Store webhook event
    try {
      await prisma.orderEvent.create({
        data: {
          shop: shop || "unknown",
          topic: topic || "unknown",
          orderId: payload?.id ? BigInt(payload.id) : null,
          payload: payload,
        },
      });
      console.log(`✅ ${topic} event stored`);
    } catch (prismaError) {
      console.error("❌ Error storing event:", prismaError);
      // Don't fail the webhook if storage fails
    }

    // Handle specific compliance webhook types
    if (topic === "CUSTOMERS_DATA_REQUEST" || topic === "customers/data_request") {
      console.log("📋 GDPR: Customer data request for shop:", shop);
      // Return 200 to acknowledge receipt
    } else if (topic === "CUSTOMERS_REDACT" || topic === "customers/redact") {
      console.log("🗑️ GDPR: Customer redaction request for shop:", shop);
      // Return 200 to acknowledge receipt
    } else if (topic === "SHOP_REDACT" || topic === "shop/redact") {
      console.log("🗑️ GDPR: Shop redaction request for shop:", shop);
      // Delete all shop data
      try {
        await prisma.orderEvent.deleteMany({ where: { shop: shop } });
        await prisma.session.deleteMany({ where: { shop: shop } });
        console.log(`✅ Deleted all data for shop ${shop}`);
      } catch (error) {
        console.error("❌ Error deleting shop data:", error);
      }
    }

    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    // Return 401 for invalid HMAC (required by automated checks)
    return new Response("Unauthorized", { status: 401 });
  }
};

// Block GET requests (webhooks are always POST)
export const loader = () => new Response("Method Not Allowed", { status: 405 });

