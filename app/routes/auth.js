import { redirect } from "@remix-run/node";
import shopify from "../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  // If no shop parameter, redirect to login page
  if (!shop) {
    return redirect("/auth/login");
  }

  // Start OAuth install (using Shopify SDK)
  return redirect(await shopify.auth.begin({ shop, callbackPath: "/auth/callback" }));
};
