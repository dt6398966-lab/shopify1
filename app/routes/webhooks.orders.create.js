// app/routes/webhooks.orders.create.js
import crypto from "crypto";
import { mySqlQury } from "../dbMysl";
import prisma from "../db.server";
import { authenticate, sessionStorage, apiVersion } from "../shopify.server";

/**
 * Fetch complete order data from Shopify Admin API using GraphQL
 */
async function fetchCompleteOrderData(shop, orderId, accessToken) {
  try {
    const graphqlQuery = `
      query getOrder($id: ID!) {
        order(id: $id) {
          id
          name
          email
          # Note: customer field removed - requires read_customers scope
          # Customer data is available in webhook payload, so we use that instead
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
          billingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
          shippingLines(first: 10) {
            edges {
              node {
                code
                title
                originalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                discountedPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                variant {
                  id
                  sku
                  title
                  weight
                  weightUnit
                  selectedOptions {
                    name
                    value
                  }
                  metafields(first: 10) {
                    edges {
                      node {
                        namespace
                        key
                        value
                        type
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: {
          id: `gid://shopify/Order/${orderId}`
        }
      })
    });

    if (!response.ok) {
      console.error(`❌ GraphQL API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("❌ GraphQL errors:", result.errors);
      return null;
    }

    const orderData = result.data?.order;
    if (!orderData) {
      console.error("❌ No order data in GraphQL response");
      return null;
    }

    // Transform GraphQL response to REST API format
    return {
      shipping_address: orderData.shippingAddress ? {
        first_name: orderData.shippingAddress.firstName || null,
        last_name: orderData.shippingAddress.lastName || null,
        address1: orderData.shippingAddress.address1 || null,
        address2: orderData.shippingAddress.address2 || null,
        city: orderData.shippingAddress.city || null,
        province: orderData.shippingAddress.province || null,
        zip: orderData.shippingAddress.zip || null,
        country: orderData.shippingAddress.country || null,
        phone: orderData.shippingAddress.phone || null,
      } : null,
      billing_address: orderData.billingAddress ? {
        first_name: orderData.billingAddress.firstName || null,
        last_name: orderData.billingAddress.lastName || null,
        address1: orderData.billingAddress.address1 || null,
        address2: orderData.billingAddress.address2 || null,
        city: orderData.billingAddress.city || null,
        province: orderData.billingAddress.province || null,
        zip: orderData.billingAddress.zip || null,
        country: orderData.billingAddress.country || null,
        phone: orderData.billingAddress.phone || null,
        email: orderData.billingAddress.email || null,
      } : null,
      // Customer data not available in GraphQL (requires read_customers scope)
      // Will use customer data from webhook payload instead
      customer: null,
      shipping_lines: orderData.shippingLines?.edges?.map(edge => {
        const node = edge.node;
        const originalAmount = node.originalPriceSet?.shopMoney?.amount || "0.00";
        const discountedAmount = node.discountedPriceSet?.shopMoney?.amount || originalAmount;
        const currencyCode = node.originalPriceSet?.shopMoney?.currencyCode || "USD";
        
        return {
          code: node.code || null,
          title: node.title || null,
          price: originalAmount,
          price_set: {
            shop_money: {
              amount: originalAmount,
              currency_code: currencyCode
            },
            presentment_money: {
              amount: originalAmount,
              currency_code: currencyCode
            }
          },
          discounted_price: discountedAmount,
          discounted_price_set: {
            shop_money: {
              amount: discountedAmount,
              currency_code: currencyCode
            },
            presentment_money: {
              amount: discountedAmount,
              currency_code: currencyCode
            }
          }
        };
      }) || [],
      email: orderData.email || null,
      line_items_with_dimensions: orderData.lineItems?.edges?.map(edge => {
        const node = edge.node;
        const variant = node.variant;
        
        // Extract dimensions from metafields
        let length = null;
        let width = null;
        let height = null;
        
        if (variant?.metafields?.edges) {
          console.log(`   🔍 Checking metafields for variant ${variant.id}:`);
          variant.metafields.edges.forEach(metafieldEdge => {
            const metafield = metafieldEdge.node;
            const namespace = metafield.namespace;
            const key = metafield.key;
            const value = metafield.value;
            const type = metafield.type;
            
            console.log(`      Metafield: ${namespace}.${key} (type: ${type}) = ${value}`);
            
            // Check for dimensions in metafields
            // Common patterns: shipping.length, shipping.width, shipping.height
            // or custom namespaces like uship.length, etc.
            // Also check any namespace that might contain dimensions
            if (namespace === 'shipping' || namespace === 'uship' || namespace === 'custom' || 
                key?.toLowerCase().includes('length') || key?.toLowerCase().includes('width') || 
                key?.toLowerCase().includes('height') || key?.toLowerCase().includes('dimension')) {
              try {
                // Metafield value might be JSON or plain number
                let dimensionValue = null;
                if (type === 'dimension' || type === 'dimension_reference') {
                  // Dimension type is stored as JSON: {"value": 19, "unit": "cm"}
                  const parsed = JSON.parse(value);
                  dimensionValue = Number(parsed.value || parsed);
                  console.log(`      ✅ Parsed dimension: ${dimensionValue} (from ${type})`);
                } else {
                  // Plain number or string number
                  dimensionValue = Number(value);
                  if (!isNaN(dimensionValue)) {
                    console.log(`      ✅ Parsed dimension: ${dimensionValue} (from number)`);
                  }
                }
                
                const keyLower = key?.toLowerCase() || '';
                if (keyLower.includes('length') || key === 'length' || key === 'Length') {
                  length = dimensionValue;
                } else if (keyLower.includes('width') || key === 'width' || key === 'Width') {
                  width = dimensionValue;
                } else if (keyLower.includes('height') || key === 'height' || key === 'Height') {
                  height = dimensionValue;
                }
              } catch (e) {
                // If parsing fails, try direct number conversion
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                  const keyLower = key?.toLowerCase() || '';
                  if (keyLower.includes('length') || key === 'length' || key === 'Length') {
                    length = numValue;
                    console.log(`      ✅ Set length: ${length}`);
                  } else if (keyLower.includes('width') || key === 'width' || key === 'Width') {
                    width = numValue;
                    console.log(`      ✅ Set width: ${width}`);
                  } else if (keyLower.includes('height') || key === 'height' || key === 'Height') {
                    height = numValue;
                    console.log(`      ✅ Set height: ${height}`);
                  }
                } else {
                  console.log(`      ⚠️ Could not parse dimension value: ${value}`);
                }
              }
            }
          });
          
          if (length || width || height) {
            console.log(`   ✅ Found dimensions from metafields: L=${length}cm, W=${width}cm, H=${height}cm`);
          } else {
            console.log(`   ⚠️ No dimensions found in metafields`);
          }
        }
        
        // Convert weight to grams
        let weight_grams = 0;
        if (variant?.weight) {
          const weight = Number(variant.weight);
          const weightUnit = variant.weightUnit?.toLowerCase() || 'g';
          if (weightUnit === 'kg' || weightUnit === 'kilograms') {
            weight_grams = weight * 1000;
          } else if (weightUnit === 'g' || weightUnit === 'grams') {
            weight_grams = weight;
          } else if (weightUnit === 'lb' || weightUnit === 'pounds') {
            weight_grams = weight * 453.592;
          } else if (weightUnit === 'oz' || weightUnit === 'ounces') {
            weight_grams = weight * 28.3495;
          }
        }
        
        return {
          id: node.id,
          title: node.title,
          quantity: node.quantity,
          variant_id: variant?.id?.split('/').pop() || null,
          weight_grams: weight_grams,
          weight_unit: variant?.weightUnit?.toLowerCase() || 'g',
          length: length,
          width: width,
          height: height,
        };
      }) || [],
    };
  } catch (error) {
    console.error("❌ Error fetching complete order data:", error);
    return null;
  }
}

/**
 * Fetch product variant dimensions from Shopify Admin API using REST API
 * This is a fallback method to get dimensions that might be stored in the variant's physical properties
 */
async function fetchProductVariantDimensionsREST(shop, variantIds, accessToken) {
  try {
    if (!variantIds || variantIds.length === 0) {
      return {};
    }

    const dimensionMap = {};
    
    // Fetch each variant using REST API (more reliable for physical dimensions)
    for (const variantId of variantIds) {
      try {
        const response = await fetch(
          `https://${shop}/admin/api/2025-01/variants/${variantId}.json`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
            }
          }
        );

        if (response.ok) {
          const result = await response.json();
          const variant = result.variant;
          
          if (variant) {
            dimensionMap[variantId] = {
              weight: variant.weight || 0,
              weight_unit: variant.weight_unit || 'g',
              // REST API might have dimensions in different fields
              // Check if dimensions are in the variant object
              length: variant.length || null,
              width: variant.width || null,
              height: variant.height || null,
            };
          }
        }
      } catch (err) {
        console.error(`❌ Error fetching variant ${variantId}:`, err.message);
      }
    }

    return dimensionMap;
  } catch (error) {
    console.error("❌ Error fetching variant dimensions via REST:", error);
    return {};
  }
}

/**
 * Calculate box dimensions based on products
 * First tries to use REAL dimensions from Shopify products if available
 * Falls back to ESTIMATION based on weight and quantity if real dimensions not available
 */
function calculateBoxDimensions(lineItems, totalWeightGrams) {
  // Default dimensions (in cm) if no products or calculation fails
  const DEFAULT_DIMENSIONS = {
    length: 20,
    breadth: 15,
    height: 10,
    is_estimated: true, // Flag to indicate if dimensions are estimated
  };

  if (!lineItems || lineItems.length === 0) {
    return DEFAULT_DIMENSIONS;
  }

  try {
    // Calculate total quantity
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    if (totalQuantity === 0) {
      return DEFAULT_DIMENSIONS;
    }

    // 🎯 STEP 1: Check if REAL dimensions are available from Shopify product variants
    console.log(`   🔍 Checking for real dimensions in line items...`);
    console.log(`   📋 Line items count: ${lineItems.length}`);
    
    // Debug: Log all line items to see what dimensions are available
    lineItems.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.title || item.name || 'Unknown'}`);
      console.log(`      Length: ${item.length || 'null'}, Width: ${item.width || 'null'}, Height: ${item.height || 'null'}`);
    });
    
    const itemsWithRealDimensions = lineItems.filter(item => {
      const hasDimensions = item.length && item.width && item.height;
      if (!hasDimensions) {
        console.log(`   ❌ Item "${item.title || item.name}" missing dimensions - will use estimation`);
      }
      return hasDimensions;
    });

    if (itemsWithRealDimensions.length > 0) {
      console.log(`   ✅ Found ${itemsWithRealDimensions.length} items with REAL dimensions from Shopify`);
      
      // Calculate box dimensions based on actual product dimensions
      // For multiple items, we'll stack them efficiently
      let maxLength = 0;
      let maxWidth = 0;
      let totalHeight = 0;

      itemsWithRealDimensions.forEach(item => {
        const itemLength = Number(item.length) || 0;
        const itemWidth = Number(item.width) || 0;
        const itemHeight = Number(item.height) || 0;
        const itemQty = Number(item.quantity) || 1;

        // Find the largest length and width (items will be stacked)
        maxLength = Math.max(maxLength, itemLength);
        maxWidth = Math.max(maxWidth, itemWidth);
        // Add height for each item (stacked)
        totalHeight += itemHeight * itemQty;
      });

      // Add padding/buffer for packaging (10% extra height, 5% extra for length/width)
      const length = Math.ceil(maxLength * 1.05);
      const breadth = Math.ceil(maxWidth * 1.05);
      const height = Math.ceil(totalHeight * 1.10);

      console.log(`   📐 Real dimensions calculated: ${length}cm × ${breadth}cm × ${height}cm`);

      return {
        length: Math.max(10, Math.min(200, length)),
        breadth: Math.max(10, Math.min(150, breadth)),
        height: Math.max(5, Math.min(100, height)),
        is_estimated: false, // Real dimensions from Shopify
        source: 'shopify_product_variant',
      };
    }

    // 🎯 STEP 2: If no real dimensions, use ESTIMATION based on weight
    console.log(`   ⚠️ No real dimensions found, using ESTIMATION based on weight`);
    
    // Calculate total weight from line items if available, otherwise use totalWeightGrams
    let calculatedTotalWeight = 0;
    if (lineItems.some(item => item.weight_grams || item.grams)) {
      // Use individual item weights if available
      calculatedTotalWeight = lineItems.reduce((sum, item) => {
        const itemWeight = item.weight_grams || item.grams || 0;
        const itemQty = item.quantity || 1;
        return sum + (itemWeight * itemQty);
      }, 0);
    } else {
      // Fallback to total weight from order
      calculatedTotalWeight = totalWeightGrams;
    }
    
    // Estimate dimensions based on weight and quantity
    // Formula uses density approximation: Different products have different densities
    // For clothing/textiles: ~0.1-0.3 g/cm³
    // For general products: ~0.5-1.0 g/cm³
    // We'll use a conservative estimate: Volume ≈ Weight / 0.6 (assuming 0.6 g/cm³ average density)
    
    // Density factor: grams per cm³ (lower = larger volume needed)
    // 0.6 means 0.6 grams per cm³, so 100g = ~167cm³
    const densityFactor = 0.6;
    const baseVolume = calculatedTotalWeight / densityFactor; // Volume in cm³
    
    // Quantity factor: More items need slightly more space due to packing inefficiency
    // For 1 item: factor = 1.0
    // For 2-5 items: factor = 1.1-1.3 (10-30% extra space)
    // For 6+ items: factor = 1.4-1.8 (40-80% extra space for packing)
    let quantityFactor = 1.0;
    if (totalQuantity > 10) {
      quantityFactor = 1.6 + (totalQuantity - 10) * 0.02; // Cap at ~2.2 for very large quantities
      quantityFactor = Math.min(2.5, quantityFactor);
    } else if (totalQuantity > 5) {
      quantityFactor = 1.4;
    } else if (totalQuantity > 2) {
      quantityFactor = 1.2;
    } else if (totalQuantity > 1) {
      quantityFactor = 1.1;
    }
    
    const totalVolume = baseVolume * quantityFactor;
    
    // Calculate dimensions using cube root (for cubic approximation)
    const cubeRoot = Math.cbrt(totalVolume);
    
    // Calculate dimensions with a rectangular box ratio
    // Standard shipping box ratios: Length > Breadth > Height
    // Common ratio: ~1.4:1.0:0.7 (for standard boxes)
    // More practical: ~1.6:1.2:0.8 (better for stacking)
    const length = Math.max(15, Math.min(120, Math.ceil(cubeRoot * 1.6)));
    const breadth = Math.max(12, Math.min(80, Math.ceil(cubeRoot * 1.2)));
    const height = Math.max(8, Math.min(60, Math.ceil(cubeRoot * 0.8)));
    
    console.log(`   📊 Estimated dimension calculation:`);
    console.log(`      Weight: ${calculatedTotalWeight}gm, Quantity: ${totalQuantity}`);
    console.log(`      Base Volume: ${Math.round(baseVolume)}cm³, With packing factor: ${Math.round(totalVolume)}cm³`);
    console.log(`      Estimated: ${length}cm × ${breadth}cm × ${height}cm`);
    
    return {
      length: length,
      breadth: breadth,
      height: height,
      is_estimated: true, // Estimated dimensions
      source: 'weight_based_calculation',
    };
  } catch (error) {
    console.error("❌ Error calculating box dimensions:", error);
    return DEFAULT_DIMENSIONS;
  }
}

export const action = async ({ request }) => {
  try {
    console.log("📦 Incoming webhook...");

    // ✅ Use Shopify SDK for proper HMAC verification (required for app store)
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log("✅ HMAC verified:", topic, shop);

    // Handle only orders/create
    if (topic !== "ORDERS_CREATE") {
      console.log("ℹ️ Non-orders topic ignored:", topic);
      return new Response("Ignored", { status: 204 });
    }

    console.log("🧾 Order received:", payload.id);
    console.log("🏬 Shop:", shop, "- This order belongs to client:", shop);

    // 🔍 Fetch complete order data if webhook payload is missing fields
    let completeOrderData = null;
    let finalPayload = payload;
    
    // Check if critical fields are missing (null, undefined, or empty array)
    const hasShippingAddress = payload.shipping_address && Object.keys(payload.shipping_address).length > 0;
    const hasBillingAddress = payload.billing_address && Object.keys(payload.billing_address).length > 0;
    const hasShippingLines = payload.shipping_lines && Array.isArray(payload.shipping_lines) && payload.shipping_lines.length > 0;
    const hasCustomer = payload.customer && Object.keys(payload.customer).length > 0;
    
    if (!hasShippingAddress || !hasBillingAddress || !hasShippingLines || !hasCustomer) {
      console.log("⚠️ Missing fields detected in webhook payload:");
      console.log(`  - Shipping Address: ${hasShippingAddress ? '✅' : '❌'}`);
      console.log(`  - Billing Address: ${hasBillingAddress ? '✅' : '❌'}`);
      console.log(`  - Shipping Lines: ${hasShippingLines ? '✅' : '❌'}`);
      console.log(`  - Customer: ${hasCustomer ? '✅' : '❌'}`);
      console.log("🔍 Fetching complete order data from Admin API...");
      
      try {
        // Get session for this shop to access Admin API
        const sessions = await sessionStorage.findSessionsByShop(shop);
        const session = sessions?.[0]; // Get the first session (usually there's only one per shop)
        
        if (session && session.accessToken) {
          console.log("✅ Found session for shop. Fetching complete order data...");
          completeOrderData = await fetchCompleteOrderData(shop, payload.id, session.accessToken);
          
          if (completeOrderData) {
            // Extract variant IDs from line items for REST API fallback
            const variantIds = payload.line_items
              ?.map(item => item.variant_id)
              .filter(id => id) || [];
            
            // Try REST API as fallback if dimensions not found in GraphQL
            let restDimensions = {};
            if (variantIds.length > 0) {
              console.log("🔍 Trying REST API to fetch variant dimensions...");
              restDimensions = await fetchProductVariantDimensionsREST(shop, variantIds, session.accessToken);
            }
            
            // Merge line items with weight and dimension information
            const enrichedLineItems = payload.line_items?.map(item => {
              // Find matching item from GraphQL response
              const enrichedItem = completeOrderData.line_items_with_dimensions?.find(
                li => String(li.id) === String(item.id)
              );
              
              // Check REST API fallback for dimensions
              const variantId = item.variant_id;
              const restDim = restDimensions[variantId] || {};
              
              // Use GraphQL dimensions first, fallback to REST API, then webhook payload
              const finalLength = enrichedItem?.length || restDim.length || null;
              const finalWidth = enrichedItem?.width || restDim.width || null;
              const finalHeight = enrichedItem?.height || restDim.height || null;
              
              const enrichedData = {
                ...item,
                weight_grams: enrichedItem?.weight_grams || item.grams || 0,
                weight_unit: enrichedItem?.weight_unit || 'g',
                // Real dimensions from Shopify (GraphQL first, then REST API fallback)
                length: finalLength,
                width: finalWidth,
                height: finalHeight,
              };
              
              // Debug logging for dimensions
              if (enrichedItem || restDim.length) {
                console.log(`   📦 Product: ${item.title || item.name}`);
                console.log(`      Variant dimensions:`, {
                  length: finalLength,
                  width: finalWidth,
                  height: finalHeight,
                  source: enrichedItem?.length ? 'GraphQL' : (restDim.length ? 'REST API' : 'none'),
                  has_dimensions: !!(finalLength && finalWidth && finalHeight)
                });
              } else {
                console.log(`   ⚠️ Product: ${item.title || item.name} - No dimensions found (GraphQL or REST)`);
              }
              
              return enrichedData;
            }) || payload.line_items || [];

            // Merge the complete data with webhook payload (complete data takes priority)
            finalPayload = {
              ...payload,
              shipping_address: completeOrderData.shipping_address || payload.shipping_address,
              billing_address: completeOrderData.billing_address || payload.billing_address,
              shipping_lines: completeOrderData.shipping_lines.length > 0 ? completeOrderData.shipping_lines : payload.shipping_lines,
              customer: completeOrderData.customer || payload.customer,
              email: completeOrderData.email || payload.email,
              line_items: enrichedLineItems, // Include weight information in line items
            };
            console.log("✅ Complete order data fetched and merged");
            console.log("📍 Shipping Address:", finalPayload.shipping_address ? "✅ Present" : "❌ Missing");
            console.log("📍 Billing Address:", finalPayload.billing_address ? "✅ Present" : "❌ Missing");
            console.log("📦 Shipping Lines:", finalPayload.shipping_lines?.length || 0);
            console.log("👤 Customer:", finalPayload.customer ? "✅ Present" : "❌ Missing");
            console.log("⚖️ Product weights:", finalPayload.line_items?.some(item => item.weight_grams) ? "✅ Present" : "⚠️ Check line items");
            
            // Check if real dimensions are present
            const itemsWithRealDims = finalPayload.line_items?.filter(item => item.length && item.width && item.height) || [];
            console.log(`📐 Products with real dimensions: ${itemsWithRealDims.length} out of ${finalPayload.line_items?.length || 0}`);
            if (itemsWithRealDims.length === 0) {
              console.log("⚠️ WARNING: No products have real dimensions set in Shopify!");
              console.log("   → Box dimensions will be ESTIMATED based on weight");
              console.log("   → To use real dimensions: Set Length, Width, Height in Shopify product variants");
            } else {
              console.log("✅ Real dimensions found - will use them for box calculation");
              itemsWithRealDims.forEach(item => {
                console.log(`   ✅ ${item.title || item.name}: ${item.length}cm × ${item.width}cm × ${item.height}cm`);
              });
            }
          } else {
            console.log("⚠️ Could not fetch complete order data. Using webhook payload as-is.");
          }
        } else {
          console.log("⚠️ No session found for shop. Cannot fetch complete order data.");
        }
      } catch (fetchError) {
        console.error("❌ Error fetching complete order data:", fetchError);
        console.log("⚠️ Continuing with webhook payload only.");
      }
    } else {
      console.log("✅ All required fields present in webhook payload");
      
      // Still enrich line items with weight if available in payload
      // Note: Webhook payload usually doesn't have product dimensions, only weight
      if (payload.line_items && payload.line_items.length > 0) {
        finalPayload = {
          ...payload,
          line_items: payload.line_items.map(item => ({
            ...item,
            weight_grams: item.grams || 0,
            weight_unit: 'g',
            // Note: Real dimensions not available in webhook payload, will be estimated
            length: null,
            width: null,
            height: null,
          }))
        };
        console.log("⚖️ Product weights from webhook payload");
        console.log("⚠️ Note: Real product dimensions not in webhook - will use estimation");
      }
    }

    // Calculate box dimensions early for storage in OrderEvent
    const totalWeightGramsForEvent = Number(finalPayload.total_weight) || 0;
    const boxDimensionsForEvent = calculateBoxDimensions(finalPayload.line_items, totalWeightGramsForEvent);
    
    // Enrich finalPayload with box dimensions for storage
    const enrichedPayloadForStorage = {
      ...finalPayload,
      box_dimensions: {
        length: boxDimensionsForEvent.length,
        breadth: boxDimensionsForEvent.breadth,
        height: boxDimensionsForEvent.height,
        dimension_unit: "cm",
        weight: totalWeightGramsForEvent,
        weight_unit: "gm",
        calculated_at: new Date().toISOString()
      }
    };

    // 📝 Store webhook event in OrderEvent table (Prisma)
    try {
      await prisma.orderEvent.create({
        data: {
          shop: shop || "unknown",
          topic: topic || "orders/create",
          orderId: BigInt(finalPayload.id),
          payload: enrichedPayloadForStorage, // Store the complete payload with box dimensions
        },
      });
      console.log("✅ OrderEvent stored in Prisma database with box dimensions");
    } catch (prismaError) {
      console.error("❌ Error storing OrderEvent:", prismaError);
      // Continue with MySQL operations even if Prisma fails
    }

    // 👤 Store/Update user data in User table (Prisma)
    try {
      const customerEmail = finalPayload.customer?.email || finalPayload.email;
      if (customerEmail && shop) {
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: {
            shop: shop,
            email: customerEmail,
          },
        });

        if (!existingUser) {
          // Create new user if doesn't exist
          await prisma.user.create({
            data: {
              email: customerEmail,
              shop: shop,
              accessToken: "webhook_user", // Placeholder since we don't have access token in webhook
            },
          });
          console.log("✅ New user created in Prisma database");
        } else {
          console.log("ℹ️ User already exists in Prisma database");
        }
      }
    } catch (userError) {
      console.error("❌ Error storing User:", userError);
      // Continue with other operations even if user creation fails
    }

    // 🚀 Begin transaction
    await mySqlQury("START TRANSACTION");

    try {
      // ⚠️ Check duplicate order
      const [existing] = await mySqlQury(
        `SELECT id FROM tbl_ecom_orders WHERE orderid = ? LIMIT 1`,
        [finalPayload.id]
      );
       
       console.log("existing", existing);

      if (existing && existing.length > 0) {
        console.log(`⚠️ Duplicate order ignored (orderid: ${finalPayload.id})`);
        await mySqlQury("ROLLBACK");
        return new Response(
          JSON.stringify({
            status: "duplicate_ignored",
            orderid: finalPayload.id,
            message: "Order already exists, skipping insert"
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // -------------------------------
      // 1️⃣ Insert into tbl_ecom_orders
      // -------------------------------
      const orderResult = await mySqlQury(
        `INSERT INTO tbl_ecom_orders 
         (channel, ref_number, orderid, invoice_no, client_id, payment_mode, collectable_amount, warehouse_id, total_weight, weight_unit, grand_total, total_qty, box_qty, total_tax, total_discount, is_unprocessed, shop_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "shopify", // channel
         String(finalPayload.name) || null, // ref_number
          String(finalPayload.order_number) || null, // orderid
          String(finalPayload.order_number) || null, // invoice_no
          0, // client_id
          String(finalPayload.payment_terms) || null, // payment_mode
          Number(finalPayload.total_price) || 0, // collectable_amount
          null, // warehouse_id
          Number(finalPayload.total_weight) || 0,
          "gm",
          Number(finalPayload.total_price) || 0,
          Number(finalPayload.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0), // Total quantity from all line items
          1,
          Number(finalPayload.total_tax) || 0,
          Number(finalPayload.total_discounts) || 0,
          1, // is_unprocessed
          shop || "unknown" // shop_name - Shopify shop domain (e.g., "dispatch-solutions.myshopify.com")
        ]
      );

      // Get the inserted order ID - handle insertId: 0 issue
      let insertedOrderId = orderResult.insertId;
      
      // If insertId is 0, try multiple fallback methods
      if (!insertedOrderId || insertedOrderId === 0) {
        console.log("⚠️ insertId is 0, trying fallback methods...");
        
        // Method 1: Use LAST_INSERT_ID() (works within same connection)
        try {
          const [lastIdResult] = await mySqlQury(`SELECT LAST_INSERT_ID() as id`);
          if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0].id > 0) {
            insertedOrderId = lastIdResult[0].id;
            console.log("✅ Got ID from LAST_INSERT_ID():", insertedOrderId);
          }
        } catch (e) {
          console.log("⚠️ LAST_INSERT_ID() failed, trying next method...");
        }
        
        // Method 2: Query by orderid (unique identifier from Shopify)
        if (!insertedOrderId || insertedOrderId === 0) {
          const shopifyOrderNumber = String(finalPayload.order_number || finalPayload.id || finalPayload.name || '');
          if (shopifyOrderNumber) {
            try {
              const idResult = await mySqlQury(
                `SELECT id FROM tbl_ecom_orders WHERE orderid = ? ORDER BY id DESC LIMIT 1`,
                [shopifyOrderNumber]
              );
              if (idResult && idResult.length > 0 && idResult[0].id > 0) {
                insertedOrderId = idResult[0].id;
                console.log("✅ Got ID from orderid query:", insertedOrderId);
              }
            } catch (e) {
              console.log("⚠️ Query by orderid failed:", e.message);
            }
          }
        }
        
        // Method 3: Get the most recent order ID for this shop
        if (!insertedOrderId || insertedOrderId === 0) {
          try {
            const recentResult = await mySqlQury(
              `SELECT id FROM tbl_ecom_orders WHERE shop_name = ? AND channel = 'shopify' ORDER BY id DESC LIMIT 1`,
              [shop || "unknown"]
            );
            if (recentResult && recentResult.length > 0 && recentResult[0].id > 0) {
              insertedOrderId = recentResult[0].id;
              console.log("✅ Got ID from recent order query:", insertedOrderId);
            }
          } catch (e) {
            console.log("⚠️ Recent order query failed:", e.message);
          }
        }
      }
      
      // Final validation
      if (!insertedOrderId || insertedOrderId === 0) {
        console.error("❌ CRITICAL: Could not get inserted order ID! Related records may fail.");
        console.error("   Order was inserted but ID retrieval failed.");
        console.error("   This might cause consignee, products, and boxes to have wrong order_id.");
      }
      
      console.log("✅ Order inserted with ID:", insertedOrderId);
      console.log("✅ Order belongs to shop/client:", shop);
      console.log("✅ orderResult :", orderResult);

      // -------------------------------
      // 2️⃣ Insert into tbl_ecom_consignee_details
      // -------------------------------
      const ship = finalPayload.shipping_address || {};
      const bill = finalPayload.billing_address || {};
      const customer = finalPayload.customer || {};

      // Get phone number with fallback priority:
      // 1. shipping_address.phone
      // 2. billing_address.phone
      // 3. customer.phone
      // 4. order.phone (if exists)
      const shippingPhone = ship.phone || null;
      const billingPhone = bill.phone || null;
      const customerPhone = customer.phone || null;
      const orderPhone = finalPayload.phone || null;
      
      // Use the first available phone number
      const phone = shippingPhone || billingPhone || customerPhone || orderPhone || null;
      
      // Same for billing phone
      const billingPhoneFinal = billingPhone || shippingPhone || customerPhone || orderPhone || null;

      console.log("📞 Phone number lookup:");
      console.log(`   Shipping phone: ${shippingPhone || 'null'}`);
      console.log(`   Billing phone: ${billingPhone || 'null'}`);
      console.log(`   Customer phone: ${customerPhone || 'null'}`);
      console.log(`   Order phone: ${orderPhone || 'null'}`);
      console.log(`   ✅ Using phone: ${phone || 'null'}`);

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
          String(finalPayload.email || customer.email) || null,
          phone ? String(phone) : null, // Use phone with fallback
          String(ship.address1) || null,
          String(ship.address2) || null,
          String(ship.country) || null,
          String(ship.province) || null,
          String(ship.city) || null,
          String(ship.zip) || null,
          (!bill.first_name && !bill.address1) ? 1 : 0, // billing_same_as_shipping: 1 if billing is empty, else 0
          String(bill.first_name || ship.first_name) || null,
          String(bill.last_name || ship.last_name) || null,
          String(bill.email || finalPayload.email || customer.email) || null,
          billingPhoneFinal ? String(billingPhoneFinal) : null, // Use billing phone with fallback
          String(bill.address1 || ship.address1) || null,
          String(bill.address2 || ship.address2) || null,
          String(bill.country || ship.country) || null,
          String(bill.province || ship.province) || null,
          String(bill.city || ship.city) || null,
          String(bill.zip || ship.zip) || null
        ]
      );
      console.log("✅ Consignee inserted with phone:", phone || "null");

      // -------------------------------
      // 3️⃣ Insert into tbl_ecom_boxes_details
      // -------------------------------
      // Calculate box dimensions based on products
      const totalWeightGrams = Number(finalPayload.total_weight) || 0;
      const boxDimensions = calculateBoxDimensions(finalPayload.line_items, totalWeightGrams);
      
      await mySqlQury(
        `INSERT INTO tbl_ecom_boxes_details 
         (order_id, package_type, length, breadth, height, dimension_unit, weight, weight_unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertedOrderId,
          "box",
          boxDimensions.length,
          boxDimensions.breadth,
          boxDimensions.height,
          "cm",
          totalWeightGrams,
          "gm"
        ]
      );
      console.log("✅ Box details inserted");
      console.log(`   📦 Dimensions: ${boxDimensions.length}cm x ${boxDimensions.breadth}cm x ${boxDimensions.height}cm`);
      console.log(`   ⚖️ Weight: ${totalWeightGrams}gm`);

      // -------------------------------
      // 4️⃣ Insert into tbl_ecom_product_details
      // -------------------------------
      if (finalPayload.line_items && finalPayload.line_items.length > 0) {
        for (const item of finalPayload.line_items) {
          // Calculate product weight (convert to grams if needed)
          let productWeightGrams = 0;
          if (item.weight_grams) {
            productWeightGrams = Number(item.weight_grams);
          } else if (item.grams) {
            productWeightGrams = Number(item.grams);
          } else {
            // If weight per unit is not available, estimate from total weight
            const totalQty = finalPayload.line_items.reduce((sum, li) => sum + (li.quantity || 0), 0);
            productWeightGrams = totalQty > 0 ? Math.round(totalWeightGrams / totalQty) : 0;
          }
          
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
          
          // Log weight information for debugging
          if (productWeightGrams > 0) {
            console.log(`   📦 Product: ${item.title || item.name} - Weight: ${productWeightGrams}gm (Qty: ${item.quantity})`);
          }
        }
        console.log(`✅ ${finalPayload.line_items.length} products inserted`);
      }

      // ✅ All success → commit
      await mySqlQury("COMMIT");
      console.log("✅ Transaction committed successfully");

      // Prepare response with box dimensions
      const responseData = {
        verified: true,
        shop: shop,
        topic: topic,
        order_id: finalPayload.id,
        box_dimensions: {
          length: boxDimensions.length,
          breadth: boxDimensions.breadth,
          height: boxDimensions.height,
          dimension_unit: "cm",
          weight: totalWeightGrams,
          weight_unit: "gm",
          // ⚠️ IMPORTANT: Indicate if dimensions are REAL or ESTIMATED
          is_estimated: boxDimensions.is_estimated !== false, // true = estimated, false = real from Shopify
          source: boxDimensions.source || 'weight_based_calculation', // 'shopify_product_variant' or 'weight_based_calculation'
        },
        calculated_from: {
          total_weight_grams: totalWeightGrams,
          total_quantity: finalPayload.line_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
          item_count: finalPayload.line_items?.length || 0,
          has_real_dimensions: finalPayload.line_items?.some(item => item.length && item.width && item.height) || false
        }
      };

      return new Response(
        JSON.stringify(responseData, null, 2),
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
