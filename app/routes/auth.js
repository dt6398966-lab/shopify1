import { redirect } from "@remix-run/node";
import shopify from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) throw new Error("Missing shop parameter");

  // Start OAuth install (using Shopify SDK)
  return redirect(await shopify.auth.begin({ shop, callbackPath: "/auth/callback" }));
};
