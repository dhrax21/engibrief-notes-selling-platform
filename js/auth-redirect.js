import { supabase } from "/js/supabase.js";


/* =========================
   TOAST (SAFE)
========================= */
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) {
    console.warn("Toast element not found");
    return;
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}

/* =========================
   AUTH REDIRECT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // ✅ Show popup instead of alert
    showToast("You are already logged in", "info", 1000);

    // ✅ Redirect AFTER user sees popup
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 2000);
  }
});
