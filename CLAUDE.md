# ⚡ CLAUDE.md — THE COMPLETE ENGINEERING & OPERATIONAL MANUAL

> **AWS Student Builder Group (SBG)**
> Official student-led community affiliated with, powered by, and supported by **Amazon Web Services (AWS)**.
> **Platform Domain:** `https://awssbg.online`  
> **Admin Console:** `https://admin.awssbg.online`

---

## TABLE OF CONTENTS
1. [System Architecture & Monorepo Overview](#1-system-architecture--monorepo-overview)
2. [Public Web App (`apps/web`)](#2-public-web-app-appsweb)
3. [Admin Management Console (`apps/admin`)](#3-admin-management-console-appsadmin)
4. [Authentication & The Password Lifecycle](#4-authentication--the-password-lifecycle)
5. [The Email Pipeline & Resend Integration](#5-the-email-pipeline--resend-integration)
6. [Analytics & Telemetry Engine](#6-analytics--telemetry-engine)
7. [Design System & Neo-Brutalism Specifications](#7-design-system--neo-brutalism-specifications)
8. [Database Schema & Stored Procedures](#8-database-schema--stored-procedures)
9. [Environment Variables & Secrets Reference](#9-environment-variables--secrets-reference)
10. [Troubleshooting & Common Failure Modes](#10-troubleshooting--common-failure-modes)

---

## 1. System Architecture & Monorepo Overview

The platform is designed as an npm workspace monorepo where concerns are physically separated into isolated packages.

```
AWSSGBLINKTREE/
├── apps/
│   ├── web/                     # Public Link Hub & Student Portal (Cloudflare Pages)
│   ├── admin/                   # Isolated Admin Management Portal (Cloudflare Pages)
│   └── email-worker/            # Standalone Cloudflare Worker (Fallback Email Engine)
├── packages/
│   └── shared/                  # Shared types, Supabase client, icon mapping
├── email-templates/             # Raw reference HTML email designs
├── DO_NOT_TOUCH.md              # Architectural invariants & immutable rules
├── CLAUDE.md                    # THIS MANUAL
└── AGENTS.md                    # Persistent memory for AI agent pair-programming
```

### Why This Separation Exists:
* **Zero Public Leakage:** The administrative application (`apps/admin`) is built and deployed as a standalone Cloudflare Pages project (`awssbg-admin`). It is physically hosted at `admin.awssbg.online` and never bundled with public website code.
* **Edge Functions for APIs:** Dynamic APIs run on Cloudflare Pages Functions located in `functions/api/` directories within each app, eliminating the need for complex container management.
* **Shared Types & Client:** Database models (`LinkItem`, `InquiryItem`, `LinkClick`) and the Supabase JavaScript client are defined once in `packages/shared` and imported everywhere.

---

## 2. Public Web App (`apps/web`)

The public site serves as the central jumping-off point for student builders to access AWS resources, certification prep, workshops, and community channels.

### Key Pages & Routes
* **`/` (Landing Page):**
  - **Header:** Sticky Neo-Brutalist navbar with quick links, mobile hamburger drawer, and native Web Share API integration.
  - **Hero:** Boxed AWS SBG logo stamp, high-contrast monospace badges for *AWS Study Jams*, *Cert Vouchers*, *Cloud Quest*, and *Cloud Projects*.
  - **LinkList:** Dynamically fetches active links from Supabase `public.links` ordered by `sort_order`. Renders skeleton loaders while data resolves.
  - **Footer:** Razor-sharp bookend footer featuring the signature `“GO BUILD.”` quote and links to legal policies.
* **`/contact` (Contact & Inquiries):**
  - **Instant Community Channels:** A responsive 3-column grid displaying:
    1. **WhatsApp Community:** Direct group link (`https://chat.whatsapp.com/CctGVCDhxhA8qcIZzHXpZg?s=cl&p=i&mlu=4&ilr=4`). Loaded dynamically from Supabase `links` table in real-time, with `process.env.NEXT_PUBLIC_WHATSAPP_URL` as a fallback.
    2. **Meetup Events:** Direct link to RSVP for upcoming in-person Study Jams and certification bootcamps.
    3. **LinkedIn Community:** Official group for connecting with cloud leaders and alumni.
  - **Inquiry Submission Form:**
    - Fields: Name, Email, Category (`General Inquiry`, `Join Study Jam / Bootcamp`, `Host Workshop / Speaker Request`, `University Tech Club Partnership`, `Certification Voucher Inquiry`, `Other`), and Message.
    - Saves directly to the Supabase `inquiries` table with status `unread`.
    - Dispatches dual transactional emails via Cloudflare Pages Function `/api/inquiries`.
* **`/about`:** Mission statement, core pillars, leadership philosophy, and interactive FAQ accordions.
* **`/privacy` & `/terms`:** Strict zero-data-sale privacy disclosures and terms of service.

---

## 3. Admin Management Console (`apps/admin`)

The Admin portal is a comprehensive command center for managing community content, reviewing inquiries, monitoring link engagement, and orchestrating team members.

### Core Tabs & Features

#### 1. Analytics & Overview (`Tab: overview` & `Tab: analytics`)
* **Live Counters:** Displays Total Links, Active Destinations, Pending Inquiries, and Total Link Clicks.
* **Destination Performance Breakdown:** Lists all tracked links, their total click counts, and their relative engagement share (percentage of total community traffic).
* **Zero-Click Detection:** Highlights links that have not yet received traffic so administrators can optimize placement.

#### 2. Links Manager (`Tab: links`)
* **Real-time Link CRUD:** Create, Edit, and Delete links.
* **Active Toggle:** Instantly enable or disable a link without deleting it.
* **Platform Icon Binding:** Selecting a platform (`aws`, `whatsapp`, `meetup`, `linkedin`, `instagram`, `tiktok`, `youtube`, `x`, `medium`, `devto`, `hashnode`) automatically maps the correct monochrome brand glyph.
* **Live Mobile Simulator:** A persistent Neo-Brutalist phone simulator that mirrors the exact public link list in real-time as edits are made.

#### 3. Inquiries Inbox (`Tab: inquiries`)
* **Real-time Inquiries List:** Shows student messages chronologically with category tags and unread counters.
* **Status Transitions:** Move inquiries between `unread`, `read`, and `archived`.
* **Detail Modal:** Displays full message content, submission timestamp, student email, and a one-click *"Reply via Email"* button (`mailto:`) pre-populated with subject and greeting.
* **Delete Action:** Permanently remove spam or obsolete inquiries.

#### 4. Team Access & Management (`Tab: team` — Superadmin Only)
* **User Directory:** Lists authorized administrators and editors.
* **Role-Based Access Control (RBAC):**
  - **Superadmin:** Full privileges including inviting new team members, deleting users, and viewing all tabs.
  - **Admin:** Manage links, content, and inquiries.
  - **Editor:** View and edit link destinations.
* **Invite Team Member Modal:** Invites new administrators by email (see [The Email Pipeline](#5-the-email-pipeline--resend-integration)).
* **User Deletion:** Safely remove team members via Supabase Auth Admin API.

---

## 4. Authentication & The Password Lifecycle

The authentication system is built for maximum security, zero leaks, and an unskippable credential setup experience.

### The Security Problem That Was Solved
In default Supabase Auth invite setups, clicking an invite link establishes an active session and drops the user directly onto the destination page. If the destination is the dashboard, an invited user could enter the admin console without ever having created a master password, leaving the account unable to log in later.

### The Dedicated Password Gateway Architecture

```
1. Admin triggers invite from Console
   └─> Supabase Auth generates secure invite token
       └─> Resend dispatches branded HTML invite email to target user
           └─> User clicks "ACCEPT INVITATION & ACTIVATE ACCESS"
               └─> Hits Supabase /auth/v1/verify
                   └─> Redirects to: https://admin.awssbg.online/update-password#access_token=...
```

#### Step-by-Step Flow:
1. **Dedicated Route Isolation:** The password setup logic lives in its own dedicated Next.js route: [`apps/admin/src/app/update-password/page.tsx`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/apps/admin/src/app/update-password/page.tsx). The dashboard code, database queries, and links management are **never loaded** on this page.
2. **Token Hash Extraction:** When the browser lands on `/update-password`, the Supabase client automatically validates the tokens from the URL hash.
3. **Master Password Validation:**
   - Minimum 8 characters.
   - Interactive `PasswordStrengthMeter` evaluates complexity (length, lowercase, uppercase, numbers, symbols) and displays real-time badges (`VERY WEAK`, `WEAK`, `FAIR`, `STRONG`, `VERY STRONG`).
   - Password confirmation check.
4. **Credential Activation:** Submits `supabase.auth.updateUser({ password: newPassword, data: { password_set: true } })`.
5. **Security Audit & Hash Cleanup:**
   - Calls `/api/notify-auth` to record the password change.
   - Clears the tokens from the browser URL bar using `window.history.replaceState`.
   - Automatically navigates to `/` where the user now has full, authenticated access to the dashboard.

#### In-Page Security Interceptor
Even if an invited user attempts to navigate directly to `https://admin.awssbg.online`, the root [`AdminPage`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/apps/admin/src/app/page.tsx) evaluates:
```ts
const isUnsetInvitedUser = Boolean(session?.user?.invited_at) && session?.user?.user_metadata?.password_set !== true;
```
If `true`, the dashboard is **completely blocked**, and `<ForceSetPasswordScreen />` is displayed. There is no "Later" button, no "Cancel" button, and no background dismissing.

#### Error Sanitization (`formatUserError`)
Technical database errors and internal keys are intercepted and converted into human-friendly explanations:
* Raw `service_role` error &rarr; *"Server configuration is finalizing. Please try again in a moment."*
* Expired JWT / token error &rarr; *"Your verification link has expired. Please request a new invitation."*
* Rate limit error &rarr; *"Request limit reached. Please wait a few minutes before trying again."*

---

## 5. The Email Pipeline & Resend Integration

Email delivery is powered by the **Resend API** using the verified domain `awssbg.online` (region: `eu-west-1`).

### Why Resend Instead of Built-in Supabase SMTP?
Default Supabase project SMTP is strictly rate-limited to 3–4 emails per hour and frequently routed to spam or blocked. By using Resend directly via verified DNS records (`awssbg.online`), delivery takes less than 2 seconds with 100% inbox placement.

### The Three Email Pipelines

```
                               ┌──> Formatted Admin Notification (lethabomabilo33@gmail.com)
1. Contact Form Submission ───┤
                               └──> Student Confirmation Receipt (Direct to Student)

2. Team Member Invitation ────────> Branded Admin Invite with Direct Setup Link

3. Security Audit Notice ─────────> Password Changed Alert to lethabomabilo33@gmail.com
```

#### Pipeline A: Contact Form (`apps/web/functions/api/inquiries.ts`)
* Triggered when a visitor submits `/contact`.
* **Dispatch 1 (Admin Alert):**
  - **From:** `AWS SBG Inquiries <enquiries@awssbg.online>`
  - **To:** `lethabomabilo33@gmail.com`, `enquiries@awssbg.online`
  - **Reply-To:** The student's email address (allows one-click direct replies).
  - **Content:** Hardcore Neo-Brutalist HTML template displaying the inquiry category, sender name, email, timestamp, and message.
* **Dispatch 2 (Student Confirmation Receipt):**
  - **From:** `AWS Student Builder Group <enquiries@awssbg.online>`
  - **To:** The student's email.
  - **Content:** Branded receipt confirming their message was delivered, with direct links to the official WhatsApp community and Meetup page.

#### Pipeline B: Admin Team Invitations (`apps/admin/functions/api/users.ts`)
* Triggered when a Superadmin invites an admin or editor from the Admin console.
* Calls `supabaseAdmin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: 'https://admin.awssbg.online/update-password' } })`.
* Dispatches a custom Neo-Brutalist HTML invitation email:
  - **From:** `AWS SBG Admin <notifications@awssbg.online>`
  - **To:** The invited user.
  - **CTA Button:** `ACCEPT INVITATION & ACTIVATE ACCESS →` pointing to the secure setup link.
* Returns `inviteLink` to the admin console so the Superadmin can also click *"Copy Link"* from the success toast and send it directly via WhatsApp/Slack.

#### Pipeline C: Security Audit Notification (`apps/admin/functions/api/notify-auth.ts`)
* Triggered whenever a password is changed or established.
* Dispatches an alert to `lethabomabilo33@gmail.com` with timestamp and account identifier for audit compliance.

---

## 6. Analytics & Telemetry Engine

The platform features real-time, privacy-preserving click telemetry without third-party tracking scripts.

### How Click Tracking Works

```
Student clicks link on awssbg.online
  └─> LinkButton.handleClick() executes
      └─> Calls Supabase RPC: increment_link_clicks(link_id)
          ├─> Atomically executes: UPDATE links SET click_count = click_count + 1
          └─> Appends row to: public.link_clicks (link_id, timestamp)
```

### Why Anonymous RPC Was Implemented:
1. **Zero Client-Side Keys Exposed:** The public site uses the anonymous Supabase key (`anon`). Normal RLS rules prohibit anonymous users from updating the `links` table directly.
2. **Atomic & Secure:** The Postgres function `increment_link_clicks` is defined with `SECURITY DEFINER SET search_path = public`, allowing safe, atomic increments without exposing write permissions to the rest of the table.
3. **No 0-Click Freezes:** Click counts are stored directly in `links.click_count` as an integer. The Admin dashboard calculates totals instantly using `useMemo` without expensive joins.

---

## 7. Design System & Neo-Brutalism Specifications

The entire platform adheres strictly to **Hardcore Neo-Brutalism**. Every visual component follows these geometric and color rules:

### Design Tokens & Invariants
* **Corners:** `0px` razor-sharp. Never use `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, or `rounded-full`.
* **Borders:** `3px solid #000000` (Tailwind: `border-[3px] border-black`).
* **Shadows:** Hard offset drop shadows:
  - Standard cards & buttons: `4px 4px 0px #000000` (Tailwind: `shadow-[4px_4px_0px_#000000]`).
  - Hero & Modals: `8px 8px 0px #000000` (Tailwind: `shadow-[8px_8px_0px_#000000]`).
  - Accent shadows: `3px 3px 0px #7C3AED` (AWS Electric Purple).
* **Palette:**
  - `Pure Black`: `#000000`
  - `Pure White`: `#FFFFFF`
  - `Canvas Neutral`: `#F4F4F5`
  - `AWS Electric Purple`: `#7C3AED`
  - `AWS Cyber Blue`: `#2563EB`
  - `AWS Alert Amber`: `#F59E0B`
* **Icons:** Strictly solid SVG icons from `react-icons` (`Hi2`, `Si`, `Fa6`). **Zero emojis permitted anywhere in the UI.**
* **Micro-interactions:**
  - Buttons depress on click: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
  - Links sweep background from left to right on hover.

---

## 8. Database Schema & Stored Procedures

Supabase project reference: `yzmgkreucvbftolijtpl` (EU West 1).

### Schema DDL

```sql
-- 1. Links Table
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  platform TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Link Clicks Telemetry Table
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES public.links(id) ON DELETE CASCADE,
  user_agent TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Atomic Increment RPC Function
CREATE OR REPLACE FUNCTION public.increment_link_clicks(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.links
  SET click_count = click_count + 1
  WHERE id = link_id;

  INSERT INTO public.link_clicks (link_id)
  VALUES (link_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_clicks(UUID) TO anon, authenticated, service_role;
```

---

## 9. Environment Variables & Secrets Reference

### Variable Storage Locations:
1. **Public Non-Secret Vars:** Placed in `wrangler.jsonc` under `"vars"` or `.env.local`.
2. **Encrypted Secrets:** Uploaded directly to Cloudflare via `wrangler pages secret put` or Cloudflare Dashboard. **NEVER written in files.**

| Variable Name | Type | Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public String | `apps/web`, `apps/admin` | Supabase API endpoint (`https://yzmgkreucvbftolijtpl.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public JWT | `apps/web`, `apps/admin` | Anonymous client key for read operations and click increments |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret Key** | Cloudflare Pages Runtime Only | Used strictly inside `functions/api/users.ts` to manage users |
| `RESEND_API_KEY` | **Secret Key** | Cloudflare Pages Runtime Only | API key for dispatching emails via `api.resend.com` |
| `NEXT_PUBLIC_SITE_URL` | Public URL | `apps/web`, `apps/admin` | Main public site URL (`https://awssbg.online`) |
| `NEXT_PUBLIC_ADMIN_URL` | Public URL | `apps/web`, `apps/admin` | Admin console URL (`https://admin.awssbg.online`) |
| `NEXT_PUBLIC_WHATSAPP_URL` | Public URL | `apps/web` | Active WhatsApp group invite link |
| `ADMIN_NOTIFICATION_EMAIL` | Email Address | `apps/web/functions/api/` | Target email for contact alerts (`lethabomabilo33@gmail.com`) |
| `ENQUIRIES_EMAIL` | Email Address | `apps/web/functions/api/` | Inquiries address (`enquiries@awssbg.online`) |

---

## 10. Troubleshooting & Common Failure Modes

### 1. "404 Not Found" on `/rest/v1/inquiries`
* **Cause:** The `public.inquiries` table was deleted or not created in Supabase.
* **Fix:** Re-run the DDL query from [Section 8](#8-database-schema--stored-procedures) in the Supabase SQL editor.

### 2. Analytics Displays `0` Clicks Despite Link Visits
* **Cause:** `public.links` is missing the `click_count` column, or the `increment_link_clicks` RPC function was modified without `SECURITY DEFINER`.
* **Fix:** Ensure `ALTER TABLE public.links ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;` has been applied and execute permissions granted to `anon`.

### 3. Invite Emails Not Delivering
* **Cause:** Supabase default email limits exceeded, or Cloudflare Pages runtime missing `RESEND_API_KEY`.
* **Fix:** Check that `RESEND_API_KEY` is bound in Cloudflare Pages for `awssbg-admin`. Use the *"Copy Link"* button in the Admin invite success toast to provide the link directly as an immediate bypass.

### 4. Admin Dashboard Flashes Before Password Setup
* **Cause:** User arrived via an invite link with `#access_token=...&type=invite`.
* **Fix:** The dedicated [`/update-password`](file:///C:/Users/letha/Documents/GitHub/AWSSGBLINKTREE/apps/admin/src/app/update-password/page.tsx) route prevents this. Ensure `redirectTo` in `apps/admin/functions/api/users.ts` points to `https://admin.awssbg.online/update-password`.
