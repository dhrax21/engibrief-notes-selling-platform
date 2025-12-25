import { supabase } from "/js/supabase.js";

/* =========================
   PROFILE PAGE GUARD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  if (!user) {
    window.location.replace("/pages/auth.html");
    return;
  }
});
