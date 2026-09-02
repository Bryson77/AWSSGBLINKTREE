# AWS Student Builder Group (AWS SBG) — Master Product Requirements Document

Welcome to the central product specification for the **AWS Student Builder Group (AWS SBG)** platform.

AWS SBG is an official global student-led community affiliated with, powered by, and supported by **Amazon Web Services (AWS)** across 60+ countries worldwide.

---

## 📚 Modular PRD Index

The platform specifications are organized into three modular documents:

1. **[`PRD_WEB.md`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/PRD_WEB.md) — Public Student Hub (`apps/web` → `https://awssbg.online`)**
   - Sticky Neo-Brutalist Top Navbar (Home, About, Contact, Share Drawer)
   - Home Page (`/`): High-impact Hero + Interactive Pillar Chips + Real-Time Link List with Purple Fill Sweep
   - About Page (`/about`): Official AWS Affiliation, Mission, 4 Core Pillars, FAQs
   - Contact Page (`/contact`): Direct Community Hub Cards + Interactive Inquiries Form
   - Legal & Compliance Pages: Privacy Policy (`/privacy`), Terms of Service (`/terms`)
   - AI Scraper & SEO Standard: `/llms.txt`, Schema.org JSON-LD, Robots.txt

2. **[`PRD_ADMIN.md`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/PRD_ADMIN.md) — Dedicated Management Portal (`apps/admin` → `https://admin.awssbg.online`)**
   - Collapsible Neo-Brutalist Left Sidebar Navigation
   - Dashboard: High-level metric cards, system latency, fast actions
   - Analytics: Link click telemetry, click-through rates, platform/device breakdown, bar charts
   - Links: Full CRUD link manager, 17+ platform icons, sort ordering, live mobile simulator
   - Inquiries: Contact form inbox, unread badge counter, category filters, response manager
   - Settings & Team: Super Admin vs Admin RBAC, invites, user deletions, live password strength meter

3. **[`PRD_BACKEND.md`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/PRD_BACKEND.md) — Database, Security & Edge APIs**
   - PostgreSQL / Supabase Schema: `links`, `link_clicks`, `inquiries`, `admin_users`
   - Atomic Click Telemetry RPC: `increment_link_clicks()`
   - Row Level Security (RLS) policies for public and authenticated roles
   - Cloudflare Pages Edge Functions: `/api/users` (Admin Auth) and `/api/inquiries` (Email dispatch to `lethabomabilo33@gmail.com`)
   - Transactional Neo-Brutalist HTML email templates (`invite.html`, `magic-link.html`, `recovery.html`)

---

## 🎨 Core Design System: Hardcore Neo-Brutalism

All applications across the monorepo adhere strictly to the **Hardcore Neo-Brutalism** standard:
- **Geometry:** `0px` razor-sharp corners on all cards, buttons, badges, modals, inputs, and drawers.
- **Borders & Shadows:** `3px solid #000000` ink borders with `4px 4px 0px #000000` hard offset drop shadows.
- **Palette:** Off-white grid canvas (`#F4F4F5`), Pure Black (`#000000`), Pure White (`#FFFFFF`), AWS Electric Purple (`#7C3AED`), AWS Cyber Blue (`#2563EB`).
- **Icons:** Monochrome/solid SVG icons via `react-icons`. ZERO emojis in UI elements.
- **Micro-interactions:** Left-to-right fill-slide hover sweep (`scaleX(0)` → `scaleX(1)`), tactile mechanical clicks (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).