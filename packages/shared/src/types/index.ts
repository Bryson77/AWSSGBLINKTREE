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
