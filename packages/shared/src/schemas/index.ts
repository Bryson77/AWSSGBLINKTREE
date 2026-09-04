import { z } from "zod";

/**
 * Zod validation schemas for input sanitization and cybersecurity hardening.
 */

export const createPostSchema = z.object({
  org_id: z.string().uuid("Invalid organization ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title cannot exceed 120 characters").trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens")
    .trim(),
  content: z.string().min(10, "Post content must be at least 10 characters").max(50000, "Post content cannot exceed 50,000 characters"),
  cover_image_url: z.string().url("Invalid image URL").nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const updatePostSchema = createPostSchema.partial().extend({
  id: z.string().uuid("Invalid post ID"),
});

export const teamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid("Invalid organization ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name cannot exceed 80 characters").trim(),
  role_title: z.string().min(2, "Role title must be at least 2 characters").max(80, "Role title cannot exceed 80 characters").trim(),
  photo_url: z.string().url("Invalid photo URL").nullable().optional(),
  is_leader: z.boolean().default(false),
  sort_order: z.number().int().min(0).default(0),
});

export const orgSettingsSchema = z.object({
  org_id: z.string().uuid("Invalid organization ID"),
  hero_title: z.string().min(3, "Hero title must be at least 3 characters").max(100, "Hero title cannot exceed 100 characters").trim(),
  hero_subtitle: z.string().min(3, "Hero subtitle must be at least 3 characters").max(200, "Hero subtitle cannot exceed 200 characters").trim(),
  hero_image_url: z.string().url("Invalid hero image URL").nullable().optional(),
  contact_recipient_email: z.string().email("Valid recipient email address is required").trim(),
});

export const inquirySchema = z.object({
  org_id: z.string().uuid("Invalid organization ID").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters").trim(),
  email: z.string().email("Valid email address is required").max(255).trim().toLowerCase(),
  category: z.string().min(2, "Category is required").max(100).trim(),
  message: z.string().min(5, "Message must be at least 5 characters").max(3000, "Message cannot exceed 3,000 characters").trim(),
});

export const createOrgSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters").max(100, "Organization name cannot exceed 100 characters").trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug cannot exceed 40 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens")
    .trim(),
  leader_email: z.string().email("Valid leader email is required").trim().toLowerCase(),
  leader_name: z.string().min(2).max(100).optional(),
});

export const linkSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid("Invalid organization ID").optional(),
  title: z.string().min(1, "Title is required").max(100).trim(),
  url: z.string().url("Valid URL is required").trim(),
  platform: z.string().min(1, "Platform is required").max(50).trim(),
  description: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const announcementSchema = z
  .object({
    id: z.string().uuid().optional(),
    org_id: z.string().uuid("Invalid organization ID"),
    title: z.string().min(2, "Title must be at least 2 characters").max(150, "Title cannot exceed 150 characters").trim(),
    subtitle: z.string().max(250, "Subtitle cannot exceed 250 characters").nullable().optional().transform((v) => (!v ? null : v.trim())),
    poster_image_url: z
      .string()
      .url("Invalid image URL")
      .or(z.literal(""))
      .nullable()
      .optional()
      .transform((v) => (!v ? null : v.trim())),
    banner_text: z.string().min(2, "Banner text is required").max(150, "Banner text cannot exceed 150 characters").trim().default("We have an event coming up!"),
    banner_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid 6-character hex color (e.g. #7C3AED)").default("#7C3AED"),
    cta_label: z.string().min(1, "CTA label is required").max(50).trim().default("Learn More"),
    cta_url: z
      .string()
      .max(500)
      .refine(
        (val) => !val || val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"),
        "CTA URL must be a relative path or http/https URL"
      )
      .nullable()
      .optional()
      .transform((v) => (!v ? null : v.trim())),
    cta_platform: z.string().default("website"),
    location_type: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
    location_name: z
      .string()
      .max(200, "Location name cannot exceed 200 characters")
      .nullable()
      .optional()
      .transform((v) => (!v ? null : v.trim())),
    links: z
      .array(
        z.object({
          title: z.string().min(1, "Link title is required").max(100).trim(),
          url: z.string().url("Valid URL is required").trim(),
          platform: z.string().min(1).default("website"),
        })
      )
      .optional()
      .default([]),
    start_date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    end_date: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid end date")
      .nullable()
      .optional()
      .transform((v) => (!v ? null : v)),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date must be on or after the start date",
      path: ["end_date"],
    }
  );

export const updateAnnouncementSchema = z.object({
  id: z.string().uuid("Invalid announcement ID"),
  org_id: z.string().uuid("Invalid organization ID").optional(),
  title: z.string().min(2).max(150).trim().optional(),
  subtitle: z.string().max(250).nullable().optional().transform((v) => (!v ? null : v.trim())),
  poster_image_url: z.string().url().or(z.literal("")).nullable().optional().transform((v) => (!v ? null : v.trim())),
  banner_text: z.string().min(2).max(150).trim().optional(),
  banner_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  cta_label: z.string().min(1).max(50).trim().optional(),
  cta_url: z
    .string()
    .max(500)
    .refine((val) => !val || val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"))
    .nullable()
    .optional()
    .transform((v) => (!v ? null : v.trim())),
  cta_platform: z.string().optional(),
  location_type: z.enum(["in_person", "online", "hybrid"]).optional(),
  location_name: z.string().max(200).nullable().optional().transform((v) => (!v ? null : v.trim())),
  links: z
    .array(
      z.object({
        title: z.string().min(1).max(100).trim(),
        url: z.string().url().trim(),
        platform: z.string().min(1).default("website"),
      })
    )
    .optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  end_date: z.string().refine((val) => !val || !isNaN(Date.parse(val))).nullable().optional().transform((v) => (!v ? null : v)),
  is_active: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof announcementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

// ── Event Platform & Logistics Zod Schemas ──

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid("Invalid organization ID"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens")
    .trim(),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title cannot exceed 150 characters").trim(),
  subtitle: z.string().max(250).nullable().optional().transform((v) => (!v ? null : v.trim())),
  venue_name: z.string().min(2, "Venue name is required").max(200).trim(),
  start_time: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  end_time: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  poster_url: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional().transform((v) => (!v ? null : v.trim())),
  banner_url: z.string().url("Invalid image URL").or(z.literal("")).nullable().optional().transform((v) => (!v ? null : v.trim())),
  capacity_limit: z.number().int().min(1).default(500),
  waitlist_enabled: z.boolean().default(true),
  status: z.enum(["draft", "published_open", "waitlist_only", "registration_closed", "live_checkin", "concluded_archived"]).default("draft"),
  queue_count: z.number().int().min(1).max(10).default(4),
  queues_locked: z.boolean().default(false),
});

export const eventFormConfigSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  include_student_id: z.boolean().default(true),
  include_tshirt_size: z.boolean().default(true),
  include_dietary: z.boolean().default(true),
  custom_fields: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Question label is required"),
        type: z.enum(["text", "textarea", "select", "radio", "checkbox"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().default(false),
      })
    )
    .default([]),
  popia_consent_text: z.string().min(10, "Consent disclosure is required").default("I consent to having my professional contact info shared with official event sponsors upon badge scan at their booths in accordance with POPIA."),
});

export const eventRegistrationSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  first_name: z.string().min(1, "First name is required").max(60).trim(),
  last_name: z.string().min(1, "Last name is required").max(60).trim(),
  email: z.string().email("Valid email address is required").max(255).trim().toLowerCase(),
  affiliation_type: z.enum(["student", "industry"]).default("student"),
  affiliation_detail: z.string().min(2, "Course or Industry details required").max(150).trim(),
  student_id: z.string().max(50).nullable().optional().transform((v) => (!v ? null : v.trim())),
  tshirt_size: z.string().max(10).nullable().optional(),
  dietary_requirements: z.string().max(200).nullable().optional().transform((v) => (!v ? null : v.trim())),
  custom_responses: z.record(z.string(), z.any()).default({}),
  popia_consent_given: z.boolean().refine((val) => val === true, "You must consent to POPIA data processing terms"),
});

export const sponsorCompanySchema = z.object({
  id: z.string().uuid().optional(),
  event_id: z.string().uuid("Invalid event ID"),
  name: z.string().min(2, "Sponsor name is required").max(100).trim(),
  tier: z.enum(["title", "platinum", "gold", "community"]).default("community"),
  logo_url: z.string().url().or(z.literal("")).nullable().optional().transform((v) => (!v ? null : v.trim())),
  lead_fields: z.array(z.string()).default(["name", "email", "affiliation", "linkedin"]),
});

export const sponsorLeadScanSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  sponsor_company_id: z.string().uuid("Invalid sponsor company ID"),
  qr_token: z.string().min(10, "Valid ticket QR token required").trim(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const checkinScanSchema = z.object({
  event_id: z.string().uuid("Invalid event ID"),
  qr_token: z.string().min(10, "Valid ticket QR token required").trim(),
  allow_override: z.boolean().default(false),
});

export type EventInput = z.infer<typeof eventSchema>;
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

