// import "@shopify/shopify-app-remix/adapters/node";
// import {
//   ApiVersion,
//   AppDistribution,
//   shopifyApp,
//   MemorySessionStorage,
// } from "@shopify/shopify-app-remix/server";

// const shopify = shopifyApp({
//   apiKey: process.env.SHOPIFY_API_KEY || "8f67a84aa9452eba07658a2f6e99628b",
//   apiSecretKey: process.env.SHOPIFY_API_SECRET || "9a1291ec384ccc54149156de8d2bed56",
//   apiVersion: ApiVersion.January25,
//   scopes: process.env.SCOPES?.split(",") || "read_products,read_orders,read_fulfillments,write_fulfillments",
//   appUrl: process.env.SHOPIFY_APP_URL || "",  // yha tunnel ka url dalna hai ..... 
//   authPathPrefix: "/auth",
//   sessionStorage: new MemorySessionStorage(), // ✅ Prisma ki jagah memory storage
//   distribution: AppDistribution.AppStore,
//   future: {
//     unstable_newEmbeddedAuthStrategy: true,
//     removeRest: true,
//   },
//   ...(process.env.SHOP_CUSTOM_DOMAIN
//     ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
//     : {}),
// });

// export default shopify;
// export const authenticate = shopify.authenticate;
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server"; 
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server.js";
import { createWebhooksForShop } from "./services/webhookService.js"; // Using manual webhook creation
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  // Previous secret (kept for reference):
  // apiSecretKey: "9a1291ec384ccc54149156de8d2bed56",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  hooks: {
    afterAuth: async ({ session, admin }) => {
      try {
        console.log(`🔐 afterAuth hook triggered for shop: ${session.shop}`);
        
        console.log(`🔗 Creating webhooks via API for shop: ${session.shop}`);
        
        // Method: Manual webhook creation via API (WORKING APPROACH)
        const webhookResult = await createWebhooksForShop(session.shop, session.accessToken);
        
        if (webhookResult.success) {
          console.log(`✅ Custom webhook config created for shop: ${session.shop}`);
          console.log(`🔑 Webhook secret: ${webhookResult.webhookSecret}`);
          console.log(`📊 Webhook results:`, webhookResult.results);
        } else {
          console.error(`❌ Failed to create custom webhook config for shop: ${session.shop}`, webhookResult.error);
        }
        
        // NOTE: shopify.app.toml webhooks only register on deploy (npm run deploy)
        // So we use manual API approach for development
        // console.log(`✅ Webhooks will be auto-registered from shopify.app.toml`);
      } catch (error) {
        console.error(`❌ Error in afterAuth hook for shop ${session.shop}:`, error);
      }
    },
  },
});
// console.log ("shopify : ", shopify)
export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
