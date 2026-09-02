# 🛑 DO_NOT_TOUCH.md — ARCHITECTURE & CORE GOVERNANCE

> **STRICT NOTICE FOR ALL DEVELOPERS AND AGENTS:**
> This document defines the immutable architecture, security invariants, build systems, and deployment commands for the **AWS Student Builder Group (SBG)** platform. 
> Every rule in this document is non-negotiable. **DO NOT DEVIATE, MODIFY, OR REMOVE THESE INVARIANTS.**

---

## 1. Monorepo Architecture & Topology

The project is an npm workspace monorepo structured into isolated application targets and shared packages:

```
AWSSGBLINKTREE/
├── apps/
│   ├── web/                     # Public Portal (Cloudflare Pages: awssbg-linktree)
│   │   ├── src/                 # Next.js App Router (Landing, About, Contact, Privacy, Terms)
│   │   ├── functions/api/       # Cloudflare Pages Functions (/api/inquiries)
│   │   └── wrangler.jsonc       # Pages configuration & public env vars
│   ├── admin/                   # Isolated Admin Portal (Cloudflare Pages: awssbg-admin)
│   │   ├── src/                 # Next.js App Router (Dashboard, /update-password gateway)
│   │   ├── functions/api/       # Cloudflare Pages Functions (/api/users, /api/notify-auth)
│   │   └── wrangler.jsonc       # Pages configuration & public env vars
│   └── email-worker/            # Standalone Cloudflare Worker (awssbg-email-worker)
│       ├── src/index.ts         # Direct Worker fallback endpoint
│       └── wrangler.jsonc       # Worker configuration & encrypted secrets
├── packages/
│   └── shared/                  # Shared types, Supabase client, and monochrome icon registry
│       └── src/
│           ├── types/           # LinkItem, Telemetry, Inquiry, User schemas
│           └── lib/             # Supabase singleton & react-icons mapper
├── DO_NOT_TOUCH.md              # THIS FILE — Architectural invariants
├── CLAUDE.md                    # Detailed application manual & feature reference
└── AGENTS.md                    # Antigravity agent execution memory
```

---

## 2. Immutable Brand, Legal & Security Rules

### Rule 1: Zero "Linktree" Mentions
* **STRICTLY NEVER** use the trademark word *"Linktree"* anywhere on public or private pages, metadata, `<title>`, headers, footers, copy, commits, or UI components.
* Refer to this platform exclusively as **AWS SBG site** or **AWS Student Builder Group**.

### Rule 2: Official AWS Affiliation Framing
* **AWS Student Builder Group** is an official student-led community affiliated with, powered by, and supported by **Amazon Web Services (AWS)**.
* Tone of voice: High-energy, student-led, rigorous, focused on AWS Study Jams, Cloud Practitioner & Solutions Architect certification prep, and hackathons.
* **Zero Data Sale:** Personal data is never sold, rented, or traded.

### Rule 3: Isolated Admin Surface
* `admin.awssbg.online` (or `/admin`) is a standalone portal.
* **NEVER** link or expose admin routes in the public header, navigation drawer, or public footer.

### Rule 4: Zero Secret Leaks
* Private API keys (`RESEND_API_KEY`, Supabase `service_role` secret) must **NEVER** be committed into git, bundled into frontend client code, or exposed via `NEXT_PUBLIC_` variables.
* All secret consumption happens server-side inside Cloudflare Pages Functions (`functions/api/`) or encrypted Worker environments.

### Rule 5: Hardcore Neo-Brutalism Design Standard
* **Geometry:** `0px` razor-sharp corners on **ALL** cards, buttons, badges, modals, inputs, and dropdowns. **No `rounded-*` classes permitted.**
* **Borders & Shadows:** `3px solid #000000` ink borders with `4px 4px 0px #000000` or `8px 8px 0px #000000` hard offset drop shadows.
* **Palette:** Pure Black (`#000000`), Pure White (`#FFFFFF`), AWS Electric Purple (`#7C3AED`), AWS Cyber Blue (`#2563EB`).
* **Icons:** STRICTLY monochrome/solid SVG icons via `react-icons` (e.g., `react-icons/si`, `react-icons/hi2`, `react-icons/fa6`). **ZERO emojis in the UI.**
* **Micro-interactions:** Left-to-right fill-slide hover sweep, tactile mechanical clicks (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).

---

## 3. Database Schema & Supabase Contracts

The platform runs on Supabase project `yzmgkreucvbftolijtpl` (region `eu-west-1`).

### Tables
1. **`public.links`**: Active links displayed on the public hub.
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `title TEXT NOT NULL`
   - `url TEXT NOT NULL`
   - `platform TEXT NOT NULL` (e.g., `whatsapp`, `meetup`, `linkedin`, `aws`, `instagram`, `tiktok`)
   - `description TEXT`
   - `is_active BOOLEAN NOT NULL DEFAULT true`
   - `sort_order INTEGER NOT NULL DEFAULT 0`
   - `click_count INTEGER NOT NULL DEFAULT 0` **(DO NOT REMOVE: Powers Admin Analytics)**
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

2. **`public.link_clicks`**: Atomic telemetry stream for individual clicks.
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `link_id UUID REFERENCES public.links(id) ON DELETE CASCADE`
   - `user_agent TEXT`
   - `country TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

3. **`public.inquiries`**: Submissions from the public contact form.
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name TEXT NOT NULL`
   - `email TEXT NOT NULL`
   - `category TEXT NOT NULL`
   - `message TEXT NOT NULL`
   - `status TEXT NOT NULL DEFAULT 'unread'` (`unread`, `read`, `archived`)
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### Atomic RPC Function (DO NOT ALTER SIGNATURE)
```sql
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Atomically increment links.click_count
  UPDATE public.links
  SET click_count = click_count + 1
  WHERE id = link_id;

  -- 2. Append telemetry row
  INSERT INTO public.link_clicks (link_id)
  VALUES (link_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_clicks(UUID) TO anon, authenticated, service_role;
```

---

## 4. Build Commands

All commands should be run from the repository root:

```bash
# Install all dependencies across workspaces
npm install

# Typecheck apps/admin (Must pass with 0 errors)
npm run --workspace=admin build # or: npx tsc --noEmit --project apps/admin/tsconfig.json

# Typecheck apps/web (Must pass with 0 errors)
npm run --workspace=web build # or: npx tsc --noEmit --project apps/web/tsconfig.json

# Typecheck apps/email-worker (Must pass with 0 errors)
npm run --workspace=email-worker build

# Run all TypeScript typechecks
npm run typecheck
```

---

## 5. Deployment Commands

### Cloudflare Pages (Frontend & Edge Functions)
The apps are deployed to Cloudflare Pages via Git push or Wrangler:

```bash
# 1. Deploy Public Web App (awssbg-linktree)
cd apps/web
npm run build
npx wrangler pages deploy out --project-name=awssbg-linktree

# 2. Deploy Admin Portal (awssbg-admin)
cd apps/admin
npm run build
npx wrangler pages deploy out --project-name=awssbg-admin

# 3. Deploy Standalone Email Worker (Fallback)
cd apps/email-worker
npx wrangler deploy
```

### Cloudflare Environment Secrets Setup
Never commit secrets into files. Upload them via Wrangler CLI:
```bash
# Upload secrets for Cloudflare Pages admin functions
npx wrangler pages secret put RESEND_API_KEY --project-name=awssbg-admin
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=awssbg-admin

# Upload secrets for Cloudflare Pages web inquiries functions
npx wrangler pages secret put RESEND_API_KEY --project-name=awssbg-linktree
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name=awssbg-linktree

# Upload secrets for Email Worker fallback
cd apps/email-worker
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

## 6. Pre-Commit Checklist (Mandatory for Every Developer / Agent)
1. Run `npx tsc --noEmit` across both `apps/admin` and `apps/web`. Both must pass with `0` errors.
2. Run `git diff -S "re_"` and `git diff -S "sb_secret"` to ensure zero API keys or secrets are staged.
3. Verify all UI components adhere strictly to `0px` radius, `3px solid #000000` ink borders, and monochrome SVG icons.
4. **Mandatory Communication:** Always inform and align with the lead developer before initiating git commits or production deployments.
