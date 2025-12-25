import { supabase } from "/js/supabase.js";

/* =====================================================
   🔒 AUTH PAGE GUARD (CRITICAL)
===================================================== */

// 1️⃣ Immediate session check (blocks refresh, direct access)
const { data: sessionData } = await supabase.auth.getSession();

if (sessionData?.session?.user) {
  window.location.replace("/index.html");
  throw new Error("Auth page blocked: user already logged in");
}

// 2️⃣ Listen to auth state changes (Google OAuth, back button)
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    window.location.replace("/index.html");
  }
});

/* =====================================================
   STATE
===================================================== */
let mode = "login";        // login | signup
let authMethod = "email"; // email | phone

/* =====================================================
   DOM ELEMENTS
===================================================== */
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const emailTab = document.getElementById("emailTab");
const phoneTab = document.getElementById("phoneTab");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailAuthBox = document.getElementById("emailAuth");
const phoneAuthBox = document.getElementById("phoneAuth");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

/* =====================================================
   TAB TOGGLING
===================================================== */
loginTab.addEventListener("click", () => switchMode("login"));
signupTab.addEventListener("click", () => switchMode("signup"));

emailTab.addEventListener("click", () => switchMethod("email"));
phoneTab.addEventListener("click", () => switchMethod("phone"));

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

function switchMethod(method) {
  authMethod = method;

  emailTab.classList.toggle("active", method === "email");
  phoneTab.classList.toggle("active", method === "phone");

  emailAuthBox.classList.toggle("hidden", method !== "email");
  phoneAuthBox.classList.toggle("hidden", method !== "phone");
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
          emailRedirectTo: `${window.location.origin}/pages/auth-callback.html`
        }
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
      password
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
   GOOGLE AUTH
===================================================== */
window.loginWithGoogle = async function () {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/pages/auth-callback.html`
    }
  });

  if (error) {
    console.error(error);
    showToast("Google login failed", "error");
  }
};

/* =====================================================
   PHONE AUTH (STUB)
===================================================== */
window.sendOTP = () => showToast("Phone auth not enabled yet", "info");
window.verifyOTP = () => showToast("Phone auth not enabled yet", "info");

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

console.log("✅ auth-unified loaded (guard active)");
