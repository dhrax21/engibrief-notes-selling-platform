import { supabase } from "./supabase.js";

window.forgotPassword = async () => {
  const email = document.getElementById("forgotEmail")?.value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/reset-password.html`
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset link sent. Please check your email.");
};
