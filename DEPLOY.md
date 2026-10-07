# Deploying Codecraft

Two modes:

1. Vercel: the fastest path to a live URL; the free tier is enough.
2. Self-hosted Docker: full control, with a MongoDB you own.

WebContainers need `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`
on every response. Those headers are defined once in `lib/security-headers.ts`
and applied by `next.config.ts`, so they ship in dev, on Vercel, and in the
Docker image without any extra config. A reverse proxy in front must not strip
them.

---

## Cross-origin headers

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

The first two are required: together they make the page cross-origin isolated
(`window.crossOriginIsolated`), which WebContainers need. The app also sends the
third, `Cross-Origin-Resource-Policy: cross-origin`, which lets other origins
embed its responses; it does not decide isolation.

Without COOP or COEP the playground does not try to boot. It shows a message that
names the two headers and the browsers that work
(`hooks/use-vite-webcontainer.ts`).

---

## 1. Vercel

1. Connect `github.com/ykstorm/codecraft-ai` to Vercel. No `vercel.json` is
   needed; the headers come from `next.config.ts`.
2. Env vars. The landing page and playground need none of these; sign-in needs
   all six, and without them `/dashboard`, `/settings`, `/auth/sign-in` and
   `/api/auth/*` answer a 503 page that says sign-in is not configured:
   - `AUTH_SECRET`: `openssl rand -base64 32`
   - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`: Google Cloud Console OAuth
   - `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`: GitHub OAuth app
   - `DATABASE_URL`: a MongoDB connection string, e.g. MongoDB Atlas (free tier)
3. OAuth redirect URIs:
   - Google: `https://<your-domain>/api/auth/callback/google`
   - GitHub: `https://<your-domain>/api/auth/callback/github`

Deploy, wait a couple of minutes, open the URL.

The public deployment at codecraft-ai-tau.vercel.app has none of these variables,
so it runs the playground only, with no sign-in and no database.

---

## 2. Self-hosted Docker

`docker-compose.yml` covers the app plus MongoDB. The bundled `mongodb` service
has no authentication and publishes port 27017 on the host, so it is for local
use. On a VPS, set `DATABASE_URL` to a MongoDB that requires auth (Atlas works)
and remove the `mongodb` service and the app's `depends_on` entry for it.

The image is built without secrets, and the landing page is static, so its
header has no dashboard link even when the variables are set at run time. The
sign-in gate itself reads the variables on every request, so `/dashboard` and
sign-in work once they are set.

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

1. Open the site; the landing page loads.
2. Open `/playground/vite-react-starter` without signing in; the IDE boots a
   WebContainer and shows the editor, terminal, and preview.
3. In the terminal: `npm install dayjs`; it installs.
4. Edit `src/App.jsx`; the preview hot-reloads.
5. Hit `/api/now`; JSON with today's date.

If the playground reports that cross-origin isolation is off, check the COOP and
COEP headers in DevTools, Network, on the main document's response.

---

## 4. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| "Cross-origin isolation is off" in the playground | COOP or COEP missing | Confirm both headers on the HTML document |
| "did not start within 60 s" in the playground | The boot frame from stackblitz.com did not load | Allow stackblitz.com, *.staticblitz.com and *.webcontainer-api.io in content blockers, VPNs and proxies |
| Service Worker won't register | `http://` not `https://` | WebContainers refuse non-HTTPS in production |
| OAuth callback error | Wrong redirect URI registered | Match the OAuth app's URI to the deployed URL |
| MongoDB "auth failed" | Wrong connection string | URL-encode the user + password |
