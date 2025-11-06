// app/routes/webhooks.orders.create.js  (or wherever your webhook lives)
import crypto from "crypto";
import{ mySqlQury } from "../dbMysl";
// const {  mySqlQury } = require('../dbMysl');
// [shopify-api/INFO] version 11.14.1, environment Remix
// [remix-serve] http://localhost:57065 (http://192.168.1.31:57065)

// ✅ Connected to MySQL database!

// Always use the Webhook secret (NOT API secret)
const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET?.trim() || "0911e8eed2d9783ad6d2b25b261b300e8d9f9af4340c59c775e663586f67a89a";

// Helper function to get client ID from shop domain
async function getClientIdFromShop(shopDomain) {
  try {
    const integrations = await mySqlQury(
      "SELECT clientId FROM tbl_shopify_integration WHERE shopyfy_url = ? LIMIT 1",
      [shopDomain]
    );
    
    if (integrations && integrations.length > 0) {
      return integrations[0].clientId;
    }
    
    // Default to client ID 1 if not found
    console.log(`⚠️ No integration found for shop ${shopDomain}, using default client ID 1`);
    return 1;
  } catch (error) {
    console.error("❌ Error getting client ID:", error);
    return 1; // Default fallback
  }
}

export const action = async ({ request }) => {
  try {
    console.log("📦 Incoming webhook...");

    // 1️⃣ Read raw body exactly as received
    const rawBody = await request.arrayBuffer();
    const rawBuffer = Buffer.from(rawBody);

    // 2️⃣ Headers
    const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
    const topic = request.headers.get("x-shopify-topic");
    const shop = request.headers.get("x-shopify-shop-domain");

    // 3️⃣ HMAC verify
    const localHmac = crypto
      .createHmac("sha256", SHOPIFY_SECRET)
      .update(rawBuffer)
      .digest("base64");

    const valid =
      hmacHeader &&
      localHmac.length === hmacHeader.length &&
      crypto.timingSafeEqual(
        Buffer.from(localHmac, "base64"),
        Buffer.from(hmacHeader, "base64")
      );

    if (!valid) {
      console.error("❌ HMAC verification failed");
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("✅ HMAC verified:", topic, shop);

    // 4️⃣ Parse payload
    const payload = JSON.parse(new TextDecoder("utf-8").decode(rawBuffer));

    console.log("payload   ", payload);

    // 5️⃣ Handle only orders/create
    if (topic !== "orders/create") {
      return new Response("Ignored", { status: 204 });
    }

    console.log("🧾 Order received:", payload.id);

    // 🚀 Begin transaction
    await mySqlQury("START TRANSACTION");

    try {
      // ⚠️ Check duplicate order (using Shopify internal ID)
      const [existing] = await mySqlQury(
        `SELECT id FROM tbl_ecom_orders WHERE orderid = ? AND channel = 'shopify' LIMIT 1`,
        [payload.id]
      );
       
       console.log("existing", existing);

      if (existing && existing.length > 0) {
        console.log(`⚠️ Duplicate order ignored (orderid: ${payload.id})`);
        await mySqlQury("ROLLBACK");
        return new Response(
          JSON.stringify({
            status: "duplicate_ignored",
            orderid: payload.id,
            message: "Order already exists, skipping insert"
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // -------------------------------
      // 1️⃣ Insert into tbl_ecom_orders
      // -------------------------------
      // Get client ID from shop domain
      const clientId = await getClientIdFromShop(shop);
      
      // Enhanced payment mode detection for COD orders
      const isCodOrder = () => {
        // Check payment_gateway_names array first (most reliable)
        if (payload.payment_gateway_names && Array.isArray(payload.payment_gateway_names)) {
          return payload.payment_gateway_names.some(gateway => 
            String(gateway).toLowerCase().includes('cod') || 
            String(gateway).toLowerCase().includes('cash on delivery')
          );
        }
        // Check single gateway field
        if (payload.gateway && String(payload.gateway).toLowerCase().includes('cod')) {
          return true;
        }
        // Check if financial_status is pending and no payment gateway (likely COD)
        if (payload.financial_status === 'pending' && !payload.payment_gateway_names && !payload.gateway) {
          return true;
        }
        return false;
      };
      
      const paymentMode = (payload.financial_status === 'paid')
        ? 'prepaid'
        : isCodOrder() ? 'cod' : 'prepaid';
      
      const collectableAmount = (paymentMode === 'cod') 
        ? parseFloat(payload.total_price) 
        : 0;

      // Get warehouse ID for this client
      const whRows = await mySqlQury(
        'SELECT serial FROM tbl_add_warehouse WHERE client_id = ? LIMIT 1',
        [clientId]
      );
      const whId = whRows?.[0]?.serial ?? null;

      // Calculate total quantity
      const totalQty = (payload.line_items || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

      const orderResult = await mySqlQury(
        `INSERT INTO tbl_ecom_orders 
         (channel, ref_number, orderid, invoice_no, client_id, payment_mode, collectable_amount, warehouse_id, total_weight, weight_unit, grand_total, total_qty, box_qty, total_tax, total_discount, is_unprocessed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "shopify", // channel
          String(payload.order_number) || null, // ref_number (human-readable order number)
          Number(payload.id), // orderid (Shopify internal ID)
          String(payload.order_number) || null, // invoice_no
          Number(clientId), // client_id
          paymentMode, // payment_mode
          collectableAmount, // collectable_amount
          whId, // warehouse_id
          Number(payload.total_weight) || 0, // total_weight
          "gm", // weight_unit
          Number(payload.total_price) || 0, // grand_total
          Number(totalQty), // total_qty
          1, // box_qty
          Number(payload.total_tax) || 0, // total_tax
          Number(payload.total_discounts) || 0, // total_discount
          0 // is_unprocessed
        ]
      );

      const insertedOrderId = orderResult.insertId;
      console.log("✅ Order inserted:", insertedOrderId);
      console.log("✅ orderResult :", orderResult);

      // -------------------------------
      // 2️⃣ Insert into tbl_ecom_consignee_details
      // -------------------------------
      const ship = payload.shipping_address || {};
      const bill = payload.billing_address || {};

      await mySqlQury(
        `INSERT INTO tbl_ecom_consignee_details
        (order_id, first_name, last_name, email, phone, address_line1, address_line2, country, state, city, pincode,
         billing_same_as_shipping, billing_first_name, billing_last_name, billing_email, billing_phone,
         billing_address_line1, billing_address_line2, billing_country, billing_state, billing_city, billing_pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertedOrderId,
          String(ship.first_name) || null,
          String(ship.last_name) || null,
          String(payload.email) || null,
          String(ship.phone) || null,
          String(ship.address1) || null,
          String(ship.address2) || null,
          String(ship.country) || null,
          String(ship.province) || null,
          String(ship.city) || null,
          String(ship.zip) || null,
          1,
          String(bill.first_name || ship.first_name) || null,
          String(bill.last_name || ship.last_name) || null,
          String(bill.email || payload.email) || null,
          String(bill.phone || ship.phone) || null,
          String(bill.address1 || ship.address1) || null,
          String(bill.address2 || ship.address2) || null,
          String(bill.country || ship.country) || null,
          String(bill.province || ship.province) || null,
          String(bill.city || ship.city) || null,
          String(bill.zip || ship.zip) || null
        ]
      );
      console.log("✅ Consignee inserted");

      // -------------------------------
      // 3️⃣ Insert into tbl_ecom_boxes_details
      // -------------------------------
      await mySqlQury(
        `INSERT INTO tbl_ecom_boxes_details 
         (order_id, package_type, length, breadth, height, dimension_unit, weight, weight_unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertedOrderId,
          "box",
          0,
          0,
          0,
          "cm",
          Number(payload.total_weight) || 0,
          "gm"
        ]
      );
      console.log("✅ Box details inserted");

      // -------------------------------
      // 4️⃣ Insert into tbl_ecom_product_details
      // -------------------------------
      if (payload.line_items && payload.line_items.length > 0) {
        for (const item of payload.line_items) {
          await mySqlQury(
            `INSERT INTO tbl_ecom_product_details 
             (order_id, category, name, price, sku, quantity, discount_value, discount_type, tax_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              insertedOrderId,
              null,
              item.title || item.name || null,
              item.price || 0,
              item.sku || null,
              item.quantity || 1,
              item.total_discount || 0,
              "Flat",
              "None"
            ]
          );
        }
        console.log(`✅ ${payload.line_items.length} products inserted`);
      }

      // ✅ All success → commit
      await mySqlQury("COMMIT");
      console.log("✅ Transaction committed successfully");

      return new Response(
        JSON.stringify({ verified: true, shop, topic, order_id: payload.id }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (dbErr) {
      console.error("❌ DB Error:", dbErr);
      await mySqlQury("ROLLBACK");
      console.log("↩️ Transaction rolled back due to error");
      return new Response(
        JSON.stringify({ error: dbErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};


// export const action = async ({ request }) => {
//   try {
//     console.log("📦 Incoming webhook...");

//     // 1️⃣ Read the raw request body EXACTLY as received
//     // `arrayBuffer()` preserves byte-for-byte integrity
//     const rawBody = await request.arrayBuffer();
//     const rawBuffer = Buffer.from(rawBody);

//     // 2️⃣ Fetch headers
//     const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
//     const topic = request.headers.get("x-shopify-topic");
//     const shop = request.headers.get("x-shopify-shop-domain");

//     // 3️⃣ Generate local HMAC (base64 encoding)
//     const localHmac = crypto
//       .createHmac("sha256", SHOPIFY_SECRET)
//       .update(rawBuffer)
//       .digest("base64");

//     // 4️⃣ Timing-safe comparison
//     const valid =
//       hmacHeader &&
//       localHmac.length === hmacHeader.length &&
//       crypto.timingSafeEqual(
//         Buffer.from(localHmac, "base64"),
//         Buffer.from(hmacHeader, "base64")
//       );
//      console.log("hmacHeader", hmacHeader);
//      console.log("localHmac", localHmac);
//      console.log("valid", valid);
//     if (!valid) {
//       console.error("❌ HMAC verification failed");
//       console.error("🔑 Shopify HMAC:", hmacHeader);
//       console.error("🔑 Local HMAC  :", localHmac);
//       return new Response("Unauthorized", { status: 401 });
//     }

//     console.log("✅ HMAC verification passed");
//     console.log("📦 Topic:", topic);
//     console.log("🏬 Shop:", shop);

//     // 5️⃣ Parse the payload only AFTER verification
//     const payload = JSON.parse(new TextDecoder("utf-8").decode(rawBuffer));

//     console.log("payload", payload);

//     if (topic !== "orders/create") {
//       console.log("ℹ️ Non-order topic ignored:", topic);
//       return new Response("Ignored", { status: 204 });
//     }

//     // 👉 Example: processOrder(shop, topic, payload);
//     console.log("🧾 Order ID:", payload?.id);

//     return new Response(
//       JSON.stringify(
//         { verified: true, shop, topic, order_id: payload.id },
//         null,
//         2
//       ),
//       { status: 200, headers: { "Content-Type": "application/json" } }
//     );
//   } catch (err) {
//     console.error("❌ Webhook handler error:", err);
//     return new Response(
//       JSON.stringify({ error: err.message || "Internal Server Error" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// };







// // shopify.app.dispatch-logistics-connector.toml


// import crypto from "crypto";

// const SHOPIFY_SECRET = process.env.SHOPIFY_API_SECRET?.trim() || "";

// export const action = async ({ request }) => {
//   try {
//     console.log("📦 Incoming webhook...");

//     // 1️⃣ Read raw body exactly as received (bytes, not text)
//     const rawArrayBuffer = await request.arrayBuffer();
//     const rawBuffer = Buffer.from(rawArrayBuffer);

//     // 2️⃣ Extract required headers
//     const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || "";
//     const topic = request.headers.get("x-shopify-topic");
//     const shop = request.headers.get("x-shopify-shop-domain");

//     // 3️⃣ Compute local HMAC
//     const localHash = crypto
//       .createHmac("sha256", SHOPIFY_SECRET)
//       .update(rawBuffer)
//       .digest("base64");


//     // 4️⃣ Timing-safe compare
//     const isValid = (() => {
//       try {
//         const a = Buffer.from(localHash, "base64");
//         const b = Buffer.from(hmacHeader, "base64");
//         return a.length === b.length && crypto.timingSafeEqual(a, b);
//       } catch {
//         return false;
//       }
//     })();

//     if (!isValid) {
//       console.error("❌ HMAC verification failed");
//       return new Response("Unauthorized", { status: 401 });
//     }

//     console.log("✅ HMAC verification passed");

//     // 5️⃣ Parse payload AFTER HMAC verification
//     const payload = JSON.parse(Buffer.from(rawBuffer).toString("utf8"));
//     console.log("📦 topic:", topic);
//     console.log("📦 shop:", shop);

//     if (topic !== "orders/create") {
//       console.log("ℹ️ Non-order topic ignored:", topic);
//       return new Response("Ignored", { status: 204 });
//     }

//     // Example: processOrder(shop, topic, payload);
//     console.log("🧾 Order ID:", payload?.id);

//     return new Response(
//       JSON.stringify({ verified: true, shop, topic, order: payload.id }, null, 2),
//       { status: 200, headers: { "Content-Type": "application/json" } }
//     );
//   } catch (err) {
//     console.error("❌ Webhook route error:", err);
//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// };




// import axios from "axios";

// const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
// const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
// const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
// const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP; // e.g. "my-store.myshopify.com"

// // 📦 Function: Send LR number back to Shopify order
// async function updateOrderWithLR(orderId, lineItemId, lrNumber, courierName) {
//   try {
//     const url = `https://${SHOPIFY_SHOP}/admin/api/2024-07/orders/${orderId}/fulfillments.json`;

//     const payload = {
//       fulfillment: {
//         line_items: [
//           {
//             id: lineItemId, // from webhook payload
//             quantity: 1,
//           },
//         ],
//         tracking_company: courierName || "Dispatch Logistics",
//         tracking_number: lrNumber,
//         notify_customer: true,
//       },
//     };

//     const response = await axios.post(url, payload, {
//       headers: {
//         "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log("✅ Fulfillment Created:", response.data);
//     return response.data;
//   } catch (err) {
//     console.error(
//       "❌ Error updating order with LR:",
//       err.response?.data || err.message
//     );
//     throw err;
//   }
// }

// export default updateOrderWithLR;



// export const action = async ({ request }) => {
//   try {
//     console.log("📦 Incoming webhook...");

//     // 🟢 Debug: Print headers
//     const headers = Object.fromEntries(request.headers);
//     console.log("📦 Headers:", headers);
//     const rawBody = await request.text();
//     console.log("📦 rawBody:", rawBody);
//     // ✅ Try with Shopify SDK verification
//     try {
//       const { topic, shop, payload } = await authenticate.webhook(request);

//       console.log("✅ Webhook verified by Shopify SDK");
//       console.log("📦 topic", topic);
//       console.log("📦 shop:", shop);
//       console.log("📦 payload (order)", payload);

//       if (topic !== "ORDERS_CREATE") {
//         return new Response("Ignored", { status: 204 });
//       }

//       return new Response(
//         JSON.stringify({ shop, topic, order: payload }, null, 2),
//         { status: 200, headers: { "Content-Type": "application/json" } },
//       );
//     } catch (err) {
//       console.error("❌ Shopify SDK verification failed:", err.message);

//       // 🟠 Fallback: Manual HMAC verification (debug purpose)

//       const hmacHeader = headers["x-shopify-hmac-sha256"];

//       const generatedHash = crypto
//         .createHmac("sha256", "9a1291ec384ccc54149156de8d2bed56".trim())
//         .update(rawBody, "utf8")
//         .digest("base64");

//       console.log("🔑 Shopify Header HMAC:", hmacHeader);
//       console.log("🔑 Generated Local HMAC:", generatedHash);

//       if (generatedHash == hmacHeader) {
//         console.log("✅ Manual HMAC verification passed");
//         return new Response("HMAC Verified (manual)", { status: 200 });
//       } else {
//         console.error("❌ Manual HMAC verification failed");
//         return new Response("Unauthorized", { status: 401 });
//       }
//     }
//   } catch (err) {
//     console.error("❌ Webhook route error:", err);
//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// };

// ❌ GET request block karna (webhooks always POST)
export const loader = () => new Response("Method Not Allowed", { status: 405 });

// import { authenticate } from "../shopify.server";

// export const action = async ({ request }) => {
//   try {
//     // HMAC verify + context (topic, shop, payload, etc.)
//     const { topic, shop, payload } = await authenticate.webhook(request);

//     // Shopify topic uppercase hota hai
//     if (topic !== "ORDERS_CREATE") {
//       return new Response("Ignored", { status: 204 });
//     }

//     // Order payload received
//     console.log("✅ Order webhook:", shop, payload?.id, payload?.name);

//     // (Optional) Dispatch portal ko forward karo
//     // if (process.env.PORTAL_URL) {
//     //   await fetch(process.env.PORTAL_URL, {
//     //     method: "POST",
//     //     headers: {
//     //       "Content-Type": "application/json",
//     //       ...(process.env.PORTAL_TOKEN
//     //         ? { Authorization: `Bearer ${process.env.PORTAL_TOKEN}` }
//     //         : {}),
//     //     },
//     //     body: JSON.stringify(payload),
//     //   });
//     // }

//     return new Response(null, { status: 200 });
//   } catch (err) {
//     console.error("❌ Webhook error:", err);
//     // HMAC fail ya parse error par 401/400
//     return new Response("Unauthorized", { status: 401 });
//   }
// };

// // GET hits ko block karne ke liye (optional guard)
// export const loader = () => new Response("Method Not Allowed", { status: 405 });

// import crypto from "crypto";

// export const action = async ({ request }) => {
//   const secret = "9a1291ec384ccc54149156de8d2bed56"; // ensure correct key
//   const rawBody = await request.text();
//   console.log("rawBody ", rawBody);
//   // Normalize headers
//   const headers = Object.fromEntries(request.headers);
//   const hmacHeader = headers["x-shopify-hmac-sha256"];

//   // Generate local hash
//   const generatedHash = crypto
//     .createHmac("sha256", secret)
//     .update(rawBody, "utf8")
//     .digest("base64");

//   if (generatedHash !== hmacHeader) {
//     console.error("❌ HMAC mismatch");
//     return new Response("Unauthorized", { status: 401 });
//   }

//   console.log("✅ HMAC verified");
//   const payload = JSON.parse(rawBody);
//   console.log("payload ", payload);

//   // process webhook
//   return new Response("OK", { status: 200 });
// };


// export const action = async ({ request }) => {
//   try {
//     console.log("📦 Incoming webhook...");

//     // 🟢 Debug: Print headers
//     const headers = Object.fromEntries(request.headers);
//     console.log("📦 Headers:", headers);
//     const rawBody = await request.text();
//     // console.log("📦 rawBody:", rawBody);
//     // ✅ Try with Shopify SDK verification
//     try {
//       const { topic, shop, payload } = await authenticate.webhook(request);

//       console.log("✅ Webhook verified by Shopify SDK");
//       console.log("📦 topic", topic);
//       console.log("📦 shop:", shop);
//       console.log("📦 payload (order)", payload);

//       if (topic !== "ORDERS_CREATE") {
//         return new Response("Ignored", { status: 204 });
//       }

//       return new Response(
//         JSON.stringify({ shop, topic, order: payload }, null, 2),
//         { status: 200, headers: { "Content-Type": "application/json" } },
//       );
//     } catch (err) {
//       console.error("❌ Shopify SDK verification failed:", err.message);

//       // 🟠 Fallback: Manual HMAC verification (debug purpose)

//       const hmacHeader = headers["x-shopify-hmac-sha256"];

//       const generatedHash = crypto
//         .createHmac("sha256", "9a1291ec384ccc54149156de8d2bed56")
//         .update(rawBody, "utf8")
//         .digest("base64");

//       console.log("🔑 Shopify Header HMAC:", hmacHeader);
//       console.log("🔑 Generated Local HMAC:", generatedHash);

//       if (generatedHash === hmacHeader) {
//         console.log("✅ Manual HMAC verification passed");
//         return new Response("HMAC Verified (manual)", { status: 200 });
//       } else {
//         console.error("❌ Manual HMAC verification failed");
//         return new Response("Unauthorized", { status: 401 });
//       }
//     }
//   } catch (err) {
//     console.error("❌ Webhook route error:", err);
//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// };
