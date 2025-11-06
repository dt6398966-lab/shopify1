# 📍 Shopify में Dimensions कहाँ मिलेंगी - Complete Guide

## ⚠️ Important: Dimensions Variant Edit Modal में नहीं होतीं!

Shopify में product dimensions **variant edit modal** में नहीं होतीं। वे **Product Page के Shipping Section** में होती हैं।

---

## ✅ **सही जगह (Correct Location):**

### Method 1: Product Page से (Recommended)

1. **Shopify Admin** → **Products**
2. **Product select करें** (जिस product की dimensions check करनी हैं)
3. **Product page scroll करें** - Variant section के **नीचे** जाएं
4. **Shipping section** देखें (Product level पर, variant level पर नहीं)
5. यहाँ मिलेंगी:
   - ✅ **Weight**
   - ✅ **Country/Region of origin**
   - ✅ **HS code**
   - **लेकिन dimensions यहाँ भी नहीं होतीं!** (Old interface)

---

### Method 2: Variant Page से (New Method)

**Note:** Shopify में dimensions कभी-कभी variant के **separate section** में होतीं:

1. **Product page** पर जाएं
2. **Variants** section में **variant title पर click करें** (not "Edit" button)
   - या variant dropdown से variant select करें
3. अब **variant details** दिखेंगे
4. **Scroll down** करें - **Shipping** या **Inventory** section में देखें
5. यहाँ हो सकती हैं:
   - Length
   - Width  
   - Height

---

### Method 3: REST API/GraphQL से Check करें

अगर UI में dimensions नहीं दिख रहीं, possible reasons:
- Shopify plan में dimensions feature available नहीं हो
- Product type के लिए dimensions disabled हों
- Custom fields में store हो रही हों

---

## 🔍 **Actual Location (Shopify Interface में):**

### Step-by-Step Visual Guide:

```
Shopify Admin
└── Products
    └── [Your Product] ← Click here
        └── Product Edit Page
            ├── Title, Description...
            ├── Media...
            ├── Pricing...
            ├── Inventory...
            ├── Shipping Section ← यहाँ देखें! ⬅️
            │   ├── Weight: [value]
            │   ├── Requires shipping: [checkbox]
            │   └── Dimensions: ← अगर show हो रहा हो तो यहाँ होगा
            │       ├── Length
            │       ├── Width
            │       └── Height
            └── Variants Section
                └── [Variant Edit] ← यहाँ Dimensions नहीं मिलेंगी ❌
```

---

## ⚠️ **Why Dimensions नहीं दिख रहीं?**

### Possible Reasons:

1. **Shopify Plan Limitation:**
   - Basic plan में dimensions feature limited हो सकता है
   - Advanced plan required हो सकता है

2. **Product Type:**
   - Digital products में dimensions नहीं होतीं
   - Physical products में होनी चाहिए

3. **Theme/App Settings:**
   - कुछ themes dimensions hide कर देते हैं
   - Settings में shipping dimensions enable करना पड़ सकता है

4. **Location:**
   - Dimensions **Variant level** पर नहीं, **Product level** पर हो सकतीं
   - या **Inventory section** में hidden हो सकतीं

---

## 🎯 **Solution: GraphQL API से Check करें**

UI में dimensions नहीं दिख रहीं तो, **API से check** करें - यह सबसे reliable तरीका है!

### Step 1: Access Token लें
- Shopify Admin → Settings → Apps and sales channels → Develop apps
- Create app → Install → Get Admin API access token

### Step 2: Run हमारा Script
```bash
node check-product-dimensions.js
```

यह script directly **Shopify API** से check करेगी कि dimensions set हैं या नहीं, भले ही UI में न दिखें।

---

## 📋 **Alternative: Manual Check via API**

अगर script run नहीं कर सकते, तो **GraphQL Playground** use करें:

### Shopify GraphQL Admin API:
```
URL: https://your-shop.myshopify.com/admin/api/2025-01/graphql.json

Query:
query {
  products(first: 5) {
    edges {
      node {
        title
        variants(first: 5) {
          edges {
            node {
              title
              length
              width
              height
              weight
            }
          }
        }
      }
    }
  }
}
```

अगर response में `length`, `width`, `height` में values आएं → ✅ Set हैं  
अगर `null` आएं → ❌ Set नहीं हैं

---

## 💡 **Recommendation:**

1. **पहले API से check करें** (सबसे reliable)
2. अगर dimensions set नहीं हैं:
   - Shopify Admin में manually set करें
   - या हमारा **estimation code** use करें (automatically काम करेगा)

3. **Future में:** Products add करते समय dimensions भी set करें

---

## 🚀 **Quick Fix:**

अगर आप dimensions set करना चाहते हैं लेकिन UI में option नहीं दिख रहा:

**Shopify Support से contact करें** या:
- Settings → Shipping → Check shipping profiles
- Product page → Shipping section → Look for "Dimensions" checkbox

**Note:** कुछ Shopify stores में dimensions feature disabled हो सकता है based on plan या settings।

