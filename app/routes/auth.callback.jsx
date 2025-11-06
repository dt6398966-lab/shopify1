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



import shopify from "../shopify.server";
import { PrismaClient } from '@prisma/client';
// import { createWebhooksForShop } from "../services/webhookService"; // COMMENTED OUT - Webhooks now created in afterAuth hook

const prisma = new PrismaClient();

export const loader = async ({ request }) => {
  try {
    // Complete Shopify OAuth flow
    const { email, shop, accessToken } = await shopify.auth.callback(request);

    console.log(`🔐 Authentication successful for shop: ${shop}`);

    // Save user data to MySQL database
    await prisma.user.create({
      data: {
        email,
        shop,
        accessToken,
      },
    });

    console.log(`✅ User data saved for shop: ${shop}`);

    // Create webhooks for this shop (COMMENTED OUT - Now handled in afterAuth hook in shopify.server.js)
    // const webhookResult = await createWebhooksForShop(shop, accessToken);
    // 
    // if (webhookResult.success) {
    //   console.log(`✅ Webhooks created successfully for shop: ${shop}`);
    //   console.log(`🔑 Webhook secret: ${webhookResult.webhookSecret}`);
    // } else {
    //   console.error(`❌ Failed to create webhooks for shop: ${shop}`, webhookResult.error);
    // }

    // Redirect to embedded app root
    return shopify.redirectToShopifyOrAppRoot(request);
  } catch (error) {
    console.error("❌ Shopify auth callback failed:", error);
    throw new Response("Authentication failed", { status: 500 });
  }
};

export const action = loader;