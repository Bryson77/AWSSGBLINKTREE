# AWS SBG @ TUT — Landing Page UI/UX PRD

**Scope:** Public-facing landing page only (hero + link list). Admin panel UI/UX not covered here.
**Layout philosophy:** Linktree-style — single narrow centered column, max-width ~500px, entire page is that column regardless of viewport width.

---

## 1. Page Structure (top to bottom)

1. Header bar (compact)
2. Hero section (hardcoded, poster-style)
3. Link list (centered column)
4. Footer bar (compact)

No sidebars, no multi-column sections. Everything lives in the vertical column.

---

## 2. Header Bar

- Height: ~56–64px.
- Background: `--bg-dark` (`#1A0C2B`), full-bleed (spans full viewport width, not constrained to the 500px column).
- Contents, horizontally centered within the column width: chip-logo mark (small, ~28–32px) + "AWS Student Builder Group TUT" wordmark, single line, white text, small caps or uppercase per design system type.
- No nav links, no menu — this isn't a multi-page nav bar, it's a brand strip. Keep it static, no hamburger menu needed.

---

## 3. Hero Section (hardcoded for Phase 1)

- Full-bleed background: `--bg-dark` with grain/noise overlay (matches SCD poster texture — low-opacity noise, not busy).
- Content constrained to the 500px column, centered, generous vertical padding (top/bottom ~48–64px on desktop, ~32–40px on mobile).
- Structure:
  - Small eyebrow/label line (optional, e.g. event name or "AWS SBG TUT") — white, small, uppercase, letter-spaced.
  - Large bold headline — uppercase, `--accent-purple` or white (headline is large enough that purple passes contrast comfortably here).
  - Supporting line/subtext — 1–2 sentences max, white/light gray, normal case, smaller than headline.
- No CTA button inside the hero itself — the link list immediately below **is** the CTA set. Don't duplicate a generic "Explore" button that just scrolls down; the links start right after.
- This entire block is hardcoded in Phase 1 (no CMS binding) — confirmed earlier, revisit when hero becomes editable.

---

## 4. Link List

### Container
- Centered column, max-width 500px, horizontal padding ~16–24px on mobile so buttons don't touch screen edges.
- Vertical gap between link buttons: ~12–16px.
- Top padding above first link (breathing room after hero): ~24–32px.
- Bottom padding after last link, before footer: ~40px.

### Individual Link Button — Default State
- Full width of the column.
- Background: slightly lifted from page background — a dark card tone (e.g. `#1A0C2B` base page, card at a slightly lighter dark shade or a subtle border) so buttons read as distinct tappable elements against the dark backdrop, not flat against it.
- Border-radius: rounded (matches the soft, modern feel of the poster's rounded/blocky shapes) — suggest 12–16px radius.
- Padding: ~14–16px vertical, ~16–20px horizontal.
- Layout inside button: platform icon (left, ~20–24px), title/button label (center-left, bold, white), description subtext below title if present (smaller, light gray, single line, truncate with ellipsis if too long — don't let it wrap to multiple lines and break button height consistency).
- Icon color: white or light gray by default (not full-color brand icons) to keep visual consistency across the dark theme — full-color platform icons (e.g. Instagram's gradient) would clash with the two-tone dark/purple system. Recommend monochrome icon treatment via `react-icons`, tinted white/gray at rest.

### Hover / Press State (confirmed: bold)
- On hover (desktop) / press (mobile tap): a **purple fill sweep** — background transitions to `--accent-purple` (or a gradient sweep across the button), icon and text flip to `--bg-dark` or white-on-purple depending on contrast check at implementation time.
- Transition: smooth, ~150–200ms ease, not instant snap — matches "bold" energy without feeling jarring.
- Active/pressed (mid-click) state: slightly deeper shade or scale-down (~98%) for tactile click feedback, distinct from hover.
- Focus state (keyboard navigation): visible focus ring (outline), do not rely on the hover-fill alone for keyboard users — accessibility requirement, not optional polish.

### Icon Fallback
- Recognized platform (Instagram, X, LinkedIn, WhatsApp, TikTok, YouTube, Facebook, Discord) → matching Simple Icons glyph via `react-icons`.
- "Website" or unrecognized → generic globe/link icon, same visual weight/size as brand icons so the list stays visually consistent.

### Empty State (confirmed: hero only, no placeholder)
- If zero active links exist, the link list container simply doesn't render — page ends after the hero, footer follows directly. No "coming soon" placeholder, no empty-state illustration. Keep this in mind when styling hero bottom-padding so it doesn't look visually broken butting straight into the footer — the hero's own bottom padding should be enough to not look like a mistake.

---

## 5. Footer Bar

- Full-bleed background: `--bg-dark`, matches header treatment (bookends the page).
- Contents, centered in column width: small text — e.g. "AWS Student Builder Group TUT" + year, or a small repeat of the chip logo. Keep minimal; this isn't a sitemap footer.
- Height: ~48–56px.

---

## 6. Responsive Behavior

- **Mobile (< 500px viewport):** column takes full available width minus horizontal padding (~16px each side). This is the primary target — link-in-bio pages are overwhelmingly opened from Instagram/TikTok/X bio taps on mobile.
- **Tablet/Desktop (≥ 500px):** column stays fixed at 500px max-width, centered horizontally, with the header/footer/hero background bleeding full-width behind it. Don't stretch the link buttons wider just because there's more screen — that breaks the Linktree-style visual identity and makes buttons awkwardly wide/hard to scan.

---

## 7. Motion / Animation Guidelines

- Page load: optional subtle fade-in/slide-up of hero content (~300–400ms) — nice-to-have polish, not a blocker.
- Link buttons: no entrance stagger animation needed for Phase 1 (adds complexity for marginal payoff at this list size) — buttons can render immediately, hover/press interaction is where the "bold" motion budget goes (per confirmed decision above).
- Respect `prefers-reduced-motion`: fall back to instant state changes (no sweep transition) for users with that OS setting enabled — accessibility requirement.

---

## 8. Accessibility

- Color contrast: `--accent-purple` (#A46BF5) on `--bg-dark` (#1A0C2B) is safe for **large text** (headline, icons) but should **not** be used for small body/subtext copy — use white or a light gray (e.g. `#E5E0EC`-ish, test actual value at build time) for description subtext to stay within WCAG AA for small text.
- All link buttons must be real `<a>` tags (not `<div onClick>`) so they're keyboard-navigable and screen-reader friendly by default.
- Icons need `aria-hidden="true"` (decorative, since the label text already conveys the platform) or a proper `aria-label` if the icon is the only content in edge cases.
- Visible focus states required (see Section 4).
- Alt text not applicable to icon fonts/SVGs used decoratively, but if a raster image is ever used for a platform icon, needs empty alt (`alt=""`) since the text label already carries meaning.

---

## 9. SEO / Social Share Metadata

- Page `<title>`: e.g. "AWS Student Builder Group — TUT"
- Meta description: short one-liner about the group.
- Open Graph image: needed for link previews when shared on WhatsApp/X/Instagram bio taps — recommend using a cropped/adapted version of the poster art (or the hero treatment rendered as a static image) as the OG image. **Flagging, not deciding:** you'll need an actual static image asset for this (can't be the live animated/dynamic hero) — worth generating one when the hero art is finalized.
- Favicon: chip-logo mark, needs to be exported at standard favicon sizes (32x32, 180x180 for Apple touch icon, etc.) — you have the source mark already, just needs the export pass.

---

## 10. Loading Behavior

- Since Phase 1 links are likely rendered via static generation + on-demand revalidation (per the backend PRD), there is normally **no client-side loading spinner** needed on first paint — the page arrives fully rendered from the edge.
- No skeleton states needed for Phase 1 given this rendering strategy — flagging only so it's not accidentally over-built.

---

## Open Items (not decided, flagging for you)
1. Need an actual static OG image asset once hero art is finalized (see Section 9).
2. Exact light-gray token for subtext (currently placeholder `#E5E0EC`) — pick and confirm at implementation time against your actual dark background for real contrast testing, not just my estimate. <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" xmlns:c2pa="http://c2pa.org/manifest"><metadata><c2pa:manifest>AAAWgmp1bWIAAAAeanVtZGMycGEAEQAQgAAAqgA4m3EDYzJwYQAAABZcanVtYgAAAEdqdW1kYzJtYQARABCAAACqADibcQN1cm46YzJwYTo0ODMwNjg0Yy0zMTc1LTQ5MTAtOWJmOS0yOTE1MTI1NjA2MjkAAAADl2p1bWIAAAApanVtZGMyYXMAEQAQgAAAqgA4m3EDYzJwYS5hc3NlcnRpb25zAAAAALxqdW1iAAAARGp1bWRjYm9yABEAEIAAAKoAOJtxE2MycGEuaW5ncmVkaWVudC52MwAAAAAYYzJzaCe9E0ZaLoOsBCyg9RXBjvkAAABwY2JvcqNpZGM6Zm9ybWF0bWltYWdlL3N2Zyt4bWxqaW5zdGFuY2VJRHgseG1wOmlpZDo5NjAxM2FhNC1kYjM2LTQyMWUtOTgzZi1mYWQwN2ZmZWFmZDBscmVsYXRpb25zaGlwaHBhcmVudE9mAAAB4mp1bWIAAABBanVtZGNib3IAEQAQgAAAqgA4m3ETYzJwYS5hY3Rpb25zLnYyAAAAABhjMnNodk7XqnaASHo3+zw5q3JkEQAAAZljYm9yomdhY3Rpb25zgqJmYWN0aW9ua2MycGEub3BlbmVkanBhcmFtZXRlcnOha2luZ3JlZGllbnRzgaJjdXJseC1zZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmluZ3JlZGllbnQudjNkaGFzaFggeWDcyGqZV1SJ1OUsmbcZHAMbhymjZZD3iFpvjpSNAcukZmFjdGlvbngdY29tLmFudGhyb3BpYy5jbGF1ZGUucHJvdmlkZWRqcGFyYW1ldGVyc6F4H2NvbS5hbnRocm9waWMub3JpZ2luLWNvbmZpZGVuY2VndW5rbm93bmtkZXNjcmlwdGlvbnhmQ2xhdWRlIHByb3ZpZGVkIHRoaXMgZmlsZSBhdCB0aGUgcmVxdWVzdCBvZiBhIHVzZXIgYW5kIG1heSBoYXZlIGNyZWF0ZWQgb3IgbW9kaWZpZWQgdGhlIGZpbGUgY29udGVudHMubXNvZnR3YXJlQWdlbnShZG5hbWVmQ2xhdWRlcmFsbEFjdGlvbnNJbmNsdWRlZPUAAADIanVtYgAAAEBqdW1kY2JvcgARABCAAACqADibcRNjMnBhLmhhc2guZGF0YQAAAAAYYzJzaDdckHXXYwCzt1iY2G3k7FYAAACAY2JvcqVjYWxnZnNoYTI1NmNwYWRNAAAAAAAAAAAAAAAAAGRoYXNoWCDgNGPGP/e4rrZDbL/2KEbLaN8TCBbOCTCHAGEMyjJXbWRuYW1lbmp1bWJmIG1hbmlmZXN0amV4Y2x1c2lvbnOBomVzdGFydBh9Zmxlbmd0aBkeBAAAAj5qdW1iAAAAJ2p1bWRjMmNsABEAEIAAAKoAOJtxA2MycGEuY2xhaW0udjIAAAACD2Nib3KlY2FsZ2ZzaGEyNTZpc2lnbmF0dXJleE1zZWxmI2p1bWJmPS9jMnBhL3VybjpjMnBhOjQ4MzA2ODRjLTMxNzUtNDkxMC05YmY5LTI5MTUxMjU2MDYyOS9jMnBhLnNpZ25hdHVyZWppbnN0YW5jZUlEeCx4bXA6aWlkOjNmY2FkZWNkLTUzNDAtNGY4Ny04NGVkLTFhNWE3OWUzM2Q4ZHJjcmVhdGVkX2Fzc2VydGlvbnODomN1cmx4LXNlbGYjanVtYmY9YzJwYS5hc3NlcnRpb25zL2MycGEuaW5ncmVkaWVudC52M2RoYXNoWCB5YNzIaplXVInU5SyZtxkcAxuHKaNlkPeIWm+OlI0By6JjdXJseCpzZWxmI2p1bWJmPWMycGEuYXNzZXJ0aW9ucy9jMnBhLmFjdGlvbnMudjJkaGFzaFggeXUWgQVKa7Q4ja7142bkeWpI2YssN57rMxooy5TDIGGiY3VybHgpc2VsZiNqdW1iZj1jMnBhLmFzc2VydGlvbnMvYzJwYS5oYXNoLmRhdGFkaGFzaFggsaUy9s+P2dECH+9x+Hsnz11OPMT1DABqTXdgMgt8IGJ0Y2xhaW1fZ2VuZXJhdG9yX2luZm+jZG5hbWVvQW50aHJvcGljIEZpbGVzZ3ZlcnNpb25lMS4wLjBrc3BlY1ZlcnNpb25lMi40LjAAABA4anVtYgAAAChqdW1kYzJjcwARABCAAACqADibcQNjMnBhLnNpZ25hdHVyZQAAABAIY2JvctKEWQISogEmGCFZAgowggIGMIIBjaADAgECAhRA5aAK7sI50L64g/oGQgU9Z1UTADAKBggqhkjOPQQDAzBJMRcwFQYDVQQKEw5BbnRocm9waWMsIFBCQzEuMCwGA1UEAxMlQW50aHJvcGljIENvbnRlbnQgQ3JlZGVudGlhbHMgUm9vdCBDQTAeFw0yNjA4MDcxODQzNTZaFw0yODA4MDYxOTQzNTZaMEQxFzAVBgNVBAoTDkFudGhyb3BpYywgUEJDMSkwJwYDVQQDEyBBbnRocm9waWMgQ2xhdWRlIENvbnRlbnQgU2lnbmluZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABJh6CmvLUBgFFNU0vUKlOVtE6djd17L5SuwX0LemFisBM3dkd/3cyjxFA3Qo5S46fX0/ihY0VZ7mfb9KF703t5OjWDBWMA4GA1UdDwEB/wQEAwIHgDAVBgNVHSUEDjAMBgorBgEEAYPoXgIBMAwGA1UdEwEB/wQCMAAwHwYDVR0jBBgwFoAUzlHiBIFOZFsj+OPEz5o+nMHXXMIwCgYIKoZIzj0EAwMDZwAwZAIwMXMdFJ4BetLLVY7ORuE9noqbbAZOZn/aArXyTwFAZfKrPzxF2vPoJNf1+UCdg1XGAjBwX1zd9WGqYkqmL5SFqw1QySjr1zJfpJM9+1rdDwSPLMOPOjKuiXjoU/pUUeG9RwmhY3BhZFkNngAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPZYQPY2WtI9QbEQ1OjhxSt6PX4HVGaQ0iLufAFX811k3Qkd/iOSnumUeHccbAWlj6MSnEUHbFp5oOVjRRuIEgovXos=</c2pa:manifest></metadata>
  <g fill="#8C4FFF">
    <!-- Top pins -->
    <rect x="40" y="25" width="40" height="15"/>
    <rect x="40" y="15" width="8" height="10"/>
    <rect x="56" y="15" width="8" height="10"/>
    <rect x="72" y="15" width="8" height="10"/>

    <!-- Bottom pins -->
    <rect x="40" y="80" width="40" height="15"/>
    <rect x="40" y="95" width="8" height="10"/>
    <rect x="56" y="95" width="8" height="10"/>
    <rect x="72" y="95" width="8" height="10"/>

    <!-- Left pins -->
    <rect x="25" y="40" width="15" height="40"/>
    <rect x="15" y="40" width="10" height="8"/>
    <rect x="15" y="56" width="10" height="8"/>
    <rect x="15" y="72" width="10" height="8"/>

    <!-- Right pins -->
    <rect x="80" y="40" width="15" height="40"/>
    <rect x="95" y="40" width="10" height="8"/>
    <rect x="95" y="56" width="10" height="8"/>
    <rect x="95" y="72" width="10" height="8"/>
  </g>
</svg>