import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWdrcmV1Y3ZiZnRvbGlqdHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODc3NzcsImV4cCI6MjEwMzg2Mzc3N30.qvIN3i_hTOEclyULEZhUZg_8PbNC4xM277EOjvjH9OU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
