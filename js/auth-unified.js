import { supabase } from "./supabase.js";

/* =========================
   GLOBAL STATE
========================= */
let mode = "login"; // login | signup
let phoneNumber = "";

/* =========================
   TOAST
========================= */
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

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

  // ===== SAFE QUERY HELPER =====
  const $ = (id) => document.getElementById(id);

  const loginTab = $("loginTab");
  const signupTab = $("signupTab");
  const emailTab = $("emailTab");
  const phoneTab = $("phoneTab");
  const emailAuth = $("emailAuth");
  const phoneAuth = $("phoneAuth");
  const nameInput = $("name");
  const authTitle = $("authTitle");
  const authSubtitle = $("authSubtitle");

  // ===== FORCE LOGIN MODE ON LOAD =====
  if (loginTab) loginTab.classList.add("active");
  if (signupTab) signupTab.classList.remove("active");
  if (nameInput) nameInput.classList.add("hidden");

  if (authTitle) authTitle.textContent = "Login";
  if (authSubtitle)
    authSubtitle.textContent = "Access your Engibrief account";

  // ===== LOGIN / SIGNUP TOGGLE =====
  if (loginTab && signupTab) {
    loginTab.onclick = () => {
      mode = "login";
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      if (nameInput) nameInput.classList.add("hidden");
      if (authTitle) authTitle.textContent = "Login";
      if (authSubtitle)
        authSubtitle.textContent = "Access your Engibrief account";
    };

    signupTab.onclick = () => {
      mode = "signup";
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      if (nameInput) nameInput.classList.remove("hidden");
      if (authTitle) authTitle.textContent = "Create Account";
      if (authSubtitle)
        authSubtitle.textContent = "Start accessing premium notes";
    };
  }

  // ===== EMAIL / PHONE TOGGLE =====
  if (emailTab && phoneTab && emailAuth && phoneAuth) {
    emailTab.onclick = () => {
      emailTab.classList.add("active");
      phoneTab.classList.remove("active");
      emailAuth.classList.remove("hidden");
      phoneAuth.classList.add("hidden");
    };

    phoneTab.onclick = () => {
      phoneTab.classList.add("active");
      emailTab.classList.remove("active");
      phoneAuth.classList.remove("hidden");
      emailAuth.classList.add("hidden");
    };
  }
});


/* =========================
   EMAIL LOGIN / SIGNUP
========================= */
window.emailAuth = async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast("Email and password required", "error");
    return;
  }

  /* ===== LOGIN ===== */
if (mode === "login") {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Login failed:", error.message);

    // 🔔 FORCE USER-VISIBLE ERROR
    showToast("Incorrect email or password", "error", 4000);
    return;
  }

  // ✅ Login success
  window.location.href = "/index.html";
  return;
}


  /* ===== SIGNUP ===== */
  if (!name) {
    showToast("Full name required for signup", "error");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${window.location.origin}/pages/auth.html`
    }
  });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  if (!data.session) {
    showToast("Verify your email before login", "success");
    return;
  }

  window.location.href = "/index.html";
};

/* =========================
   GOOGLE AUTH
========================= */
window.loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/index.html`
    }
  });

  if (error) showToast(error.message, "error");
};

/* =========================
   PHONE OTP AUTH
========================= */
window.sendOTP = async () => {
  phoneNumber = document.getElementById("phone").value.trim();

  if (!phoneNumber) {
    showToast("Enter phone number", "error");
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber
  });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("OTP sent", "success");
};

window.verifyOTP = async () => {
  const otp = document.getElementById("otp").value.trim();

  if (!otp) {
    showToast("Enter OTP", "error");
    return;
  }

  const { error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: otp,
    type: "sms"
  });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  window.location.href = "/index.html";
};
