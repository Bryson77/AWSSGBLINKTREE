/**
 * Link data types — shared between landing page and admin.
 */

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  platform: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
