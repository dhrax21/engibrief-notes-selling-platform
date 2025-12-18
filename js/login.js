import { supabase } from "./supabase.js";

const msg = document.getElementById("msg");

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
  } else {
    window.location.href = "admin.html";
  }
};
