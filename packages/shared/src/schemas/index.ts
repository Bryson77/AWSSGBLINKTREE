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
