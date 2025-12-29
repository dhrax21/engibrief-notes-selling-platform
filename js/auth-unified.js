import { supabase } from "./supabase.js";


/* =====================================================
   🔒 Google Login 
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");
  if (!googleBtn) return;

  googleBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/pages/auth-callback.html`,
      },
    });

    if (error) {
      console.error(error);
      showToast("Google login failed", "error");
    }
  });
});

/* =====================================================
   🔒 AUTH PAGE GUARD (CRITICAL)
===================================================== */

// 1️⃣ Immediate session check
const { data: sessionData } = await supabase.auth.getSession();

if (sessionData?.session?.user) {
  window.location.replace("/index.html");
} else {
  // Only attach listeners if user is NOT logged in

  supabase.auth.onAuthStateChange((event, session) => {
    if (
      (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
      session?.user
    ) {
      window.location.replace("/index.html");
    }
  });
}

/* =====================================================
   STATE
===================================================== */
let mode = "login";

/* =====================================================
   DOM ELEMENTS
===================================================== */
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

/* =====================================================
   TAB TOGGLING (LOGIN / SIGNUP)
===================================================== */
loginTab.addEventListener("click", () => switchMode("login"));
signupTab.addEventListener("click", () => switchMode("signup"));

function switchMode(newMode) {
  mode = newMode;

  loginTab.classList.toggle("active", mode === "login");
  signupTab.classList.toggle("active", mode === "signup");

  nameInput.classList.toggle("hidden", mode === "login");

  authTitle.textContent = mode === "login" ? "Login" : "Create Account";
  authSubtitle.textContent =
    mode === "login"
      ? "Access your Engibrief account"
      : "Create your Engibrief account";
}

/* =====================================================
   EMAIL AUTH (LOGIN + SIGNUP)
===================================================== */
window.emailAuth = async function () {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const name = nameInput.value.trim();

  if (!email || !password) {
    showToast("Email and password required", "error");
    return;
  }

  try {
    // SIGNUP
    if (mode === "signup") {
      if (!name) {
        showToast("Full name required", "error");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/pages/auth-callback.html`,
        },
      });

      if (error) throw error;

      showToast(
        "Account created. Please verify your email before login.",
        "success"
      );

      switchMode("login");
      return;
    }

    // LOGIN
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.session) {
      window.location.replace("/index.html");
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || "Authentication failed", "error");
  }
};




/* =====================================================
   TOAST
===================================================== */
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}
