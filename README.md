# 🧠 Chai Vibe Editor — AI Browser IDE

[![CI](https://github.com/ykstorm/chai-vibe-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/ykstorm/chai-vibe-editor/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/docker/v/ykstorm/chai-vibe-editor?label=docker&sort=semver)](https://github.com/ykstorm/chai-vibe-editor/pkgs/container/chai-vibe-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Chai Vibe Editor** is a blazing-fast, AI-integrated web IDE built entirely in the browser using Next.js 15, WebContainers, Monaco Editor, and local LLMs via Ollama. It offers real-time code execution, an AI-powered chat assistant, and support for multiple tech stacks — all wrapped in a stunning developer-first UI.

---

## 🚀 Features

- 🔐 **OAuth Login** — Google & GitHub via NextAuth v5
- 🎨 **Modern UI** — TailwindCSS v4 & ShadCN UI components
- 🌗 **Dark/Light Mode** — Seamless theme switching
- 🧱 **Project Templates** — React, Next.js, Express, Hono, Vue, Angular
- 🗂️ **File Explorer** — Create, rename, delete files and folders
- 🖊️ **Monaco Editor** — Syntax highlighting, formatting, keybindings, AI autocomplete
- 💡 **AI Suggestions** — Local LLMs via Ollama with `Ctrl+Space` or double `Enter`
- ⚙️ **WebContainers** — Run frontend/backend apps entirely in-browser
- 💻 **Terminal** — Interactive xterm.js terminal emulator
- 🤖 **AI Chat** — 4-mode assistant: chat, review, fix, optimize

---

## 🛠️ Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Fill in AUTH_SECRET, AUTH_GITHUB_*, AUTH_GOOGLE_*
docker compose up -d
```

Visit `http://localhost:3000`

### Local Development

```bash
npm install
cp .env.example .env.local
# Fill in environment variables
npm run dev
```

---

## 🧱 Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Framework   | Next.js 15 (App Router, Turbopack)            |
| Styling     | TailwindCSS v4, ShadCN UI, Radix UI           |
| Language    | TypeScript 5                                  |
| Auth        | NextAuth v5 (Google + GitHub OAuth)          |
| Editor      | Monaco Editor                                 |
| AI          | Ollama (local LLMs: codellama, etc.)          |
| Runtime     | WebContainers (browser-native Node.js)        |
| Terminal    | xterm.js + Addons                             |
| Database    | MongoDB (Prisma ORM)                         |
| Container   | Docker, Docker Compose                       |
| CI/CD       | GitHub Actions                                |

---

## 🔑 Key Features in Detail

### Docker Compose Setup

The project includes a production-ready `docker-compose.yml` with:
- **app** — Next.js application (port 3000)
- **ollama** — Local LLM inference server (port 11434)
- **mongodb** — Document database (port 27017)

### Health Endpoint

`GET /api/health` returns `{ status: "ok", timestamp }` for load balancer health checks.

### Rate Limiting

AI endpoints (`/api/chat`, `/api/code-completion`) are rate-limited to 20 requests/minute per IP using a sliding window algorithm.

### Environment Validation

On startup, the app validates required environment variables. Ollama connectivity issues are logged as warnings but do not crash the app.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.