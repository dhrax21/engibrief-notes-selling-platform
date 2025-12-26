import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL =
  "https://vzetfjzfvfhfvcqpkbbd.supabase.co";

export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZXRmanpmdmZoZnZjcXBrYmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDI3OTEsImV4cCI6MjA4MTYxODc5MX0.lJe-FZ1pP1ZM7rXu9Fu2Y6-P01kp2F8hfnoKZ3vUJtQ";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
