# Weblegs Preorder Notify — App Overview

## What Does This App Do?

**Weblegs Preorder Notify** is a Shopify embedded app that collects customer email addresses for out-of-stock or upcoming products. When a customer submits their email via the storefront, the app captures it along with the product details. Merchants can then view and manage all preorder signups from inside Shopify Admin.

### Core Workflow
1. A customer on the storefront clicks a "Notify Me" or pre-order button on a product page
2. The storefront sends the customer's email and product details to the app's public API
3. The app saves the entry (email, SKU, product title, vendor) to the database
4. The merchant opens the app in Shopify Admin to view all collected preorder signups
5. Merchant can search and delete entries as needed

---

## App Pages

### 1. Preorder Dashboard (Main Page)
- Total entries count shown as a stats card
- Searchable table — filter by email, SKU, product title, or vendor
- Pagination — 50 entries per page
- Delete button per entry to remove individual signups
- Columns: Email, SKU, Product Title, Vendor, Date

---

## Public API Endpoint

This endpoint is called by the Shopify storefront — no authentication required.

| Endpoint | Method | What It Does |
|---------|--------|-------------|
| `/api/preorder` | `POST` | Accepts an email signup for a product and saves it to the database |

**POST body fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | Customer's email address |
| `title` | No | Product title |
| `vendor` | No | Product vendor/brand |
| `sku` | No | Product SKU |
| `shop` | No | Shop domain (auto-detected from request origin if not provided) |

---

## Tech Stack (For Developers)

| Component | Technology |
|----------|-----------|
| Framework | React Router v7 (Node.js) |
| Shopify Integration | Shopify Admin GraphQL API |
| Database | PostgreSQL (hosted on Railway) |
| ORM | Prisma |
| UI | Shopify Polaris Web Components |
| Build Tool | Vite |

---

## Database Tables

| Table | What It Stores |
|-------|---------------|
| Session | Shopify OAuth tokens |
| PreorderData | Customer email, SKU, product title, vendor, shop, date submitted |

---

## Key Files (For Developers)

```
app/
├── routes/
│   ├── app._index.jsx        — Main dashboard: preorder table, search, delete
│   ├── app.jsx               — App shell with nav
│   ├── api.preorder.jsx      — Public API: receives and stores preorder signups
│   ├── auth.$.jsx            — Shopify OAuth handler
│   └── webhooks.*            — Webhook handlers (uninstall, scopes update)
├── shopify.server.js         — Shopify app config and auth helpers
└── db.server.js              — Prisma client
prisma/
└── schema.prisma             — Database schema
```

---

## Shopify Permissions Required

| Permission | Reason |
|-----------|--------|
| `write_products` | Access product data within Shopify Admin |

---

## Hosting & Deployment

- **App URL:** `https://jadlamshopifyapppreordernotifier-production.up.railway.app`
- **Database:** PostgreSQL on Railway
- **Deploy:** Push to `main` branch on GitHub → Railway auto-deploys
- **Store:** `wljadlamracing.myshopify.com`
