import { supabase } from "/js/supabase.js";

/* =========================
   🔒 AUTH PAGE HARD GUARD
========================= */

// 1️⃣ Immediate session check
const { data: sessionData } = await supabase.auth.getSession();

if (sessionData?.session?.user) {
  window.location.replace("/index.html");
  return;
}

// 2️⃣ Listen for auth changes (OAuth, refresh, back button)
supabase.auth.onAuthStateChange((event, session) => {
  if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
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
