import { supabase } from "/js/supabase.js";

const msg = document.getElementById("msg");

window.login = async () => {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    msg.textContent = "Email and password are required";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  // ✅ Confirm session (Supabase v2 safe)
  if (data?.session) {
    window.location.href = "/pages/admin.html";
  }
};
