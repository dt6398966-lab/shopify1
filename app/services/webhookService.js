// app/services/webhookService.js - Webhook creation and management service
import crypto from "crypto";
import prisma from "../db.server.js";

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create webhook subscriptions for a shop
 */
export async function createWebhooksForShop(shop, accessToken) {
  try {
    console.log(`🔗 Creating webhooks for shop: ${shop}`);

    // Generate webhook secret
    const webhookSecret = generateWebhookSecret();
    
    // Store webhook config in database
    await prisma.webhookConfig.upsert({
      where: { shop: shop },
      update: { 
        webhookSecret: webhookSecret,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shop: shop,
        webhookSecret: webhookSecret,
        isActive: true
      }
    });

    console.log(`✅ Webhook secret stored for shop: ${shop}`);

    // Define webhook subscriptions (including GDPR compliance webhooks)
    const webhookSubscriptions = [
      {
        topic: "orders/create",
        uri: `${process.env.SHOPIFY_APP_URL}/webhooks/orders/create`,
        format: "json"
      },
      {
        topic: "app/uninstalled", 
        uri: `${process.env.SHOPIFY_APP_URL}/webhooks/app/uninstalled`,
        format: "json"
      },
      // GDPR Compliance Webhooks (MANDATORY for app store)
      {
        topic: "customers/data_request",
        uri: `${process.env.SHOPIFY_APP_URL}/webhooks/customers/data_request`,
        format: "json"
      },
      {
        topic: "customers/redact",
        uri: `${process.env.SHOPIFY_APP_URL}/webhooks/customers/redact`,
        format: "json"
      },
      {
        topic: "shop/redact",
        uri: `${process.env.SHOPIFY_APP_URL}/webhooks/shop/redact`,
        format: "json"
      }
    ];

    // Create webhooks via Shopify API
    const results = [];
    for (const subscription of webhookSubscriptions) {
      try {
        console.log(`🔗 Creating webhook: ${subscription.topic} for shop: ${shop}`);
        
        const response = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webhook: {
              topic: subscription.topic,
              address: subscription.uri,
              format: subscription.format
            }
          })
        });

        if (response.ok) {
          const webhookData = await response.json();
          results.push({
            topic: subscription.topic,
            id: webhookData.webhook?.id,
            status: 'created'
          });
          console.log(`✅ Webhook created: ${subscription.topic}`);
        } else {
          const error = await response.text();
          console.error(`❌ Failed to create webhook ${subscription.topic}:`, error);
          results.push({
            topic: subscription.topic,
            status: 'failed',
            error: error
          });
        }
      } catch (error) {
        console.error(`❌ Error creating webhook ${subscription.topic}:`, error);
        results.push({
          topic: subscription.topic,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      success: true,
      webhookSecret: webhookSecret,
      results: results
    };

  } catch (error) {
    console.error(`❌ Error creating webhooks for shop ${shop}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get webhook secret for a shop
 */
export async function getWebhookSecret(shop) {
  try {
    const config = await prisma.webhookConfig.findUnique({
      where: { shop: shop }
    });
    
    return config?.webhookSecret || null;
  } catch (error) {
    console.error(`❌ Error getting webhook secret for shop ${shop}:`, error);
    return null;
  }
}

/**
 * Delete webhooks for a shop
 */
export async function deleteWebhooksForShop(shop, accessToken) {
  try {
    console.log(`🗑️ Deleting webhooks for shop: ${shop}`);

    // Get existing webhooks
    const response = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    const data = await response.json();
    const webhooks = data.webhooks || [];

    // Delete each webhook
    const results = [];
    for (const webhook of webhooks) {
      try {
        const deleteResponse = await fetch(`https://${shop}/admin/api/2025-01/webhooks/${webhook.id}.json`, {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': accessToken,
          }
        });

        if (deleteResponse.ok) {
          results.push({ id: webhook.id, status: 'deleted' });
          console.log(`✅ Webhook deleted: ${webhook.id}`);
        } else {
          results.push({ id: webhook.id, status: 'failed' });
          console.error(`❌ Failed to delete webhook: ${webhook.id}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting webhook ${webhook.id}:`, error);
        results.push({ id: webhook.id, status: 'error', error: error.message });
      }
    }

    // Mark webhook config as inactive
    await prisma.webhookConfig.update({
      where: { shop: shop },
      data: { isActive: false }
    });

    return {
      success: true,
      results: results
    };

  } catch (error) {
    console.error(`❌ Error deleting webhooks for shop ${shop}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}
