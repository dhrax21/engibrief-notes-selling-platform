import { supabase } from "/js/supabase.js";

/* =========================
   🔒 AUTH PAGE HARD GUARD
========================= */

// 1️⃣ Immediate session check (runs before UI)
const { data: sessionData } = await supabase.auth.getSession();

if (sessionData?.session?.user) {
  window.location.replace("/index.html");
  throw new Error("Auth page blocked: user already logged in");
}

// 2️⃣ Listen for auth state changes (OAuth, refresh, back button)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    window.location.replace("/index.html");
  }
});

/* =========================
   OPTIONAL TOAST (UX ONLY)
========================= */
function showToast(message, type = "info", duration = 1500) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}
