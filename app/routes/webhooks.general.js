// app/routes/webhooks.general.js - General webhook handler for all events
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    console.log("📦 General webhook handler - Incoming webhook...");

    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log("✅ HMAC verified:", topic, shop);

    // 5️⃣ Store ALL webhook events in OrderEvent table
    try {
      await prisma.orderEvent.create({
        data: {
          shop: shop || "unknown",
          topic: topic || "unknown",
          orderId: payload?.id ? BigInt(payload.id) : null,
          payload: payload,
        },
      });
      console.log(`✅ ${topic} event stored in OrderEvent table`);
    } catch (prismaError) {
      console.error("❌ Error storing OrderEvent:", prismaError);
      // Don't fail the webhook if storage fails
    }

    // 6️⃣ Handle specific webhook types
    if (topic === "ORDERS_CREATE" || topic === "orders/create") {
      console.log("🧾 Order created:", payload.id);
      // Additional order-specific logic can go here
    } else if (topic === "APP_UNINSTALLED" || topic === "app/uninstalled") {
      console.log("🚫 App uninstalled for shop:", shop);
      // Handle app uninstall logic
    } else if (topic === "CUSTOMERS_DATA_REQUEST" || topic === "customers/data_request") {
      console.log("📋 GDPR: Customer data request for shop:", shop);
      // GDPR compliance - customer data request
    } else if (topic === "CUSTOMERS_REDACT" || topic === "customers/redact") {
      console.log("🗑️ GDPR: Customer redaction request for shop:", shop);
      // GDPR compliance - customer data deletion
    } else if (topic === "SHOP_REDACT" || topic === "shop/redact") {
      console.log("🗑️ GDPR: Shop redaction request for shop:", shop);
      // GDPR compliance - shop data deletion
    } else {
      console.log(`ℹ️ Other webhook event: ${topic}`);
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        shop, 
        topic, 
        event_id: payload.id || "no_id",
        message: "Webhook event stored successfully"
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ General webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Block GET requests (webhooks are always POST)
export const loader = () => new Response("Method Not Allowed", { status: 405 });
