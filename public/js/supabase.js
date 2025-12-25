import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://vzetfjzfvfhfvcqpkbbd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZXRmanpmdmZoZnZjcXBrYmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDI3OTEsImV4cCI6MjA4MTYxODc5MX0.lJe-FZ1pP1ZM7rXu9Fu2Y6-P01kp2F8hfnoKZ3vUJtQ"
);
