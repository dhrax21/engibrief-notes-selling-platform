import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Check auth session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("/pages/auth.html");
    return;
  }

  // 2️⃣ Fetch role from DB (source of truth)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    console.error("Profile fetch failed", error);
    window.location.replace("/index.html");
    return;
  }

  // 3️⃣ Enforce admin role
  if (profile.role !== "admin") {
    window.location.replace("/index.html");
    return;
  }

  // 👑 Admin confirmed → allow page
});
