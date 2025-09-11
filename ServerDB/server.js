import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- ENV ----------
const PORT = process.env.PORT || 5055;
const APP_SECRET = process.env.APP_SECRET || "";
const SQLITE_PATH = process.env.SQLITE_PATH || path.join(__dirname, "wishlist.sqlite");
const APP_PROXY_MODE = (process.env.APP_PROXY_MODE || "sha256").toLowerCase();

if (!APP_SECRET) {
  console.error("ERROR: APP_SECRET is missing in .env");
  process.exit(1);
}

// ---------- APP ----------
const app = express();

// App Proxy encaminha query params e preserva body (JSON/form)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------- SQLite ----------
const db = new sqlite3.Database(SQLITE_PATH);
db.serialize(() => {
  db.run(`
CREATE TABLE IF NOT EXISTS wishlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_domain TEXT NOT NULL,
  customer_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL DEFAULT '',
  handle TEXT,
  title TEXT,
  image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_domain, customer_id, product_id, variant_id)
);

  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_wishlist_shop_customer ON wishlist (shop_domain, customer_id)`);
});

// ---------- Helpers ----------
/**
 * Normaliza os parâmetros de query do App Proxy.
 * O App Proxy inclui: shop, path_prefix, timestamp, signature, e (se autenticado) logged_in_customer_id.
 */
function getProxyParams(req) {
  // Clonar query (req.query pode conter arrays dependendo da plataforma)
  const qs = {};
  for (const k of Object.keys(req.query || {})) {
    const v = req.query[k];
    qs[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  return qs;
}

/**
 * Verifica a assinatura do App Proxy.
 * sha256 (moderno): HMAC-SHA256 (APP_SECRET, string de pares ordenados k=v concatenados sem delimitadores)
 * md5 (legacy): md5(APP_SECRET + concatenatedQueryWithoutSignature)
 */
function verifyAppProxySignature(req) {
  const qs = getProxyParams(req);
  const signature = qs.signature;
  if (!signature) return false;

  // Remover 'signature' antes de calcular
  delete qs.signature;

  // String de pares ordenados por chave: k=v (sem &), alinhado com comportamento clássico
  const sortedPairs = Object.keys(qs)
    .sort()
    .map((k) => `${k}=${qs[k]}`)
    .join("");

  if (APP_PROXY_MODE === "sha256") {
    const digest = crypto.createHmac("sha256", APP_SECRET).update(sortedPairs).digest("hex");
    if (digest === signature) return true;

    // fallback opcional: tenta legacy md5 se sha256 falhar (útil em configs mistas)
    const md5digest = crypto.createHash("md5").update(APP_SECRET + sortedPairs).digest("hex");
    if (md5digest === signature) return true;

    return false;
  }

  if (APP_PROXY_MODE === "md5") {
    const md5digest = crypto.createHash("md5").update(APP_SECRET + sortedPairs).digest("hex");
    if (md5digest === signature) return true;

    // fallback opcional: tenta sha256
    const digest = crypto.createHmac("sha256", APP_SECRET).update(sortedPairs).digest("hex");
    if (digest === signature) return true;

    return false;
  }

  // modo desconhecido
  return false;
}

function requireValidProxy(req, res, next) {
  if (!verifyAppProxySignature(req)) {
    return res.status(401).send("Invalid proxy signature");
  }
  next();
}

function requireLoggedCustomer(req, res, next) {
  const { shop, logged_in_customer_id } = getProxyParams(req);
  if (!shop) return res.status(400).json({ error: "Missing shop" });

  if (!logged_in_customer_id) {
    // não autenticado na loja
    return res.status(401).json({ error: "Not logged in" });
  }

  const cid = parseInt(String(logged_in_customer_id), 10);
  if (Number.isNaN(cid)) return res.status(400).json({ error: "Invalid customer id" });

  req.shopDomain = String(shop);
  req.customerId = cid;
  next();
}

// ---------- Routes (App Proxy) ----------
// No Partner Dashboard, define Proxy URL -> https://SEU-SERVIDOR/proxy
// Então, a rota pública /apps/wishlist endereça internamente para /proxy/wishlist

const router = express.Router();

// GET /proxy/wishlist  -> lista wishlist do cliente
router.get("/wishlist", requireValidProxy, requireLoggedCustomer, (req, res) => {
  db.all(
    `SELECT product_id, variant_id, handle, title, image, created_at
     FROM wishlist
     WHERE shop_domain = ? AND customer_id = ?
     ORDER BY created_at DESC`,
    [req.shopDomain, req.customerId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ items: rows || [] });
    }
  );
});

// POST /proxy/wishlist   body: { product_id, variant_id?, handle?, title?, image? }
router.post("/wishlist", requireValidProxy, requireLoggedCustomer, (req, res) => {
  const { product_id, variant_id = "", handle = "", title = "", image = "" } = req.body || {};
  if (!product_id) return res.status(400).json({ error: "product_id required" });

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO wishlist (shop_domain, customer_id, product_id, variant_id, handle, title, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    [req.shopDomain, req.customerId, String(product_id), String(variant_id), handle, title, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, inserted: this.changes > 0 });
    }
  );
});

// DELETE /proxy/wishlist?product_id=...&variant_id=...
router.delete("/wishlist", requireValidProxy, requireLoggedCustomer, (req, res) => {
  const { product_id = "", variant_id = "" } = getProxyParams(req);
  if (!product_id) return res.status(400).json({ error: "product_id required" });

  const stmt = db.prepare(
    `DELETE FROM wishlist
     WHERE shop_domain = ? AND customer_id = ? AND product_id = ? AND COALESCE(variant_id,'') = ?`
  );
  stmt.run(
    [req.shopDomain, req.customerId, String(product_id), String(variant_id)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true, removed: this.changes > 0 });
    }
  );
});

app.use("/proxy", router);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Wishlist server running on http://localhost:${PORT}`);
});
