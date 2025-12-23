import { supabase } from "./supabase.js";

/* =========================
   SIGNUP
========================= */
window.signupUser = async () => {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value.trim();

  if (!name || !email || !password) {
    showToast("All fields are required", "error");
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name // stored temporarily in user metadata
        },
        emailRedirectTo: `${window.location.origin}/pages/login.html`
      }
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    // 🔐 Email confirmation ON
    if (!data.session) {
      showToast(
        "Account created. Please verify your email before login.",
        "success"
      );
      window.location.href = "/pages/login.html";
      return;
    }

    // 🔐 Email confirmation OFF
    showToast("Account created successfully!", "success");  
    window.location.href = "/index.html";

  } catch (err) {
    console.error("Signup failed:", err);
    showToast("Signup failed. Please try again.", "error");
  }
};


/* =========================
   LOGIN
========================= */
window.loginUser = async () => {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  // ✅ Supabase v2 safe check
  if (data?.session) {
    window.location.href = "/index.html";
  }
};

/* =========================
   LOGOUT
========================= */
window.logoutUser = async () => {
  await supabase.auth.signOut();
  window.location.href = "/pages/login.html";
};

console.log("Supabase auth module loaded");

function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message); // fallback
    return;
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}

