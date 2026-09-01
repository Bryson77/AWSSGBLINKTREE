/**
 * Link data types — shared across Web and Admin apps.
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
