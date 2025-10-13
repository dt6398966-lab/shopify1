// YE CODE O AUTH  KRTA HAI BUT DISPATCH PR DATA NI BHEJTA HAI  

// import shopify from "../shopify.server";

// export const loader = async ({ request }) => {
//   try {
//     // Complete Shopify OAuth flow
//     await shopify.auth.callback(request);

//     // Redirect to embedded app root
//     return shopify.redirectToShopifyOrAppRoot(request);
//   } catch (error) {
//     console.error("❌ Shopify auth callback failed:", error);
//     throw new Response("Authentication failed", { status: 500 });
//   }
// };

// export const action = loader;



// import shopify from "~/shopify/shopify.server";
import shopify from "../shopify.server";
import axios from "axios";
import { mySqlQury } from "../dbMysl";

export const loader = async ({ request }) => {
  try {
    // 1️⃣ Shopify OAuth complete
    const { session } = await shopify.auth.callback({ rawRequest: request });
    const shopDomain = session.shop;
    const accessToken = session.accessToken;
    const scope = session.scope;
    // const clientId = 0;

    // 2️⃣ Create webhook via GraphQL
    const graphqlMutation = `
      mutation {
        webhookSubscriptionCreate(
          topic: ORDERS_CREATE,
          webhookSubscription: {
            callbackUrl: "https://portal.dispatch.co.in/webhooks/shopify/orders",
            format: JSON
          }
        ) {
          webhookSubscription {
            id
            secret
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await axios.post(
      `https://${shopDomain}/admin/api/2024-10/graphql.json`,
      { query: graphqlMutation },
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const webhookData = response.data.data.webhookSubscriptionCreate;
    if (webhookData.userErrors?.length > 0) {
      throw new Error(JSON.stringify(webhookData.userErrors));
    }

    const webhookSecret = webhookData?.webhookSubscription?.secret || null;

    // 3️⃣ Save merchant info
    const [existing] = await mySqlQury(
      "SELECT id FROM tbl_shopify_integration WHERE shopyfy_url = ?",
      [shopDomain]
    );

    if (existing.length > 0) {
      await mySqlQury(
        `UPDATE tbl_shopify_integration 
         SET accessToken=?, scope=?, webhook_secret=? 
         WHERE shopyfy_url=?`,
        [accessToken, scope,  webhookSecret, shopDomain]
      );
    } else {
      await mySqlQury(
        `INSERT INTO tbl_shopify_integration 
         ( shopyfy_url, accessToken, scope, webhook_secret)
         VALUES (?, ?, ?, ?)`,
        [ shopDomain, accessToken, scope, webhookSecret]
      );
    }

    console.log("✅ App installed & webhook created:", shopDomain);
    return new Response("✅ Installation complete. You can close this window.");
  } catch (err) {
    console.error("❌ OAuth/Webhook error:", err.message);
    return new Response("Authentication or webhook creation failed", { status: 500 });
  }
};


// export const loader = async ({ request }) => {
//   let connection;
//   try {
//     // 1️⃣ Complete Shopify OAuth flow
//     const { session } = await shopify.auth.callback({ rawRequest: request });
//     console.log("✅ Shopify session created for:", session.shop);

  

//     // 3️⃣ Prepare data
//     const shopDomain = session.shop;
//     const accessToken = session.accessToken;
//     const scope = session.scope;
//     const clientId = 0; // default clientId; you can update dynamically if linking to a specific client

//     // 4️⃣ Check if this shop already exists
//     const [existing] = await mySqlQury(
//       "SELECT id FROM tbl_shopify_integration WHERE shopyfy_url = ?",
//       [shopDomain]
//     );

//     if (existing.length > 0) {
//       // 5️⃣ Update existing record
//       await mySqlQury(
//         `UPDATE tbl_shopify_integration 
//          SET accessToken = ?, scope = ?, clientId = ? 
//          WHERE shopyfy_url = ?`,
//         [accessToken, scope, clientId, shopDomain]
//       );
//       console.log("🔁 Existing Shopify merchant updated:", shopDomain);
//     } else {
//       // 6️⃣ Insert new record
//       await mySqlQury(
//         `INSERT INTO tbl_shopify_integration (clientId, shopyfy_url, accessToken, scope)
//          VALUES (?, ?, ?, ?)`,
//         [clientId, shopDomain, accessToken, scope]
//       );
//       console.log("✅ New Shopify merchant saved:", shopDomain);
//     }

//     // 7️⃣ Create Orders Webhook for this merchant
//     await shopify.webhooks.register({
//       session,
//       topic: "ORDERS_CREATE",
//       deliveryMethod: "HTTP",
//       address: "https://portal.dispatch.co.in/webhooks/shopify/orders",
//     });

//     // 8️⃣ Done
//     return new Response("✅ Shopify App installed successfully. You can close this window.");
//   } catch (error) {
//     console.error("❌ Shopify auth callback failed:", error);
//     return new Response("Authentication failed", { status: 500 });
//   } finally {
//     if (connection) connection.release();
//   }
// };

// export const action = loader;


// export const loader___ = async ({ request }) => {
//   const { session } = await shopify.auth.callback({ rawRequest: request });

//   // 1️⃣ Create Orders Webhook for this merchant
//   await shopify.webhooks.register({
//     session,
//     topic: "ORDERS_CREATE",
//     deliveryMethod: "HTTP",
//     address: "https://portal.dispatch.co.in/webhooks/shopify/orders",
//   });

//   // 2️⃣ Send merchant info to Dispatch portal backend
//   await axios.post("https://portal.dispatch.co.in/api/shopify/register", {
//     shop_domain: session.shop,
//     access_token: session.accessToken,
//     scope: session.scope,
//   });

//   return new Response("✅ Shopify App installed successfully. You can close this window.");
// };

// export const action = loader;

