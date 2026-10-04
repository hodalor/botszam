# Deploying botszam

Frontend → **Netlify**. API → **Render**. Database → **MongoDB Atlas**.

Cross-site cookies need HTTPS on both sides. In production the API always sets the auth cookie with `SameSite=None; Secure`.

---

## 1. MongoDB Atlas

1. Create a cluster (or use an existing one) and a database user with a strong password.
2. **Network Access → Add IP Address → Allow Access from Anywhere** (`0.0.0.0/0`).  
   Render’s outbound IPs are dynamic on the free/starter plans, so Atlas must accept all IPs (or you later pin a static egress IP on a paid Render plan).
3. Copy the connection string, e.g.  
   `mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/botszam?retryWrites=true&w=majority`  
   Use a real database name (`botszam`) in the path.

---

## 2. Backend on Render

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub/GitLab.
2. In Render: **New → Blueprint** → select the repo. It reads `render.yaml` (`rootDir: backend`).
3. Fill in the `sync: false` env vars when prompted (see table below).
4. Deploy. Note the public URL, e.g. `https://botszam.onrender.com`.

### Option B — Manual Web Service

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Render injects `PORT`; the app listens on `process.env.PORT` (bound to `0.0.0.0`) and sets `trust proxy` so rate limiting sees real client IPs behind Render’s proxy.

### API environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `PORT` | optional | Render sets this; Blueprint may set `10000` |
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | ≥32 random characters |
| `JWT_EXPIRES_IN` | optional | default `7d` |
| `COOKIE_SAMESITE` | optional | set `none` for clarity; production always uses `none` + `Secure` |
| `FRONTEND_URL` | yes | Exact Netlify origin, **no trailing slash**, e.g. `https://botszam.netlify.app` |
| `CLOUDINARY_CLOUD_NAME` | for uploads | Product image uploads |
| `CLOUDINARY_API_KEY` | for uploads | |
| `CLOUDINARY_API_SECRET` | for uploads | |
| `ORDER_PREFIX` | optional | default `BTZ` |
| `ADMIN_NAME` | seed only | e.g. `Botszam Admin` |
| `ADMIN_EMAIL` | seed only | e.g. `admin@botszam.com` |
| `ADMIN_PHONE` | seed only | Zambian mobile, e.g. `0970000000` |
| `ADMIN_PASSWORD` | seed only | Temporary; change after first login |

CORS allows **only** `FRONTEND_URL` (with credentials).

### Seed production once

After the first successful deploy (with `ADMIN_*` set):

1. Open the service → **Shell**.
2. Run:

```bash
npm run seed:prod
```

That uses the compiled `dist/scripts/seed.js` (no `tsx` needed in production). It upserts the admin user, delivery zones, settings, and sample products.

3. Sign in at `https://YOUR-NETLIFY-SITE/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. **Change the admin password immediately** in the Render shell (the storefront account page does not change the admin password):

```bash
NEW_ADMIN_PASSWORD='your-new-strong-password' npm run set-admin-password:prod
```

5. Remove `ADMIN_PASSWORD` (and `NEW_ADMIN_PASSWORD` if you set it) from Render env vars after you no longer need to re-seed.

Smoke test against production (optional, creates real orders — use carefully):

```bash
API_URL=https://YOUR-API.onrender.com/api npm run smoke -- --force
```

---

## 3. Frontend on Netlify

1. **New site from Git** → select this repo.
2. Build settings (also in `frontend/netlify.toml`):

| Setting | Value |
| --- | --- |
| Base directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `frontend/dist` (or `dist` if base is `frontend`) |

The `[[redirects]]` rule rewrites all paths to `index.html` for React Router (SPA).

3. **Site settings → Environment variables**:

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_API_URL` | yes | `https://botszam.onrender.com/api` |
| `VITE_SITE_URL` | recommended | `https://botszam.netlify.app` (canonical / Open Graph) |

4. Deploy. Copy the Netlify URL.
5. Go back to Render and set `FRONTEND_URL` to that exact origin (no trailing slash), then **redeploy the API** so CORS picks it up.

---

## 4. Post-deploy checklist

- [ ] `GET https://YOUR-API.onrender.com/api/health` → `{ "status": "ok", "database": "connected", ... }`
- [ ] Storefront loads products from the API (Network tab → `/api/products`)
- [ ] Guest checkout + mobile money payment page works
- [ ] `/admin/login` works with the seeded admin; cookie is set (`botszam_token`, Secure, SameSite=None)
- [ ] Admin password changed; `ADMIN_PASSWORD` removed from Render if unused
- [ ] Cloudinary credentials set if you will upload product images in admin
- [ ] Update Settings (WhatsApp, mobile money numbers) away from seed placeholders before taking real orders

---

## 5. Local ↔ production notes

- Local API: `COOKIE_SAMESITE=lax`, `FRONTEND_URL=http://localhost:5173`.
- Production: Netlify and Render are different sites → cookies must be `SameSite=None; Secure` (enforced when `NODE_ENV=production`).
- Free Render services spin down after idle traffic; the first request after sleep can take ~30–60s.
- Never commit `.env`. Use Atlas + Render + Netlify dashboards for secrets.

---

## Quick command reference

```bash
# Backend (from /backend)
npm ci && npm run build && npm start
npm run seed:prod          # production shell, after build

# Frontend (from /frontend)
VITE_API_URL=https://YOUR-API.onrender.com/api npm run build
```
