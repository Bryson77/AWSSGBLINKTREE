# Inline Media & Multi-Tenant Previous Events Feed Implementation

**Date:** 2026-11-10  
**Repository:** `C:\Users\letha\Documents\GitHub\AWSSGBLINKTREE` (`aws-sbg-monorepo`)  
**Scope:** `apps/web` (Public Storefront Hub — `https://awssbg.online`) & `apps/admin` (Console — `https://admin.awssbg.online`)

---

## 1. Overview of Completed Work

1. **Inline Pictures & Hyperlinks in Blog Manager & Markdown Renderers:**
   - Added an interactive Neo-Brutalist toolbar in `BlogManager.tsx` directly above the article editor textarea:
     - **`+ Picture` button:** Triggers `ImageUploadModal` to upload an image and automatically inserts `![Article image](${url})` at the exact cursor position.
     - **`+ Link` button:** Opens a modal dialog to insert labeled hyperlinks (`[Label](url)`) at the cursor position.
     - **Formatting shortcuts:** Bold (`**`), Italic (`*`), H2 (`## `), H3 (`### `), Bullet List (`- `), Blockquote (`> `), and Code Block (` ``` `).
   - In `BlogManager.tsx` (live preview), `apps/web/src/app/blog/[slug]/BlogPostClient.tsx`, and `apps/web/src/app/[org]/blog/[slug]/OrgBlogPostClient.tsx`, added prose styling for inline pictures and links:
     - `[&_img]:max-w-full [&_img]:border-[3px] [&_img]:border-black [&_img]:shadow-[5px_5px_0px_#000000] [&_img]:my-6 [&_img]:mx-auto [&_img]:block`
     - `[&_a]:text-accent-purple [&_a]:underline [&_a]:font-bold [&_a]:hover:text-black [&_a]:transition-colors`

2. **Previous Events Section on the Navbar for Every SBG (`Header.tsx`):**
   - Updated `apps/web/src/components/Header.tsx` to include "Events" on both campus-specific and global navigation bars:
     - Campus view (`campusSlug`): `{ href: '/${campusSlug}/events', label: 'Events', icon: HiOutlineCalendar }`
     - Global view: `{ href: '/events', label: 'Events', icon: HiOutlineCalendar }`
   - Added `"events"` and `"previous-events"` to `KNOWN_STATIC_ROUTES` so campus route extraction does not mistake them for institution slugs.

3. **Multi-Tenant Community Events & Study Jam Feed (`/[org]/events` & `/events`):**
   - Created `apps/web/src/app/[org]/events/page.tsx` with `generateStaticParams()` covering all active SBG slugs (both lowercase and uppercase).
   - Created `apps/web/src/app/[org]/events/OrgEventsClient.tsx`:
     - **Strict Data Isolation:** Resolves the campus slug (`tut`, `mitcsn`, etc.) and filters both `posts` and `events` by `org_id = orgData.id`. One university SBG never sees another's previous events in their feed.
     - **Feed Architecture:** Renders recaps and past sessions in a community feed timeline.
     - **Multi-Image Photo Collage:** Displays 1-image full width, 2-image split, 3-image hero+stacked, and 4+ image 2x2 grid with `+N More` photo overlay.
     - **Interactive Lightbox Modal:** Clicking any photo opens a full-screen Neo-Brutalist image viewer with prev/next navigation, photo counter ("Photo 2 of 5"), and keyboard support (Esc, Left/Right arrow).
     - **Action Links & Share:** Dedicated buttons for presentation slides, repos, and meetup sessions, plus native share/clipboard copying.
   - Created `apps/web/src/app/events/page.tsx` (`GlobalEventsPage`):
     - Displays all community event recaps across the global network with an interactive SBG filter bar (`All Groups`, `@TUT`, etc.).
   - Updated `apps/web/src/app/page.tsx` (SPA fallback router) to route `/[org]/events` and `/events` seamlessly under Cloudflare Pages static export.
   - Added `/previous-events -> /events` 301 redirects in `apps/web/public/_redirects`.

4. **Previous Events & Recaps Feed Management in Admin Console (`EventsManager.tsx`):**
   - Added a sub-tab toggle inside `apps/admin/src/components/EventsManager.tsx`:
     - `[ Live Passes & Queues ]` (existing event pass ticketing wizard & scanner link)
     - `[ Previous Events Feed ]` (new multi-photo event recap management feed)
   - Features in Previous Events Feed manager:
     - Campus data isolation (`currentOrgId` enforced; superadmins can filter/select any campus).
     - Compose & Edit Modal with title, event date, venue, markdown editor with inline picture/link toolbar, and a multi-photo gallery uploader (`+ Attach Photo`) with interactive thumbnail deletion.
     - Full audit logging (`DELETE_EVENT`, `DELETE_POST`).

---

## 2. Files Modified and Created

| File | Status | Description |
|---|---|---|
| `apps/admin/src/components/BlogManager.tsx` | Modified | Added markdown toolbar (Picture, Link, Bold, Italic, Headings, Lists, Code) and inline upload modal |
| `apps/admin/src/components/EventsManager.tsx` | Modified | Added Previous Events & Recaps Feed management tab, multi-photo uploader, and recap editor |
| `apps/admin/src/app/page.tsx` | Modified | Passed `orgs={orgs}` to `EventsManager` for superadmin campus switching |
| `apps/web/src/components/Header.tsx` | Modified | Added "Events" link to navbar for every campus route and global header |
| `apps/web/src/app/[org]/events/page.tsx` | Created | Static params generation for `/[org]/events` (lowercase & uppercase) |
| `apps/web/src/app/[org]/events/OrgEventsClient.tsx` | Created | Multi-tenant Previous Events Feed with multi-image grid and interactive lightbox |
| `apps/web/src/app/events/page.tsx` | Created | Global Previous Events Feed with SBG filter bar |
| `apps/web/src/app/page.tsx` | Modified | Added SPA fallback routing for `/[org]/events` and `/events` |
| `apps/web/src/app/blog/[slug]/BlogPostClient.tsx` | Modified | Added Neo-Brutalist prose styling for inline pictures and hyperlinks |
| `apps/web/src/app/[org]/blog/[slug]/OrgBlogPostClient.tsx` | Modified | Added Neo-Brutalist prose styling for inline pictures and hyperlinks |
| `apps/web/public/_redirects` | Modified | Added 301 canonical redirect rules for `/previous-events` |

---

## 3. Architecture Decisions & Why This Solution Was Best

1. **Why leverage existing `posts` and `events` tables instead of running new DDL:**
   - Under Rule 4 of `AGENTS.md`, running DDL or schema alterations against the production Supabase database (`yzmgkreucvbftolijtpl`) is strictly prohibited.
   - By structuring event recaps with the existing `posts` and `events` tables:
     - Multi-tenant Row-Level Security (RLS) is already active and strictly enforced at the database level (`(is_super_admin() OR (org_id = current_admin_org()))`).
     - Campus leaders cannot view or modify drafts from other university groups.
     - Zero migration downtime, zero lock contention, and zero breaking schema changes.

2. **Why a dedicated photo collage + lightbox is superior to plain text/links:**
   - Community events (Study Jams, certification bootcamps, hackathons) are visual and social proof.
   - The responsive multi-image layout (1, 2, 3, or 4+ photos with `+N More` counter) displays event energy directly in the feed without requiring visitors to open each image in a new tab, matching social community feeds while strictly adhering to Hardcore Neo-Brutalism (`0px` corners, `3px solid #000000` ink borders, `4px 4px 0px #000000` shadows).

3. **Verification & Security Auditing:**
   - Both `apps/web` and `apps/admin` TypeScript type checks (`tsc --noEmit`) were run and completed with **0 errors**.
   - **Red Hat / XSS Defense:** All parsed Markdown is sanitized via `DOMPurify` through `sanitizeContent()`, which strips any inline scripts, event handlers (`onerror`, `onload`), and malicious `javascript:` URI schemes from inline images and links.
   - **Multi-Tenant Isolation:** Verified database RLS policies on `posts` and `events` enforcing `(is_super_admin() OR (org_id = current_admin_org()))` for mutations and `status = 'published'` for anonymous reads.
   - **Edge-Case Hardening:** Added explicit `404 // SBG_NOT_FOUND` screens to `OrgEventsClient.tsx` and `OrgBlogClient.tsx` when an unmapped or deleted institution slug is queried.
   - **PostgREST Relationship Safety:** In `apps/web/src/app/events/page.tsx`, embedded `orgs` relations handle both single objects and array wrappers cleanly (`Array.isArray(rawOrg) ? rawOrg[0] : rawOrg`).
   - **Memory Leak Prevention:** Lightbox keyboard event listeners (`keydown` for Escape, Left, Right arrows) in `OrgEventsClient.tsx` and `GlobalEventsPage.tsx` are cleaned up on unmount.
