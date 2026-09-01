# Project Rules & Persistent Memory — AWS Student Builder Group

## 1. Brand & AWS Affiliation
- **Official Affiliation:** AWS Student Builder Group (SBG) is an official student-led community affiliated with, powered by, and supported by **Amazon Web Services (AWS)**.
- **Brand Framing:** It is student-led and student-maintained to deliver AWS Study Jams, Cloud Practitioner & Solutions Architect certification prep, and hackathons.
- **Zero Data Sale:** Personal data is strictly never sold, rented, or traded.

- **Zero "Linktree" Mentions:** STRICTLY NEVER use the trademark word "Linktree" anywhere on the site, meta tags, headers, footers, copy, or UI. Refer to the platform solely as **AWS SBG site** or **AWS Student Builder Group**.

## 2. Agent Workflow & Communication Rule
- **Mandatory Update Before Action:** ALWAYS update and notify the user BEFORE triggering builds, Cloudflare deployments, or git commits. Never commit or deploy silently without clear user alignment.

## 3. Design System & Aesthetic (Hardcore Neo-Brutalism)
- **Geometry:** `0px` razor-sharp corners on all cards, buttons, badges, modals, and inputs (no rounded corners).
- **Borders & Shadows:** `3px solid #000000` ink borders with `4px 4px 0px #000000` hard offset drop shadows.
- **Palette:** Pure Black (`#000000`), Pure White (`#FFFFFF`), AWS Electric Purple (`#7C3AED`), and AWS Cyber Blue (`#2563EB`).
- **Icons:** STRICTLY monochrome/solid SVG icons via `react-icons`. ZERO emojis in UI elements.
- **Micro-interactions:** Left-to-right fill-slide hover sweep, tactile mechanical clicks (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).

## 4. Security & Separation of Concerns
- **Isolated Admin:** `/admin` and `admin.awssbg.online` are dedicated standalone management portals. They must NEVER be linked in public footers or navigation bars.
- **Zero Secret Leaks:** Private API keys (e.g., `RESEND_API_KEY`, Supabase `service_role`) must NEVER be bundled into frontend client code or `NEXT_PUBLIC_` variables. Email sending is handled server-side via Supabase Auth SMTP.
- **Security Headers:** Enforce `_headers` on Cloudflare Pages (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
