/**
 * AWS Student Builder Group (AWS SBG) — Shared Type System
 * Multi-Tenant Platform & Content Schema Definitions
 */

export type UserRole = "superadmin" | "leader" | "member";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OrgSettings {
  org_id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  contact_recipient_email: string;
  updated_at: string;
}

export interface Post {
  id: string;
  org_id: string;
  title: string;
  slug: string;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  org_id: string;
  name: string;
  role_title: string;
  photo_url: string | null;
  is_leader: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  org_id: string | null;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: "link" | "post" | "team_member" | "org_settings" | "org" | "user" | "inquiry" | "announcement";
  entity_id: string | null;
  summary: string;
  created_at: string;
}

export interface AnnouncementActionLink {
  title: string;
  url: string;
  platform: string;
}

export interface Announcement {
  id: string;
  org_id: string;
  title: string;
  subtitle?: string | null;
  poster_image_url?: string | null;
  banner_text: string;
  banner_bg_color: string;
  cta_label: string;
  cta_url?: string | null;
  cta_platform?: string | null;
  location_type?: "in_person" | "online" | "hybrid";
  location_name?: string | null;
  links?: AnnouncementActionLink[];
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  org_id: string | null;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface LinkItem {
  id: string;
  org_id?: string | null;
  title: string;
  url: string;
  platform: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  click_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LinkClick {
  id: string;
  link_id: string;
  org_id?: string | null;
  clicked_at: string;
  user_agent?: string | null;
  referrer?: string | null;
  country?: string | null;
}

export interface InquiryItem {
  id: string;
  org_id?: string | null;
  name: string;
  email: string;
  category: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
}

// ── Event Platform & Logistics Domain Types ──

export type EventStatus =
  | "draft"
  | "published_open"
  | "waitlist_only"
  | "registration_closed"
  | "live_checkin"
  | "concluded_archived";

export type AttendeeRole = "ATTENDEE" | "VIP" | "SPONSOR" | "STAFF";

export type RegistrationStatus =
  | "pending"
  | "approved"
  | "waitlisted"
  | "rejected"
  | "banned";

export type EventUserRole = "event_staff" | "sponsor";

export type SponsorTier = "title" | "platinum" | "gold" | "community";

export interface EventItem {
  id: string;
  org_id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  venue_name: string;
  start_time: string;
  end_time: string;
  poster_url?: string | null;
  banner_url?: string | null;
  capacity_limit: number;
  waitlist_enabled: boolean;
  status: EventStatus;
  queue_count: number;
  queues_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox";
  options?: string[];
  required: boolean;
}

export interface EventFormConfig {
  id: string;
  event_id: string;
  include_student_id: boolean;
  include_tshirt_size: boolean;
  include_dietary: boolean;
  custom_fields: EventCustomField[];
  popia_consent_text: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  affiliation_type: "student" | "industry";
  affiliation_detail: string;
  student_id?: string | null;
  tshirt_size?: string | null;
  dietary_requirements?: string | null;
  custom_responses: Record<string, any>;
  status: RegistrationStatus;
  assigned_role: AttendeeRole;
  assigned_queue?: number | null;
  qr_token: string;
  checked_in: boolean;
  checked_in_at?: string | null;
  checked_in_by?: string | null;
  ticket_sent_at?: string | null;
  ban_reason?: string | null;
  banned_by?: string | null;
  banned_at?: string | null;
  popia_consent_given: boolean;
  popia_consent_at: string;
  created_at: string;
  updated_at: string;
}

export interface SponsorCompany {
  id: string;
  event_id: string;
  name: string;
  tier: SponsorTier;
  logo_url?: string | null;
  lead_fields: string[];
  created_at: string;
}

export interface EventUser {
  id: string;
  event_id: string;
  sponsor_company_id?: string | null;
  email: string;
  name: string;
  role: EventUserRole;
  created_at: string;
}

export interface SponsorLead {
  id: string;
  event_id: string;
  sponsor_company_id: string;
  scanned_by_user_id?: string | null;
  registration_id: string;
  rating?: number | null;
  notes?: string | null;
  scanned_at: string;
  registration?: EventRegistration;
}

export interface CheckinLog {
  id: string;
  event_id: string;
  registration_id: string;
  scanned_by_user_id?: string | null;
  scan_status:
    | "valid_first_entry"
    | "duplicate_rejected"
    | "duplicate_overridden"
    | "banned_rejected";
  scanned_at: string;
}

