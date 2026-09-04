# Events Platform — Product Requirements Document (Draft)
**AWS Student Community Day 2026 — TUT Main Campus**

---
AI, this other AI has no knowledge about how this codebase works at the moment, not even the DB, so P1 is your codebase knowledge. events.awssbg.online is the new web platform you need to build, this a private page where we will manage our events, attendees, send out e tickets, manage sponsors, and add the event forms on the main page (these forms must be added as a link on the event announcements (optional)). forms must be fully editable (on the admin side), and must be customizable just like the google forms. Each uni/org will be able to manage their own events and all that. and remember, AI is assuming some of the  "currentlyhappens" info, so read codebase to understand what is happening here twin.
## 1. Problem Statement
Registration currently happens on awssgb.online, but there's no operational system for the event itself: no way to build sign-up forms per role, no admin view to manage the attendee list and trigger e-ticket sends, no way to check people in efficiently, no way for sponsors to capture leads, and no queue system to prevent bottlenecks at keycard pickup.

This platform is the operational layer that sits alongside awssgb.online and handles everything from form creation through to on-the-ground event logistics.

---

## 2. System Overview

Two connected pieces:

- **awssgb.online** — existing registration/marketing site
- **Events platform (new)** — this PRD. Handles: event form creation, admin attendee management, e-ticket generation & send, QR check-in, queue/keycard assignment, and sponsor lead scanning

**Subdomain structure (proposed):**
- `events.awssgb.online` — staff/admin/sponsors dashboard
- Event-facing scanner tools for staff and sponsors (ole-gated views within the same app). Sponsors only have access to: Scanning QR codes, and retrieving the data they got via scanning QR code.

---

## 3. User Roles

| Role | Access |
|---|---|
| **Participant** (Student / Sponsor / Staff / VIP) | Fills in event sign-up form, receives e-ticket QR via email |
| **Admin** | Full access via admin.awssgb.online — sees signup list, assigns roles, triggers e-ticket sends, sees all consent/scan logs |
| **Staff** | Scans e-tickets at check-in (role-gated scanner view, not full admin) |
| **Sponsor** | Scans e-tickets at their booth to capture leads (separate role-gated scanner view, only sees their own leads list) |
FYI: E tickets will be issued after we press an approve button for each participant and after we clarify their role (ATTENDEE, VIP)
---

## 4. Core Flows

### 4.1 Event Form Creation
1. Admin creates an event sign-up form (fields configurable — name, email, role type, etc.)
2. Form published, link shared/embedded wherever needed
3. Participants fill it in — data lands in the admin list, unsent/pending by default

### 4.2 Admin Review & E-Ticket Send
1. Admin logs into `admin.awssgb.online`. NO, we'll manage these lists in events.awssbg, the events subdomain MUST be locked behind a login screen. NO SPONSOR OR ANY OTHER NON AWSSGB CORE TEAM MEMBER SHOULD BE ABLE TO ACCESS ADMIN.AWSSGB 
2. Sees full list of sign-ups, filterable/taggable by role (Student / Sponsor / Staff / VIP) (WE WILL CLARIFY THIS ROLE OURSELVES VIA A DROPDOWN LIST)
3. Admin ticks selected participants (e.g. approved students, confirmed sponsors)
4. Admin triggers send → system generates a unique opaque QR token per participant → Resend emails the e-ticket (QR embedded)

ALSO CREATE FUNCTIONALITY TO CLOSE THE FORM ONCE A LIMIT OF ATTENDEES HAS BEEN REACHED, AND A WAY TO ALSO SEND OUT "WE HAVE REACHED CAPACITY... " EMAILS TO THE REJECTED MFS. ALSO AN EMAIL AFTER THEY FILL IN THE EVENT FORMS TO CONFIRM THAT THE APPLICATION HAS BEEN RECIEVED. DONT SEND THOSE TO ME THO, I SHOULD ONLY GET ENQUIRIES/OTHER EMAILS THAT ALR EXIST IN DA CODEBASE.

### 4.3 Check-In (Staff)
1. Staff scans a participant's e-ticket QR via the platform's scanner (not a generic QR app — token only resolves through our system) (STAFF DOES THIS VIA EVENTS.AWSSBG), THEY ONLY GET ACCESS TO QR CODE SCANNING AND BANNING CERTAIN MEMBERS.
2. System validates token → confirms registered + not already checked in
3. System assigns a queue/line based on pre-set logic (e.g. surname range or batch) (WE WILL DIVIDE THE QUEUE BASED OFF A SYSTEM YOU WILL BUILD, ITS BASICALLY YOU DIVIDING THE LIST BY MAYBE 4 AND THEN WE WILL MANUALLY PUT THEIR EVENT LYNYARDS IN THAT QUEUE TO MAKE LINES MOVE FAST)
4. Staff/screen tells participant which line to join for keycard pickup
5. Keycards pre-sorted into those lines ahead of time — no single bottlenecked queue

### 4.4 Sponsor Lead Capture
1. Sponsor scans the same e-ticket QR at their booth, via their role-gated scanner view
2. Token resolves → student's info unlocks into that sponsor's leads list
3. Scan is logged (timestamp, sponsor ID, student ID) — this log **is** the consent record
4. Sponsors only ever see their own leads list, never another sponsor's or the full attendee database. THEY SEE THIS THRU EVENTS.AWSSGB AND CAN DOWNLOAD LIST

### 4.5 Token Security
- QR encodes an opaque token, not raw personal data
- Token only resolves via our platform/API — unreadable by generic QR scanner apps
- Each token traceable and revocable individually if a code leaks

---

## 5. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| R1 | Admin can create configurable event sign-up forms | Must |
| R2 | Form submissions land in an admin-viewable list, filterable by role | Must |
| R3 | Admin can select participants and trigger bulk e-ticket sends via Resend | Must |
| R4 | Each e-ticket contains one unique opaque QR token per participant | Must |
| R5 | QR token only resolves via our platform — not a generic scanner | Must |
| R6 | Staff role: scanner view for check-in only, no access to full admin functions | Must |
| R7 | Check-in scan triggers automatic queue/line assignment | Must |
| R8 | Sponsor role: scanner view for lead capture, scoped to their own leads list only | Must |
| R9 | Every scan (check-in or sponsor) is logged with timestamp + scanning party ID | Must |
| R10 | Admin has full visibility into all scan/consent logs for audit purposes | Must |
| R11 | Queue assignment logic is configurable (surname range, batch, VIP-separate, etc.) | Should |
| R12 | Participant can request a log of who has scanned their code | Should |
| R13 | Data retention/expiry policy for sponsor-captured leads post-event | Should |

---

## 6. Non-Goals (v1)
- Not a full CRM for sponsors — a leads list only: Sponsors must  be able to export that list. Data is Name, Surname, email, Course/job details. Will define these when we get the actual forms out.
- No facial recognition or auto-identification — QR scan only
- No payment processing — assumes any ticketing cost is handled elsewhere
- No generic third-party QR scanner support — platform-only by design

---

## 7. Open Questions
1. Same subdomain (`admin.awssgb.online`) for both form-building and attendee management, or split into two tools? Yes
2. How are Staff and Sponsor scanner accounts created/distributed — does Admin generate logins per person/org? We'll create these accounts on the events tab in the admin.awssgb
3. What exact queue-assignment logic do we use (surname split, batch size, VIP lane)? VIPs must have their own lane, then randomly assign rows to people. NB: use a mathematic teqnique to do so, random or anything efficient
4. Retention period for sponsor lead data after the event — 30 days, 90 days, indefinite until requested deletion? 30 days (From our db, then if atendees wanna delete their data, they should contact the Sponsors (Will add this list into the e ticket dynamically.))
5. Do Staff and Sponsor scanner views need to work offline given potentially unreliable venue wifi? NO
6. Single event platform, or built to be reusable across future SCD-style events? Reusable

---

## 8. Suggested Next Step
Draft for review — no build started. Once open questions above are answered, next step is scoping v1: form builder, admin dashboard, token generation service, and the two scanner views (staff check-in, sponsor lead capture).

EVENTS.AWSSGB: FULLY FOR EVENTS, ANNOUNCEMENTS, BLOG POSTS CAN BE MADE VIA THE ADMIN AND IT MUST STAY THAT WAY, THEN EVENTS IS STRICTLY FOR THIS WHOLE PROCESS MENTIONED ABOVE. IF USER EXISTS IN ADMIN.AWSSGB = ACCESS TO EVENTS.AWSSGB GRANTED. BUT THAT DOES NOT MEAN THAT SPONSORS/EVENT STAFF GET LOGINS FOR ADMIN, NO. ONLY EVENTS AND THEY HAVE LIMITED FUNCTIONALITY. WE WILL INVITE SPONSORS AND EVENT STAFF VIA EVENTS.AWSSGB. YOU'LL SEND OUT THE PASSWORD SETTING/INVITE EMAILS, EITHER AS STAFF OR SPONSOR (HOW YOU REFER TO RECIEVER OF THE EMAIL). DONT FORGET TO MAP OUT PROPER UI/UX FLOWS, LEFT NAVBARS, PROPER GROUPING OF ELEMENTS, DETAILED FORMS, PREVIEWS ETC. 