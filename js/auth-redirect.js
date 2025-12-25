import { supabase } from "/js/supabase.js";

let redirected = false;

/* =========================
   TOAST (SAFE)
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

/* =========================
   AUTH PAGE GUARD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  if (redirected) return;

  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (session) {
    redirected = true;

    showToast("You are already logged in", "info");

    setTimeout(() => {
      window.location.replace("/index.html"); // ✅ safer than href
    }, 1200);
  }
});
