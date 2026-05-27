# Deploying Codecraft

Two modes:
1. **Vercel** — fastest path to a live URL, free tier supports it
2. **Self-hosted Docker** — full control, MongoDB + Ollama you own

WebContainers need specific HTTP headers (Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy) — Vercel needs these added via `vercel.json`, self-hosted needs them in Caddy/Nginx.

---

## Required HTTP headers

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

These enable `SharedArrayBuffer` which WebContainers need. Missing any of them = WebContainer silently fails to boot with no clear error.

---

## 1. Vercel deploy

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Resource-Policy", "value": "cross-origin" }
      ]
    }
  ]
}
```

Steps:
1. Connect `github.com/ykstorm/codecraft-ai` to Vercel
2. Env vars:
   - `AUTH_SECRET` — run `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — Google Cloud Console OAuth
   - `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — GitHub OAuth app
   - `MONGODB_URI` — MongoDB Atlas (free tier)
   - `OLLAMA_BASE_URL` — your Ollama instance OR a hosted model gateway URL
3. Custom domain: `codecraft.lakshyaraj.dev`
4. OAuth redirect URIs:
   - Google: `https://codecraft.lakshyaraj.dev/api/auth/callback/google`
   - GitHub: `https://codecraft.lakshyaraj.dev/api/auth/callback/github`

Deploy. Wait ~2 min. Visit URL.

**Note on Ollama in production:** Vercel doesn't run Ollama. Options:
- Self-host Ollama on a small EC2 / Hetzner / Fly machine, point `OLLAMA_BASE_URL` at it
- Use a hosted Ollama proxy (e.g. fly-hosted Ollama instance)
- Swap to OpenAI/Anthropic via a one-line client change (v0.3 roadmap makes this configurable)

---

## 2. Self-hosted Docker

Existing docker-compose.yml already covers app + MongoDB + Ollama. To deploy to a single host (VPS):

```bash
# On a fresh Ubuntu VPS
ssh root@your-vps
apt update && apt install -y docker.io docker-compose-plugin git
git clone https://github.com/ykstorm/codecraft-ai && cd codecraft-ai
cp .env.example .env
# Edit .env with prod secrets

# Optional: put Caddy in front for TLS + the COOP/COEP/CORP headers
cat > /etc/caddy/Caddyfile <<EOF
codecraft.lakshyaraj.dev {
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

Resources: ~2 GB RAM for the app + Ollama + MongoDB. Hetzner CX21 ($5/mo) is the sweet spot.

---

## 3. Smoke test after deploy

1. Open https://codecraft.lakshyaraj.dev — landing loads
2. Sign in with Google or GitHub
3. Open the playground
4. WebContainer must boot — you see the file tree and a terminal prompt
5. In the terminal: `npm init -y && npm install express`
6. Create a file `server.js` with `console.log('hello')`
7. Run `node server.js` — output appears in terminal
8. Open the AI chat sidebar, switch to "Chat" mode, ask "What does this code do?" — Ollama responds

If any step fails, the most likely culprit is the COOP/COEP/CORP headers. Check browser DevTools → Network → response headers on the main HTML doc.

---

## 4. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| WebContainer silently doesn't boot | Missing COOP/COEP/CORP | Add headers (see top of this doc) |
| Service Worker won't register | http:// (not https://) | WebContainers refuse non-HTTPS in production |
| OAuth callback error | Wrong redirect URI registered | Update OAuth app settings with exact prod URL |
| Ollama "connection refused" | Wrong `OLLAMA_BASE_URL` | Verify Ollama is reachable from the app container/runtime |
| MongoDB "auth failed" | Wrong connection string | Verify user + password URL-encoded |
| IndexedDB quota exceeded | User has many big files saved | Surface a "manage projects" UI to delete old projects |

---

## 5. Production hardening checklist

- [ ] OAuth secrets in Vercel env vars (not committed)
- [ ] MongoDB Atlas IP allowlist locked to Vercel's egress (or use VPC peering)
- [ ] Rate limits on `/api/auth` and `/api/projects` (use upstash-redis adapter)
- [ ] Sentry DSN set for error capture
- [ ] Plausible / Vercel Analytics for traffic
- [ ] CSP header (in addition to COOP/COEP/CORP)
- [ ] Periodic IndexedDB quota audit per user

---

## 6. Launch

After live URL works:
- LinkedIn (linkedin-post.md Variant A)
- X (Variant C)
- Show HN: "Codecraft — real Node.js in your browser, OSS"
- Vercel community
- Reddit r/webdev
