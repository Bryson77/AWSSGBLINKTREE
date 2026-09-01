# AWS Student Builder Group (AWS SBG) — Monorepo

The official community portal and admin management system for the **AWS Student Builder Group (AWS SBG)**.

AWS SBG is an official student-led community affiliated with, powered by, and supported by **Amazon Web Services (AWS)** across 60+ countries worldwide.

---

## 🏗️ Monorepo Architecture

This monorepo is structured using **npm workspaces**:

```
AWSSGBLINKTREE/
├── apps/
│   ├── web/           # Public Student Hub (https://awssbg.online)
│   └── admin/         # Standalone Admin Portal (https://admin.awssbg.online)
├── packages/
│   └── shared/        # Shared types, Supabase client, SVG icon mappings
└── package.json       # Monorepo root scripts & workspace configurations
```

---

## 🚀 Quick Start & Local Development

Install dependencies from the repository root:
```bash
npm install
```

Start applications locally:
* **Public Hub (`http://localhost:3000`):** `npm run dev:web`
* **Admin Portal (`http://localhost:3001`):** `npm run dev:admin`

---

## ⚡ Cloudflare Pages & Wrangler Deployments

Each sub-application is configured for standalone static export and deployment via **Wrangler** to Cloudflare Pages.

### CLI Direct Deployments
```bash
# Build & Deploy Public Site (awssbg-linktree -> awssbg.online)
npm run deploy:web

# Build & Deploy Admin Console (awssbg-admin -> admin.awssbg.online)
npm run deploy:admin

# Deploy Both Simultaneously
npm run deploy:all
```

### Cloudflare Dashboard Git CI/CD Settings

| Setting | `awssbg-linktree` (Public) | `awssbg-admin` (Admin) |
| :--- | :--- | :--- |
| **Framework Preset** | `None` | `None` |
| **Build Command** | `npm run build:web` | `npm run build:admin` |
| **Build Output Directory** | `apps/web/out` | `apps/admin/out` |
| **Root Directory** | `/` (root) | `/` (root) |

---

## 🤖 AI & LLM Scraping Integration

The public hub is optimized for modern AI search engines, web scrapers, and Large Language Models:
* **`llms.txt` & `llms-full.txt`:** Context files adhering to the `/llms.txt` standard for AI agents (ChatGPT, Claude, Perplexity).
* **Robots Permissions:** Explicit allow directives for AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Amazonbot`).
* **Schema.org Structured Data:** Embedded JSON-LD schema declaring `EducationalOrganization` and `WebSite` metadata.

---

## 🛡️ Brand & Legal Compliance
* **Official Affiliation:** Supported by and affiliated with Amazon Web Services (AWS).
* **Zero Data Sale:** Personal data is strictly never sold, rented, or commercialized.
* **Branding:** Refer to the site solely as **AWS SBG site** or **AWS Student Builder Group**.
