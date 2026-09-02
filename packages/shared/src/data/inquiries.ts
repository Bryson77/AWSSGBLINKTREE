/**
 * Inquiry data types — shared across Web and Admin apps.
 */

export interface InquiryItem {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
}
