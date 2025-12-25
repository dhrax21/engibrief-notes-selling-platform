import { supabase } from "/js/supabase.js";


const ADMIN_EMAIL = "manksingh36@gmail.com";

document.addEventListener("DOMContentLoaded", async () => {
  // ✅ SAFE auth check
  const { data: { session } } = await supabase.auth.getSession();

  // 🚫 Not logged in → login page
  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  const user = session.user;

  // 🚫 Logged in but not admin → home page
  if (user.email !== ADMIN_EMAIL) {
    window.location.href = "/index.html";
    return;
  }

  // 👑 Admin allowed → continue
});
