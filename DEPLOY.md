# Deploying Codecraft

Two modes:

1. **Vercel** — fastest path to a live URL; the free tier is enough.
2. **Self-hosted Docker** — full control, with a MongoDB you own.

WebContainers need `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`
on every response. Those headers are defined once in `lib/security-headers.ts`
and applied by `next.config.ts`, so they ship in dev, on Vercel, and in the
Docker image without any extra config. A reverse proxy in front must not strip
them.

---

## Required HTTP headers

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

Missing any of them and the WebContainer silently fails to boot with no clear
error.

---

## 1. Vercel

1. Connect `github.com/ykstorm/codecraft-ai` to Vercel. No `vercel.json` is
   needed — the headers come from `next.config.ts`.
2. Env vars (the landing page and playground need none of these; they gate only
   `/dashboard`, `/settings`, and the auth callbacks):
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — Google Cloud Console OAuth
   - `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` — GitHub OAuth app
   - `DATABASE_URL` — MongoDB Atlas (free tier) or any Prisma-supported DB
3. OAuth redirect URIs:
   - Google: `https://<your-domain>/api/auth/callback/google`
   - GitHub: `https://<your-domain>/api/auth/callback/github`

Deploy, wait a couple of minutes, open the URL.

---

## 2. Self-hosted Docker

`docker-compose.yml` covers the app plus MongoDB.

```bash
# On a fresh Ubuntu VPS
apt update && apt install -y docker.io docker-compose-plugin git
git clone https://github.com/ykstorm/codecraft-ai && cd codecraft-ai
cp .env.example .env
# Edit .env with prod secrets (AUTH_SECRET, OAuth, DATABASE_URL)

# Optional: put Caddy in front for TLS + the COOP/COEP/CORP headers
cat > /etc/caddy/Caddyfile <<EOF
your-domain {
  reverse_proxy localhost:3000
  header {
    Cross-Origin-Opener-Policy "same-origin"
    Cross-Origin-Embedder-Policy "require-corp"
    Cross-Origin-Resource-Policy "cross-origin"
  }
}
EOF

docker compose up -d
```

---

## 3. Smoke test after deploy

1. Open the site — the landing page loads.
2. Open `/playground/vite-react-starter` without signing in — the IDE boots a
   WebContainer and shows the editor, terminal, and preview.
3. In the terminal: `npm install dayjs` — it installs.
4. Edit `src/App.jsx` — the preview hot-reloads.
5. Hit `/api/now` — JSON with today's date.

If the WebContainer never boots, the most likely culprit is the COOP/COEP/CORP
headers — check DevTools → Network → the main document's response headers.

---

## 4. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| WebContainer silently doesn't boot | Missing COOP/COEP/CORP | Confirm the headers on the HTML document |
| Service Worker won't register | `http://` not `https://` | WebContainers refuse non-HTTPS in production |
| OAuth callback error | Wrong redirect URI registered | Match the OAuth app's URI to the deployed URL |
| MongoDB "auth failed" | Wrong connection string | URL-encode the user + password |
