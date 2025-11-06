/**
 * Script to check if products have dimensions set in Shopify
 * Run: node check-product-dimensions.js
 */

import fetch from 'node-fetch';

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || 'your-shop.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || '';

if (!SHOPIFY_ACCESS_TOKEN || SHOPIFY_SHOP === 'your-shop.myshopify.com') {
  console.error('❌ Please set SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN in .env file');
  process.exit(1);
}

async function checkProductDimensions() {
  try {
    console.log(`🔍 Checking product dimensions for shop: ${SHOPIFY_SHOP}\n`);

    // Fetch products using GraphQL
    const query = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    weight
                    weightUnit
                    length
                    width
                    height
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${SHOPIFY_SHOP}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { first: 50 } // Check first 50 products
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
      return;
    }

    const products = result.data?.products?.edges || [];
    
    console.log(`📦 Found ${products.length} products\n`);
    console.log('=' .repeat(80));
    
    let productsWithDimensions = 0;
    let productsWithoutDimensions = 0;
    let totalVariantsWithDimensions = 0;
    let totalVariantsWithoutDimensions = 0;

    products.forEach(({ node: product }) => {
      const variants = product.variants?.edges || [];
      let productHasDimensions = false;

      variants.forEach(({ node: variant }) => {
        const hasDimensions = variant.length && variant.width && variant.height;
        
        if (hasDimensions) {
          productHasDimensions = true;
          totalVariantsWithDimensions++;
          console.log(`✅ Product: ${product.title}`);
          console.log(`   Variant: ${variant.title || variant.sku || 'Default'}`);
          console.log(`   Dimensions: ${variant.length}cm × ${variant.width}cm × ${variant.height}cm`);
          console.log(`   Weight: ${variant.weight || 0}${variant.weightUnit || 'g'}\n`);
        } else {
          totalVariantsWithoutDimensions++;
        }
      });

      if (productHasDimensions) {
        productsWithDimensions++;
      } else {
        productsWithoutDimensions++;
        // Show products without dimensions
        console.log(`❌ Product: ${product.title} - No dimensions set`);
        console.log(`   Variants: ${variants.length}\n`);
      }
    });

    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Products with dimensions: ${productsWithDimensions}`);
    console.log(`   Products without dimensions: ${productsWithoutDimensions}`);
    console.log(`   Variants with dimensions: ${totalVariantsWithDimensions}`);
    console.log(`   Variants without dimensions: ${totalVariantsWithoutDimensions}`);
    
    if (totalVariantsWithoutDimensions > 0) {
      console.log('\n⚠️  Recommendation:');
      console.log('   Set dimensions in Shopify Admin → Products → Select Product → Variant → Shipping');
      console.log('   Once set, your orders will use REAL dimensions instead of estimation.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProductDimensions();

