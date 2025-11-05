# Wishlist Shopify App Migration Plan

**Date**: November 3, 2025
**Current Implementation**: Theme-based wishlist with custom backend
**Target**: Public Shopify App Store application

---

## Executive Summary

This document outlines the complete migration plan to convert your current theme-based wishlist implementation into a public Shopify App that can be published on the Shopify App Store.

### Key Objectives
- ✅ Multi-store support (installable by any Shopify merchant)
- ✅ Shopify App Store compliance (privacy, performance, security)
- ✅ Maintain current functionality (hearts, sync, quick-add, color variants)
- ✅ Improve scalability and reliability
- ✅ Monetization ready (Shopify billing integration)

---

## Current Architecture Analysis

### What You Have Now

**Frontend (Theme-based)**
- Files: `wishlist.js` (~2900 lines), `wishlist.css` (~977 lines)
- Liquid templates: `wishlist-page.liquid`, `wishlist-heart.liquid`, `wishlist-sync-banner.liquid`
- Storage: localStorage (primary) + Customer metafields (for logged-in users)
- Features: Heart toggles, cart drawer integration, quick-add, color variants, sorting/filtering

**Backend (Custom Node.js Server)**
- Location: `C:\Users\Utilizador\Downloads\wishlist-backend`
- Platform: Render.com (free tier with cold starts)
- Stack: Node.js + Express + @shopify/shopify-api v7.7.0
- Endpoints:
  - `GET /health` - Health check
  - `GET /auth` - OAuth installation
  - `GET /auth/callback` - OAuth callback
  - `GET /proxy/api/wishlist/get` - Fetch wishlist
  - `POST /proxy/api/wishlist/save` - Save wishlist
- Storage: Shopify Customer Metafields (namespace: `wishlist`, key: `items`)

**Current Limitations**
- ❌ Single store only (hardcoded credentials in .env)
- ❌ App Proxy required for API calls (adds latency)
- ❌ Cold start issues (15-minute sleep on free tier)
- ❌ Manual deployment required for updates
- ❌ Not App Store compliant
- ❌ No multi-merchant billing
- ❌ Missing GDPR webhook handlers
- ❌ Theme code must be manually installed

---

## Shopify App Requirements (2025)

### 1. Authentication & Authorization

**Required Approach: Token Exchange (for embedded apps)**
```
Old Flow (Current):
Store → App Proxy → Your Backend → OAuth → Shopify API

New Flow (App):
Store → App Bridge → Token Exchange → Access Token → Shopify API
```

**Key Requirements:**
- ✅ OAuth 2.0 implementation (managed by Shopify App SDK)
- ✅ Token exchange for embedded apps (no redirects, better performance)
- ✅ Session tokens for authenticated requests
- ✅ HMAC validation for all requests from Shopify
- ✅ Request only necessary scopes (minimize for merchant trust)
- ✅ Implement strong CSRF protection (state parameter)

### 2. Privacy & Data Protection

**Mandatory Requirements:**
- ✅ Privacy policy (publicly accessible URL)
- ✅ GDPR compliance (EU, UK, US privacy laws)
- ✅ Data processing agreement (DPA) disclosure
- ✅ GDPR webhooks (3 mandatory):
  - `customers/data_request` - Provide customer data
  - `customers/redact` - Delete customer data
  - `shop/redact` - Delete shop data (48 hours after uninstall)

**Data Storage Rules:**
- Only collect what's necessary for functionality
- Disclose all data collection in privacy policy
- Implement data retention policies
- Support data export/deletion requests
- If storing data outside EEA, use Standard Contractual Clauses

**Privacy Policy Must Include:**
- What data is collected (customer IDs, product handles, wishlist data)
- How data is used (wishlist storage, cross-device sync)
- How long data is retained (specify retention period)
- Where data is stored (server location)
- Third-party services used (if any)
- How customers can request data deletion

### 3. Performance Requirements

**Hard Limits:**
- ✅ Response times: <500ms for 95% of requests
- ✅ Lighthouse score impact: ≤10 points reduction
- ✅ Must provide performance test screenshots during submission
- ✅ Optimize for fast initial load
- ✅ No blocking scripts on storefront

**Best Practices:**
- Use Shopify CDN for static assets
- Implement lazy loading for images
- Minimize JavaScript bundle size
- Use App Blocks (automatically CDN-cached)
- Async/defer script loading

### 4. Billing Integration

**If App is Paid:**
- ✅ MUST use Shopify Billing API (no external payment processors)
- ✅ Supported billing models:
  - One-time charges
  - Recurring subscriptions (monthly/annual)
  - Usage-based billing
  - Free trial periods
- ✅ Clear pricing communication in app listing
- ✅ Handle subscription cancellation gracefully

**Example Pricing Model:**
```
Free Plan:
- Up to 25 wishlist items per customer
- localStorage only (no cross-device sync)

Basic Plan ($4.99/month):
- Unlimited wishlist items
- Cross-device sync via customer metafields
- Email support

Pro Plan ($14.99/month):
- Everything in Basic
- Analytics dashboard
- Multiple wishlist lists
- Share wishlist functionality
- Priority support
```

### 5. App Store Listing Requirements

**Technical Checklist:**
- ✅ App icon: 1200x1200px (JPEG or PNG, no Shopify logo)
- ✅ At least 3 screenshots (no myshopify.com URLs visible)
- ✅ App name (unique, no "Shopify" in name)
- ✅ Tagline (max 70 characters)
- ✅ Description (clear functionality explanation)
- ✅ Pricing clearly stated
- ✅ Support contact info
- ✅ Privacy policy URL
- ✅ Support URL (help docs)

**Design Standards:**
- Use Shopify Polaris design system
- Accessible UI (WCAG AA compliance)
- Mobile-responsive admin interface
- Clean, professional appearance

### 6. App Extensions (Critical for UI Integration)

**Theme App Extensions** (replaces manual theme installation)

Your app will use **App Blocks** to inject UI:

```
Structure:
your-app/
├── extensions/
│   └── wishlist-extension/
│       ├── blocks/
│       │   ├── wishlist-heart.liquid (Heart button block)
│       │   ├── wishlist-grid.liquid (Wishlist page grid)
│       │   └── quick-add.liquid (Quick add overlay)
│       ├── assets/
│       │   ├── wishlist.js (Your JavaScript)
│       │   └── wishlist.css (Your styles)
│       └── snippets/
│           └── wishlist-sync-banner.liquid
```

**Benefits:**
- ✅ Merchants add blocks via theme editor (no code editing)
- ✅ Automatic CDN hosting for assets
- ✅ Works on all OS 2.0 themes
- ✅ Automatically removed when app uninstalled
- ✅ No theme update conflicts

**Types of Blocks:**

1. **App Blocks** (inline content):
   - Wishlist heart button
   - Product grid on wishlist page
   - Quick-add size picker

2. **App Embed Blocks** (site-wide):
   - Cart drawer wishlist tab
   - Wishlist count badge
   - Sync status indicator

---

## Proposed New Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHOPIFY APP ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   Merchant   │────────▶│  App Admin   │ (Embedded in Admin) │
│  │   Installs   │         │  Dashboard   │                     │
│  └──────────────┘         └──────────────┘                     │
│         │                        │                              │
│         │                        ▼                              │
│         │              ┌──────────────────┐                    │
│         │              │  App Backend     │                    │
│         │              │  (Node.js +      │                    │
│         │              │   Shopify API)   │                    │
│         │              └──────────────────┘                    │
│         │                        │                              │
│         ▼                        ▼                              │
│  ┌──────────────────────────────────────────┐                 │
│  │     Theme App Extensions                  │                 │
│  ├──────────────────────────────────────────┤                 │
│  │  • Wishlist Heart Block                  │                 │
│  │  • Wishlist Page Grid Block              │                 │
│  │  • Cart Drawer Wishlist Tab              │                 │
│  │  • Quick-Add Overlay                     │                 │
│  │  • Assets (JS/CSS via Shopify CDN)       │                 │
│  └──────────────────────────────────────────┘                 │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────┐                 │
│  │     Customer Storefront                   │                 │
│  │  • Clicks heart → Add to wishlist         │                 │
│  │  • Opens cart → See wishlist tab          │                 │
│  │  • Visits /pages/wishlist → See grid      │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌──────────────────┐          ┌──────────────────────┐
│  Shopify Admin   │          │  Customer Metafields  │
│  API             │          │  (Wishlist Storage)   │
│  • Metafields    │◀────────▶│  namespace: app_wishlist│
│  • Products      │          │  key: items           │
│  • Customers     │          │  type: json           │
└──────────────────┘          └──────────────────────┘
```

### Tech Stack (Recommended)

**Backend Framework Options:**

**Option 1: Shopify Remix App (Recommended for 2025)**
```
Why: Official Shopify starter template
Benefits:
  - Built-in App Bridge integration
  - Token exchange pre-configured
  - Polaris components included
  - React + Remix (modern, fast)
  - TypeScript support
  - Prisma ORM for database
  - Shopify CLI integration
```

**Option 2: Node.js + Express (Your Current Stack)**
```
Why: You're already familiar with it
Needs:
  - @shopify/shopify-app-express v4+ (latest version)
  - Session storage (PostgreSQL/MySQL/SQLite)
  - Manual App Bridge setup
  - Manual Polaris integration
```

**Frontend (Theme Extensions)**
- Liquid templates (app blocks)
- Vanilla JavaScript (reuse your current code)
- CSS (adapt your current styles)
- Shopify CDN for assets

**Storage Options:**

1. **Customer Metafields** (for wishlist data)
   - Namespace: `app_wishlist` (reserved for your app)
   - Type: JSON
   - Benefits: Native Shopify, no external DB needed
   - Limitation: Max 50 metafields per customer

2. **App Data Metafields** (for app settings)
   - Namespace: `$app:your-app-handle`
   - Store app configuration per shop

3. **External Database** (for analytics, advanced features)
   - PostgreSQL/MySQL for relational data
   - MongoDB for flexible schemas
   - Use for: Activity logs, analytics, A/B testing data

**Hosting Options:**

1. **Shopify Oxygen** (Shopify's hosting - Remix apps)
   - Best performance
   - Automatic scaling
   - Integrated with Shopify ecosystem

2. **Vercel/Railway** (Serverless/Container)
   - No cold starts (unlike Render free tier)
   - Automatic deployments
   - Better reliability

3. **Heroku/DigitalOcean/AWS** (Traditional hosting)
   - More control
   - Higher maintenance
   - Good for complex backends

---

## Migration Strategy

### Phase 1: Development Setup (Week 1)

**Step 1.1: Create Shopify App**
```bash
# Using Shopify CLI (recommended)
npm install -g @shopify/cli @shopify/app

# Create new app
shopify app init

# Choose template:
# - "Remix" (recommended) or "Node.js"
# - This generates starter code with OAuth, App Bridge, etc.
```

**Step 1.2: Configure App in Partner Dashboard**
- App name: "Wishlist Plus" (or your chosen name)
- App URL: `https://your-domain.com` (will set up later)
- Allowed redirection URLs: Add OAuth callback URLs
- Scopes required:
  - `read_customers` (read customer data)
  - `write_customers` (write to customer metafields)
  - `read_products` (fetch product data for wishlist)
  - `unauthenticated_read_product_listings` (public product access)

**Step 1.3: Set Up Development Environment**
```bash
# Install dependencies
cd your-app
npm install

# Start development server
shopify app dev

# This will:
# - Start local server
# - Create tunnel (no ngrok needed)
# - Open app in test store
```

### Phase 2: Backend Migration (Week 2-3)

**Step 2.1: Authentication Implementation**

Convert from App Proxy OAuth to App Bridge Token Exchange:

```javascript
// OLD (Current):
app.get('/auth', async (req, res) => {
  const authRoute = await shopify.auth.begin({
    shop: shopify.config.shopifyShopDomain,
    callbackPath: '/auth/callback',
    isOnline: false,
  });
  res.redirect(authRoute);
});

// NEW (Shopify App):
// Use Shopify App SDK - handles this automatically
import { shopifyApp } from '@shopify/shopify-app-express';

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: ['read_customers', 'write_customers', 'read_products'],
    hostScheme: 'https',
    hostName: process.env.HOST,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
});

// Token exchange happens automatically via shopify.authenticate.admin()
```

**Step 2.2: Convert API Endpoints**

Migrate from App Proxy to direct GraphQL/REST API:

```javascript
// OLD (App Proxy - your current code):
app.get('/proxy/api/wishlist/get', async (req, res) => {
  const customerId = req.query.customerId;
  const client = new shopify.clients.Rest({
    session: { /* session data */ },
  });
  const response = await client.get({
    path: `customers/${customerId}/metafields`,
  });
  // ...
});

// NEW (Shopify App - recommended):
app.get('/api/wishlist/get', async (req, res) => {
  // Authenticate request using session token
  const { session } = await shopify.authenticate.admin(req, res);

  const client = new shopify.clients.Graphql({ session });

  // Use GraphQL for better performance
  const response = await client.query({
    data: `query getWishlist($customerId: ID!) {
      customer(id: $customerId) {
        metafield(namespace: "app_wishlist", key: "items") {
          value
        }
      }
    }`,
    variables: { customerId: req.query.customerId },
  });

  const wishlist = JSON.parse(response.body.data.customer.metafield?.value || '[]');
  res.json({ wishlist });
});
```

**Step 2.3: Implement GDPR Webhooks**

Add mandatory webhook handlers:

```javascript
// Register webhooks
app.post('/api/webhooks', async (req, res) => {
  try {
    await shopify.webhooks.process({
      rawBody: req.body,
      rawRequest: req,
      rawResponse: res,
    });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Define webhook handlers
shopify.webhooks.addHandlers({
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/api/webhooks/customers/data-request',
    async callback({ topic, shop, body, webhookId }) {
      // Provide all data stored for this customer
      const customerId = body.customer.id;

      // Fetch customer's wishlist from metafields
      const wishlistData = await fetchCustomerWishlist(shop, customerId);

      // Send data to customer via email or API
      await sendCustomerData(customerId, wishlistData);

      return { success: true };
    },
  },

  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/api/webhooks/customers/redact',
    async callback({ topic, shop, body, webhookId }) {
      // Delete all customer data
      const customerId = body.customer.id;

      // Delete customer wishlist metafield
      await deleteCustomerWishlist(shop, customerId);

      // Delete from external DB if you have one
      if (externalDB) {
        await db.wishlists.delete({ customerId });
      }

      return { success: true };
    },
  },

  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/api/webhooks/shop/redact',
    async callback({ topic, shop, body, webhookId }) {
      // Delete all shop data (called 48h after uninstall)

      // Delete all customer wishlists for this shop
      await deleteShopData(shop);

      // Delete from external DB
      if (externalDB) {
        await db.shops.delete({ shop });
        await db.wishlists.deleteMany({ shop });
      }

      return { success: true };
    },
  },

  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: '/api/webhooks/app/uninstalled',
    async callback({ topic, shop, body, webhookId }) {
      // Clean up app data, cancel subscriptions, etc.
      console.log(`App uninstalled from shop: ${shop}`);

      // Cancel any active billing subscriptions
      // Mark shop as inactive in database

      return { success: true };
    },
  },
});
```

**Step 2.4: Multi-Store Session Management**

Add database for storing sessions (required for multi-store):

```javascript
// Install Prisma (recommended ORM)
npm install @prisma/client
npm install -D prisma

// Initialize Prisma
npx prisma init

// schema.prisma
model Session {
  id          String   @id
  shop        String
  state       String
  isOnline    Boolean  @default(false)
  scope       String?
  expires     DateTime?
  accessToken String
  userId      BigInt?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Shop {
  id              String   @id @default(cuid())
  shopDomain      String   @unique
  accessToken     String
  scope           String
  installedAt     DateTime @default(now())
  billingPlan     String?
  billingStatus   String?
  isActive        Boolean  @default(true)
}

// Use in app:
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';

const storage = new PrismaSessionStorage(prisma);

const shopify = shopifyApp({
  // ... other config
  sessionStorage: storage,
});
```

### Phase 3: Theme App Extensions (Week 3-4)

**Step 3.1: Create Extension Structure**

```bash
# Generate theme app extension
cd your-app
shopify app generate extension

# Choose: "Theme app extension"
# Name: "Wishlist UI"
```

**Step 3.2: Migrate Liquid Templates to App Blocks**

Convert your current Liquid files to app blocks:

```liquid
{%- comment -%}
  File: extensions/wishlist-extension/blocks/wishlist-heart.liquid

  This replaces: snippets/wishlist-heart.liquid
{%- endcomment -%}

{% schema %}
{
  "name": "Wishlist Heart Button",
  "target": "section",
  "stylesheet": "wishlist-heart.css",
  "javascript": "wishlist-heart.js",
  "settings": [
    {
      "type": "select",
      "id": "heart_style",
      "label": "Heart style",
      "options": [
        { "value": "outline", "label": "Outline" },
        { "value": "filled", "label": "Filled" }
      ],
      "default": "outline"
    },
    {
      "type": "color",
      "id": "active_color",
      "label": "Active color",
      "default": "#d23f57"
    },
    {
      "type": "select",
      "id": "position",
      "label": "Position",
      "options": [
        { "value": "top-right", "label": "Top right" },
        { "value": "top-left", "label": "Top left" },
        { "value": "inline", "label": "Inline with title" }
      ],
      "default": "top-right"
    }
  ]
}
{% endschema %}

<div class="wishlist-heart-container" data-position="{{ block.settings.position }}">
  <button
    type="button"
    class="wishlist-toggle"
    data-product-handle="{{ product.handle }}"
    data-product-id="{{ product.id }}"
    aria-pressed="false"
    aria-label="Add to wishlist"
    style="--heart-active-color: {{ block.settings.active_color }};"
  >
    <svg class="wishlist-toggle__icon" width="24" height="24" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </button>
</div>

{{ 'wishlist-core.js' | asset_url | script_tag }}
```

**Step 3.3: Convert JavaScript to App Extension Assets**

```javascript
// extensions/wishlist-extension/assets/wishlist-core.js

(function() {
  const STORAGE_KEY = 'theme-wishlist-cache';
  const MAX_ITEMS = 50;

  // Core wishlist functionality
  class WishlistApp {
    constructor() {
      this.customerId = window.Shopify?.customerEmail ? this.getCustomerId() : null;
      this.init();
    }

    init() {
      // Initialize from localStorage
      this.wishlist = this.loadLocal();

      // Sync hearts on page
      this.syncHearts();

      // Set up event listeners
      this.attachEventListeners();

      // If logged in, sync with server
      if (this.customerId) {
        this.syncWithServer();
      }
    }

    loadLocal() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Failed to load wishlist:', e);
        return [];
      }
    }

    saveLocal() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.wishlist));
      } catch (e) {
        console.error('Failed to save wishlist:', e);
      }
    }

    async syncWithServer() {
      if (!this.customerId) return;

      try {
        // Fetch from server
        const response = await fetch('/apps/wishlist/api/get', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: this.customerId,
          }),
        });

        const data = await response.json();

        // Merge with local
        this.wishlist = this.mergeWishlists(this.wishlist, data.wishlist || []);

        // Save merged result
        this.saveLocal();
        this.syncHearts();

        // Upload merged to server if changed
        await this.uploadToServer();
      } catch (e) {
        console.error('Server sync failed:', e);
      }
    }

    async uploadToServer() {
      if (!this.customerId) return;

      await fetch('/apps/wishlist/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: this.customerId,
          wishlist: this.stripData(this.wishlist),
        }),
      });
    }

    // ... rest of your wishlist logic (adapted from current code)
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new WishlistApp());
  } else {
    new WishlistApp();
  }
})();
```

**Step 3.4: App Embed Block for Cart Drawer**

```liquid
{%- comment -%}
  File: extensions/wishlist-extension/blocks/cart-drawer-tab.liquid

  Embedded in cart drawer automatically
{%- endcomment -%}

{% schema %}
{
  "name": "Wishlist Cart Tab",
  "target": "body",
  "enabled_on": {
    "templates": ["*"]
  },
  "settings": [
    {
      "type": "checkbox",
      "id": "show_in_drawer",
      "label": "Show wishlist tab in cart drawer",
      "default": true
    }
  ]
}
{% endschema %}

{% if block.settings.show_in_drawer %}
  <script>
    // Inject wishlist tab into cart drawer
    document.addEventListener('DOMContentLoaded', function() {
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        // Inject tab button and panel (reuse your current code)
        injectWishlistTab(cartDrawer);
      }
    });
  </script>
{% endif %}
```

### Phase 4: Admin Dashboard (Week 4-5)

**Step 4.1: Create Embedded Admin UI**

Build admin interface for merchants using Polaris:

```typescript
// app/routes/app._index.tsx (Remix)
// or routes/index.js (Express)

import { Page, Layout, Card, DataTable, Button } from '@shopify/polaris';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalWishlists: 0,
    activeUsers: 0,
    topProducts: [],
    conversionRate: 0,
  });

  useEffect(() => {
    // Fetch analytics data
    fetchAnalytics();
  }, []);

  return (
    <Page title="Wishlist Analytics">
      <Layout>
        <Layout.Section>
          <Card title="Overview">
            <div style={{ padding: '1rem' }}>
              <p>Total wishlists: {stats.totalWishlists}</p>
              <p>Active users (30d): {stats.activeUsers}</p>
              <p>Wishlist → Cart conversion: {stats.conversionRate}%</p>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Most Wishlisted Products">
            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric']}
              headings={['Product', 'Times Wishlisted', 'Added to Cart']}
              rows={stats.topProducts.map(p => [
                p.title,
                p.wishlistCount,
                p.addToCartCount,
              ])}
            />
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Settings">
            <Button onClick={() => navigate('/settings')}>
              Configure Wishlist
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

**Step 4.2: Settings Page**

```typescript
// app/routes/app.settings.tsx

import { Page, Layout, Card, Form, FormLayout, TextField, Checkbox, Button } from '@shopify/polaris';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    maxItemsPerWishlist: 50,
    enableEmailNotifications: true,
    enableGuestWishlists: true,
    autoSyncInterval: 30, // seconds
  });

  const handleSave = async () => {
    // Save to app metafields
    await fetch('/api/settings/save', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  };

  return (
    <Page title="Wishlist Settings">
      <Layout>
        <Layout.Section>
          <Card>
            <Form onSubmit={handleSave}>
              <FormLayout>
                <TextField
                  label="Max items per wishlist"
                  type="number"
                  value={settings.maxItemsPerWishlist.toString()}
                  onChange={(value) => setSettings({ ...settings, maxItemsPerWishlist: parseInt(value) })}
                />

                <Checkbox
                  label="Enable email notifications for price drops"
                  checked={settings.enableEmailNotifications}
                  onChange={(value) => setSettings({ ...settings, enableEmailNotifications: value })}
                />

                <Checkbox
                  label="Enable wishlists for guest users (localStorage)"
                  checked={settings.enableGuestWishlists}
                  onChange={(value) => setSettings({ ...settings, enableGuestWishlists: value })}
                />

                <TextField
                  label="Auto-sync interval (seconds)"
                  type="number"
                  value={settings.autoSyncInterval.toString()}
                  onChange={(value) => setSettings({ ...settings, autoSyncInterval: parseInt(value) })}
                  helpText="How often to sync wishlist with server for logged-in users"
                />

                <Button primary submit>Save Settings</Button>
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

### Phase 5: Billing Integration (Week 5-6)

**Step 5.1: Define Pricing Plans**

```javascript
// config/billing.js

export const BILLING_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    interval: null,
    features: {
      maxItemsPerCustomer: 25,
      crossDeviceSync: false,
      analytics: false,
      emailNotifications: false,
      multipleLists: false,
    },
  },

  BASIC: {
    name: 'Basic',
    price: 4.99,
    interval: 'EVERY_30_DAYS',
    features: {
      maxItemsPerCustomer: 100,
      crossDeviceSync: true,
      analytics: true,
      emailNotifications: false,
      multipleLists: false,
    },
  },

  PRO: {
    name: 'Pro',
    price: 14.99,
    interval: 'EVERY_30_DAYS',
    features: {
      maxItemsPerCustomer: 500,
      crossDeviceSync: true,
      analytics: true,
      emailNotifications: true,
      multipleLists: true,
      prioritySupport: true,
    },
  },
};
```

**Step 5.2: Implement Billing Flow**

```javascript
// routes/billing.js

app.post('/api/billing/subscribe', async (req, res) => {
  const { session } = await shopify.authenticate.admin(req, res);
  const { plan } = req.body;

  const planConfig = BILLING_PLANS[plan];

  // Create subscription
  const subscription = await shopify.billing.request({
    session,
    plan: planConfig.name,
    amount: planConfig.price,
    currencyCode: 'USD',
    interval: planConfig.interval,
    returnUrl: `${process.env.HOST}/api/billing/callback`,
  });

  res.json({
    confirmationUrl: subscription.confirmationUrl,
  });
});

app.get('/api/billing/callback', async (req, res) => {
  const { session } = await shopify.authenticate.admin(req, res);

  // Confirm subscription
  const subscription = await shopify.billing.check({
    session,
    plans: Object.values(BILLING_PLANS).map(p => p.name),
    isTest: process.env.NODE_ENV === 'development',
  });

  if (subscription) {
    // Update shop record with billing info
    await db.shops.update({
      where: { shopDomain: session.shop },
      data: {
        billingPlan: subscription.plan,
        billingStatus: 'ACTIVE',
      },
    });

    res.redirect('/'); // Redirect to app dashboard
  } else {
    res.redirect('/billing'); // Redirect to billing page
  }
});

// Middleware to check billing status
async function requireBilling(req, res, next) {
  const { session } = await shopify.authenticate.admin(req, res);

  const shop = await db.shops.findUnique({
    where: { shopDomain: session.shop },
  });

  if (!shop || shop.billingStatus !== 'ACTIVE') {
    return res.status(402).json({
      error: 'Subscription required',
      redirectUrl: '/billing',
    });
  }

  next();
}

// Apply to protected routes
app.post('/api/wishlist/save', requireBilling, async (req, res) => {
  // ... handle request
});
```

### Phase 6: Testing & Performance (Week 6-7)

**Step 6.1: Performance Testing**

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Create lighthouse config
# lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["https://your-test-store.myshopify.com"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3500}]
      }
    }
  }
}

# Run tests
lhci autorun
```

**Performance Checklist:**
- ✅ JavaScript bundle <100KB (gzipped)
- ✅ CSS bundle <50KB (gzipped)
- ✅ Images lazy-loaded
- ✅ API responses <500ms (95th percentile)
- ✅ No render-blocking scripts
- ✅ Lighthouse performance score >90

**Step 6.2: Load Testing**

```javascript
// Use Artillery for API load testing
// artillery.yml

config:
  target: "https://your-app.com"
  phases:
    - duration: 60
      arrivalRate: 10 # 10 requests/sec
    - duration: 60
      arrivalRate: 50 # Ramp up to 50 req/sec

scenarios:
  - name: "Fetch wishlist"
    flow:
      - post:
          url: "/api/wishlist/get"
          json:
            customerId: "{{ $randomString() }}"

  - name: "Save wishlist"
    flow:
      - post:
          url: "/api/wishlist/save"
          json:
            customerId: "{{ $randomString() }}"
            wishlist: [
              { handle: "product-1", title: "Product 1" }
            ]
```

**Step 6.3: Functional Testing**

```javascript
// Use Playwright for E2E testing

import { test, expect } from '@playwright/test';

test('Add product to wishlist', async ({ page }) => {
  // Navigate to product page
  await page.goto('https://test-store.myshopify.com/products/test-product');

  // Click heart button
  await page.click('.wishlist-toggle');

  // Verify heart is active
  await expect(page.locator('.wishlist-toggle')).toHaveAttribute('aria-pressed', 'true');

  // Check localStorage
  const wishlist = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('theme-wishlist-cache'));
  });

  expect(wishlist).toHaveLength(1);
  expect(wishlist[0].handle).toBe('test-product');
});

test('Wishlist syncs across devices', async ({ browser }) => {
  // Create two contexts (simulate two devices)
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Login on both
  await page1.goto('https://test-store.myshopify.com/account/login');
  // ... login steps

  await page2.goto('https://test-store.myshopify.com/account/login');
  // ... login steps

  // Add product on device 1
  await page1.goto('https://test-store.myshopify.com/products/test-product');
  await page1.click('.wishlist-toggle');

  // Wait for sync
  await page1.waitForTimeout(3000);

  // Refresh device 2
  await page2.reload();

  // Verify product appears on device 2
  await page2.goto('https://test-store.myshopify.com/pages/wishlist');
  await expect(page2.locator('.wishlist-card')).toHaveCount(1);
});
```

### Phase 7: App Store Submission (Week 7-8)

**Step 7.1: Prepare App Listing**

Create required assets:

```
assets/
├── app-icon.png (1200x1200)
├── screenshots/
│   ├── 1-product-heart.png
│   ├── 2-wishlist-page.png
│   ├── 3-cart-drawer.png
│   ├── 4-admin-dashboard.png
│   └── 5-settings.png
├── demo-video.mp4 (optional)
└── documentation/
    ├── user-guide.md
    ├── installation.md
    └── troubleshooting.md
```

**App Listing Content:**

```
App Name: Wishlist Plus

Tagline: Beautiful wishlists with cross-device sync and powerful analytics

Description:
Enable customers to save their favorite products and sync across all devices.
Wishlist Plus provides a seamless experience with:

✓ One-click wishlist saving with heart buttons
✓ Beautiful wishlist pages that match your theme
✓ Cart drawer integration for quick access
✓ Cross-device synchronization for logged-in customers
✓ Guest wishlist support via browser storage
✓ Color variant tracking
✓ Quick-add to cart from wishlist
✓ Analytics dashboard to track popular products
✓ GDPR compliant with automatic data deletion

Perfect for fashion, home decor, and gift stores. No theme editing required -
install via app blocks in your theme editor.

Key features:
• Unlimited products per wishlist (plan dependent)
• Mobile-optimized responsive design
• Fast performance (<500ms response times)
• Polaris-based admin interface
• Email notifications for price drops (Pro plan)
• Multiple wishlist lists (Pro plan)

Plans:
• Free: Up to 25 items per customer, localStorage only
• Basic ($4.99/month): Unlimited items, cross-device sync, analytics
• Pro ($14.99/month): All Basic features + email alerts, multiple lists, priority support

Support:
Email: support@yourapp.com
Documentation: https://yourapp.com/docs
```

**Step 7.2: Privacy Policy**

Create comprehensive privacy policy (required):

```markdown
# Wishlist Plus Privacy Policy

Last updated: [Date]

## Introduction

Wishlist Plus ("we", "our", or "us") is committed to protecting the privacy of
our users. This Privacy Policy explains what information we collect, how we use
it, and your rights regarding your data.

## Information We Collect

### Automatically Collected:
- Shop domain name
- Shopify customer IDs (for logged-in users)
- Product handles and IDs added to wishlists
- Timestamps of wishlist actions
- IP addresses (for security and fraud prevention)

### From Merchants:
- Store name and contact information
- Billing information (via Shopify Billing API)

### From Customers:
- Wishlist contents (product handles, variant IDs)
- Color and size preferences

## How We Use Your Information

- To provide wishlist functionality
- To sync wishlists across devices
- To generate analytics for merchants
- To send email notifications (if enabled)
- To provide customer support
- To improve our service

## Data Storage

- Wishlist data is stored in Shopify customer metafields
- Server logs are retained for 30 days
- Analytics data is aggregated and anonymized after 90 days

## Data Sharing

We do NOT sell, rent, or share your personal information with third parties
except:
- With Shopify (as required for app functionality)
- When required by law
- With your explicit consent

## International Data Transfers

Our servers are located in [Location]. We use Standard Contractual Clauses
approved by the European Commission for transfers to countries outside the EEA.

## Your Rights (GDPR)

You have the right to:
- Access your data
- Correct inaccurate data
- Delete your data
- Object to processing
- Data portability
- Withdraw consent

To exercise these rights, contact us at privacy@yourapp.com

## Data Retention

- Active wishlists: Retained while app is installed
- Deleted wishlists: Purged immediately
- Shop data: Deleted 48 hours after app uninstall

## Security

We implement industry-standard security measures including:
- Encrypted connections (TLS 1.3)
- Secure authentication (OAuth 2.0)
- Regular security audits
- Access controls and logging

## Children's Privacy

Our service is not directed to children under 16. We do not knowingly collect
data from children.

## Changes to This Policy

We may update this policy periodically. Changes will be posted with a new
"Last updated" date.

## Contact Us

For privacy questions: privacy@yourapp.com
For support: support@yourapp.com
```

**Step 7.3: Run Pre-Submission Checklist**

```bash
# In Shopify Partner Dashboard, run automated checks:
# - OAuth implementation verified
# - GDPR webhooks registered
# - Privacy policy URL accessible
# - App works in test store
# - Performance tests passed

# Manual checklist:
```

- ✅ App name doesn't include "Shopify"
- ✅ App icon is 1200x1200, no Shopify logo
- ✅ Screenshots don't show myshopify.com URLs
- ✅ Clear pricing information
- ✅ Support email and documentation links
- ✅ Privacy policy accessible
- ✅ GDPR webhooks respond correctly
- ✅ Performance impact <10 Lighthouse points
- ✅ API responses <500ms (95th percentile)
- ✅ App works on OS 2.0 themes
- ✅ Mobile responsive
- ✅ Polaris design system used
- ✅ Error handling implemented
- ✅ Loading states for async actions

**Step 7.4: Submit for Review**

1. In Partner Dashboard, go to your app
2. Click "Create app listing"
3. Fill in all required fields
4. Upload assets (icon, screenshots)
5. Add app testing information:
   - Test store URL
   - Test credentials
   - Performance test screenshots
   - Feature walkthrough
6. Submit for review
7. Wait for Shopify review (typically 2 weeks)
8. Address any feedback from reviewers
9. Resubmit if changes requested
10. Approval and publication!

---

## Post-Migration Considerations

### Data Migration from Current System

For existing users on your theme-based wishlist:

```javascript
// Create migration endpoint
app.post('/api/migrate', async (req, res) => {
  const { session } = await shopify.authenticate.admin(req, res);

  // Fetch all customers
  const customers = await fetchAllCustomers(session);

  for (const customer of customers) {
    // Check old metafield namespace
    const oldWishlist = await fetchMetafield(session, customer.id, 'wishlist', 'items');

    if (oldWishlist) {
      // Migrate to new app namespace
      await createMetafield(session, customer.id, 'app_wishlist', 'items', oldWishlist);

      // Optionally delete old metafield
      // await deleteMetafield(session, customer.id, 'wishlist', 'items');
    }
  }

  res.json({ success: true, migratedCount: customers.length });
});
```

### Backwards Compatibility

During transition period, support both systems:

```javascript
// In theme extension JavaScript
async function loadWishlist() {
  let wishlist = [];

  // Try new app API first
  try {
    const response = await fetch('/apps/wishlist/api/get');
    wishlist = await response.json();
  } catch (e) {
    // Fallback to old App Proxy API
    try {
      const response = await fetch('/apps/wishlist/proxy/api/wishlist/get');
      wishlist = await response.json();
    } catch (e2) {
      // Fallback to localStorage only
      wishlist = JSON.parse(localStorage.getItem('theme-wishlist-cache') || '[]');
    }
  }

  return wishlist;
}
```

### Monitoring & Analytics

Set up monitoring for production:

```javascript
// Use Sentry for error tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Use Shopify's built-in analytics
app.post('/api/track-event', async (req, res) => {
  const { event, properties } = req.body;

  await shopify.analytics.trackEvent({
    event,
    properties,
  });
});

// Examples:
// trackEvent('wishlist_item_added', { productId, customerId })
// trackEvent('wishlist_to_cart', { productId, customerId })
// trackEvent('wishlist_shared', { customerId, shareMethod })
```

---

## Cost Estimation

### Development Costs

**DIY Development:**
- Time: 6-8 weeks (full-time)
- Skills needed: React/Node.js, Shopify APIs, Liquid, GraphQL
- Cost: Your time

**Hire Developer:**
- Freelancer: $5,000 - $15,000
- Agency: $15,000 - $40,000
- Depends on: Feature complexity, testing rigor, design quality

### Ongoing Costs

**Hosting:**
- Shopify Oxygen (Remix): Included with Shopify Partners
- Vercel: $20/month (Pro plan)
- Railway: $5-20/month
- AWS/DigitalOcean: $20-50/month

**Database:**
- Supabase: Free tier (good for start)
- PlanetScale: Free tier (MySQL)
- Heroku Postgres: $9/month
- AWS RDS: $15-50/month

**Monitoring:**
- Sentry: Free tier (5k events/month)
- LogRocket: $99/month (optional)
- Datadog: $15-31/host/month

**Total Monthly Costs:** $20-150/month

### Revenue Potential

Based on Shopify App Store averages:

**Conservative Estimate:**
- 100 active installations
- 30% on paid plans (avg $9.99/month)
- Revenue: $300/month
- After Shopify's 20% cut: $240/month

**Moderate Growth (Year 1):**
- 500 installations
- 40% on paid plans
- Revenue: $2,000/month
- After Shopify cut: $1,600/month

**Successful App (Year 2):**
- 2,000 installations
- 50% on paid plans
- Revenue: $10,000/month
- After Shopify cut: $8,000/month

---

## Critical Differences Summary

| Aspect | Current (Theme) | New (Shopify App) |
|--------|----------------|-------------------|
| **Installation** | Manual theme editing | App Store, one-click install |
| **Scope** | Single store | Multi-store, any merchant |
| **Updates** | Manual deployment | Automatic via App Store |
| **UI Integration** | Hardcoded Liquid | App Blocks (merchant configurable) |
| **Backend** | Custom server (Render) | Shopify-hosted or external |
| **Authentication** | Custom OAuth | Token exchange / Shopify managed |
| **Billing** | No billing | Shopify Billing API |
| **Privacy** | Basic | GDPR webhooks + privacy policy |
| **Performance** | No requirements | <500ms, Lighthouse impact <10pts |
| **Support** | Direct to you | Via App Store support system |
| **Discovery** | Word of mouth | Shopify App Store search |
| **Revenue** | None (theme feature) | Subscription-based |

---

## Recommended Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Setup & Auth** | Week 1 | App created, OAuth working, dev environment |
| **Backend Migration** | Week 2-3 | API endpoints, GDPR webhooks, session storage |
| **Theme Extensions** | Week 3-4 | App blocks, heart button, wishlist page |
| **Admin UI** | Week 4-5 | Dashboard, settings, analytics |
| **Billing** | Week 5-6 | Subscription plans, billing flow |
| **Testing** | Week 6-7 | Performance, E2E, load testing |
| **App Store Prep** | Week 7-8 | Listing, documentation, submission |
| **Review & Launch** | Week 8-10 | Address feedback, go live |

**Total: 8-10 weeks**

---

## Next Steps

### Immediate Actions (This Week):

1. **Decide on tech stack:**
   - Shopify Remix (recommended) or Node.js Express
   - Hosting platform (Vercel, Railway, or Oxygen)
   - Database (if needed beyond metafields)

2. **Set up Shopify Partner account:**
   - Create developer account at partners.shopify.com
   - Create app in Partner Dashboard
   - Get API credentials

3. **Set up development store:**
   - Create development store for testing
   - Install your current theme
   - Prepare test data

4. **Install Shopify CLI:**
   ```bash
   npm install -g @shopify/cli @shopify/app
   shopify version # Verify installation
   ```

5. **Review your current code:**
   - Identify reusable components
   - Plan data migration strategy
   - Document any custom features

### Questions to Answer:

1. **Monetization:**
   - Will you charge for the app?
   - What pricing tiers? (Free/Basic/Pro)
   - What features are premium?

2. **Scope:**
   - Start with core features or full feature parity?
   - Phase 1: Basic wishlist + sync
   - Phase 2: Analytics, multiple lists, etc.

3. **Support:**
   - How will you handle merchant support?
   - Documentation strategy?
   - Support email/ticketing system?

4. **Development:**
   - DIY or hire developer?
   - Timeline flexibility?
   - Budget constraints?

---

## Resources

### Official Documentation
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Theme App Extensions](https://shopify.dev/docs/apps/online-store/theme-app-extensions)
- [App Store Requirements](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [GDPR Compliance](https://shopify.dev/docs/apps/store/data-protection/gdpr)
- [Billing API](https://shopify.dev/docs/apps/billing)

### Tutorials
- [Build a Shopify App with Remix](https://shopify.dev/docs/apps/getting-started/build-app-example)
- [Theme App Extensions Tutorial](https://shopify.dev/tutorials/build-a-theme-app-extension)
- [OAuth Guide](https://shopify.dev/docs/apps/auth/oauth)

### Community
- [Shopify Community Forums](https://community.shopify.com/c/shopify-apps/bd-p/shopify-apps)
- [Shopify Partners Slack](https://shopify.dev/community)
- [GitHub - Shopify](https://github.com/Shopify)

### Tools
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Polaris (Design System)](https://polaris.shopify.com/)
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge)
- [GraphiQL Explorer](https://shopify.dev/docs/apps/tools/graphiql-admin-api)

---

## Conclusion

Converting your wishlist from a theme-based solution to a Shopify App is a significant undertaking, but it opens up tremendous opportunities:

**Benefits:**
- ✅ Reach thousands of merchants via App Store
- ✅ Recurring revenue stream
- ✅ Automatic updates and distribution
- ✅ Better user experience (app blocks vs manual installation)
- ✅ Scalable architecture
- ✅ Compliance with privacy regulations

**Challenges:**
- ⚠️ Steeper learning curve (Shopify App ecosystem)
- ⚠️ More requirements (GDPR, performance, billing)
- ⚠️ App Store review process
- ⚠️ Ongoing maintenance and support

**Is it worth it?**

If you want to:
- Monetize your wishlist solution
- Help multiple merchants (not just one store)
- Build a sustainable business
- Learn Shopify app development

**Then YES, absolutely!**

Your current implementation is already sophisticated and well-architected. The migration primarily involves:
1. Restructuring for multi-store support
2. Adding App Store compliance (GDPR, billing, performance)
3. Converting theme code to app blocks
4. Building an admin interface

The core functionality (heart buttons, sync, quick-add) remains largely the same.

---

**Good luck with your migration! Feel free to ask if you need clarification on any section.**
