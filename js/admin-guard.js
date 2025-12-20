import { supabase } from "./supabase.js";

const ADMIN_EMAIL = "manksingh36@gmail.com";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // 🚫 Not logged in → login page
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // 🚫 Logged in but not admin → home page
  if (user.email !== ADMIN_EMAIL) {
    window.location.href = "index.html";
    return;
  }

  // 👑 Admin allowed → do nothing
});
