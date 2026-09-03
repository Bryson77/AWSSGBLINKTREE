/**
 * HTML and Markdown Sanitizer
 * Cybersecurity Hardening against Stored and Reflected Cross-Site Scripting (XSS).
 */

import DOMPurify from "dompurify";

/**
 * Strips dangerous HTML tags, inline event handlers, and script schemas from text using DOMPurify.
 */
export function sanitizeContent(dirtyHtml: string): string {
  if (!dirtyHtml) return "";

  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: [
        "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "ul", "ol", "li",
        "blockquote", "pre", "code", "table", "thead", "tbody",
        "tr", "th", "td", "img", "hr", "br", "strong", "em", "span", "del"
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }

  // Server / Edge headless fallback
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:[^,]+,[^"'\s>]+/gi, "")
    .replace(/vbscript\s*:/gi, "");
}

/**
 * HTML entity encoder for untrusted plain text.
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
