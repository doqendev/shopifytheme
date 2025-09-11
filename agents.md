# Wishlist app agent instructions

This document summarizes what has been accomplished in the current session to build a wishlist feature for a Shopify store and outlines next steps for the **codex** agent to continue the work. The project consists of a **Node/Express API** running behind a Shopify **App Proxy** and a set of **theme modifications** to enable a wishlist icon, popup modal and wishlist page in the storefront.  

## Current progress

### API (server side)

- A Node/Express application (folder `server/`) has been created to serve wishlist data.  
- **Dependencies**: `express`, `sqlite3`, `dotenv`, `body‑parser`, and `cross-env` (for portable script).  
- A `.env` file defines `PORT=5055`, `APP_SECRET=<your Shopify app secret>`, `SQLITE_PATH=./wishlist.sqlite` and `APP_PROXY_MODE=sha256`.  
- The database schema uses a table `wishlist` with columns: `shop_domain`, `customer_id`, `product_id`, `variant_id` (default empty string), `handle`, `title`, `image` and timestamps.  The `UNIQUE` constraint is on `(shop_domain, customer_id, product_id, variant_id)` — **no expressions** are used in the constraint, so SQLite does not throw an error.  
- Routes are exposed under `/proxy/wishlist` (GET, POST, DELETE) and require:
  - A valid **App Proxy signature** (HMAC‑SHA256 or MD5 as configured) on query parameters.  
  - A `logged_in_customer_id` parameter injected by Shopify, which becomes `req.customerId`.  If missing, the server returns HTTP 401.  
- The server is running locally on port 5055 and exposed via **ngrok**.  The public ngrok URL (e.g., `https://1234.ngrok.app`) is configured as the Proxy URL in the Shopify Partner Dashboard (`https://cheyenne.pt/apps/wishlist` → forwards to `https://1234.ngrok.app/proxy/wishlist`).

### Theme modifications (front end)

- A **heart icon** overlay is added on each product card and optionally on the product page.  This is implemented with a Liquid snippet `snippets/wishlist-heart.liquid` that renders an `<button>` containing an SVG heart and data attributes for `product_id`, `variant_id`, `handle`, `title`, and `image`.
- A **login modal** is provided via `snippets/wishlist-login-modal.liquid`.  It is hidden by default and shown when an unauthenticated user clicks the heart.
- Two asset files were added:
  - `assets/wishlist.css` contains styles for the heart button (sizes, colours, transitions), overlay positioning and modal layout.
  - `assets/wishlist.js` contains the logic to fetch the wishlist, update heart state, add/remove items via `POST`/`DELETE` to `/apps/wishlist`, and show the login modal on 401 responses.  It uses the same‑origin app proxy; no customer id is sent from the client.
- The main layout (`layout/theme.liquid`) is updated to include the CSS/JS assets and render the login modal snippet.
- Product card templates (e.g. `snippets/card-product.liquid`) are modified to wrap their image container in a relatively positioned wrapper and render the heart snippet inside a `.il-wishlist-overlay` div.
- An optional overlay is added on the product detail page (`sections/main-product.liquid`).
- A **wishlist page** is added:
  - `sections/wishlist-page.liquid` fetches saved items via JS (`GET /apps/wishlist`) and lists them in a grid.
  - `templates/page.wishlist.json` (or `.liquid` if not using JSON templates) wires the wishlist section into a page.  The merchant can create a page named “Wishlist” and assign this template.

## Next steps for codex

1. **Verify theme integration**: confirm that each theme file exists and has the correct modifications.  Some themes differ in file names; adjust the injection point of the heart snippet accordingly.  
2. **Ensure the ngrok tunnel is stable**: if the public URL changes, update the Proxy URL in the Partner Dashboard and the `.env` file (for logging).  Consider using a paid ngrok domain to avoid frequent updates.  
3. **Test user flows**:
   - Without logging in, clicking the heart should trigger the login modal.  
   - After logging in, the heart should fill/unfill when toggled, and items should appear on the wishlist page.  
   - Reloading the collection page should reflect saved items correctly (hearts stay filled).  
4. **Refactor for deployment**: plan to host the server on a public domain (e.g., a small VPS or serverless function) rather than ngrok.  The Proxy URL must point to that service.  
5. **Polish UI/UX**: adapt colours and sizing to fit the store’s branding.  Translate modal text if required.  Add loading states or animations if desired.  
6. **Optional features**: consider localStorage caching, variant‑specific behaviour (if variants are not needed, remove variant handling), or multi-store persistence by adding `shop_domain` to query filters.  

These instructions should help the codex agent pick up where this session left off and continue refining or deploying the wishlist feature.
