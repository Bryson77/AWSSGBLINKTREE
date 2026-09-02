/**
 * Link and Telemetry data types — shared across Web and Admin apps.
 */

export interface LinkItem {
  id: string;
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
  clicked_at: string;
  user_agent?: string | null;
  referrer?: string | null;
  country?: string | null;
}
