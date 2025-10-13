// // --- Shopify Remix ESM Config (fixed) ---

// // Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// // Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server.
// // The CLI will eventually stop passing in HOST, so we can remove this workaround after the next major release.
// if (
//   process.env.HOST &&
//   (!process.env.SHOPIFY_APP_URL ||
//     process.env.SHOPIFY_APP_URL === process.env.HOST)
// ) {
//   process.env.SHOPIFY_APP_URL = process.env.HOST;
//   delete process.env.HOST;
// }

// /** @type {import('@remix-run/dev').AppConfig} */
// export default {
//   ignoredRouteFiles: ["**/.*"],           // hidden files ignore
//   appDirectory: "app",                    // Remix app folder
//   serverModuleFormat: "esm",              // ✅ use ESM instead of CJS
//   dev: { port: process.env.HMR_SERVER_PORT || 3000 },
//   serverDependenciesToBundle: [
//     /^@shopify\/shopify-app-remix.*/,     // bundle all Shopify Remix modules
//     "@shopify/polaris",                   // Polaris UI
//   ],
//   future: {
//     v3_fetcherPersist: true,
//     v3_lazyRouteDiscovery: true,
//     v3_relativeSplatPath: true,
//     v3_singleFetch: true,
//     v3_throwAbortReason: true,
//   },
// };

































// // Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// // Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server. The CLI will eventually
// // stop passing in HOST, so we can remove this workaround after the next major release.
// if (
//   process.env.HOST &&
//   (!process.env.SHOPIFY_APP_URL ||
//     process.env.SHOPIFY_APP_URL === process.env.HOST)
// ) {
//   process.env.SHOPIFY_APP_URL = process.env.HOST;
//   delete process.env.HOST;
// }

// // /** @type {import('@remix-run/dev').AppConfig} */
// // module.exports = {
// //   ignoredRouteFiles: ["**/.*"],
// //   appDirectory: "app",
// //   serverModuleFormat: "cjs",
// //   dev: { port: process.env.HMR_SERVER_PORT || 8002 },
// //   future: {},
// // };

// /** @type {import('@remix-run/dev').AppConfig} */
// module.exports = {
//   ignoredRouteFiles: ["**/.*"],    // hidden files ignore
//   appDirectory: "app",             // Remix app ka folder
//   serverModuleFormat: "ejs",       // CommonJS (CJS) mode
//   dev: { port: process.env.HMR_SERVER_PORT || 3000 }, // ✅ ab hamesha port 3000
//   serverDependenciesToBundle: [
//     /^@shopify\/shopify-app-remix.*/, // Shopify Remix code bundle karega
//     "@shopify/polaris",               // Polaris UI bundle karega
//   ],
//   future: {
//     v3_fetcherPersist: true,
//     v3_lazyRouteDiscovery: true,
//     v3_relativeSplatPath: true,
//     v3_singleFetch: true,
//     v3_throwAbortReason: true,
//   },
// };

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  serverDependenciesToBundle: [
    /^@shopify/,
  ],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
  // 👇 Add this extra loader so JSON is auto-handled as ESM
  serverBuildTarget: "node-cjs",
  serverBuildFile: "index.js",
  serverMinify: false,
  watchPaths: ["./locales", "./public"],
};
