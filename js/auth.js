import { supabase } from "/js/supabase.js";




/* =========================
   AUTH PAGE GUARD
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  if (user) {
    // Optional UX
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = "You are already logged in";
      toast.className = "toast info show";
    }

    setTimeout(() => {
      window.location.replace("/index.html");
    }, 1000);

    return;
  }

  // ✅ If NOT logged in, auth page continues normally
});



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
        data: { name },
        emailRedirectTo: `${window.location.origin}/pages/login.html`
      }
    });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    if (!data.session) {
      showToast(
        "Account created. Please verify your email before login.",
        "success"
      );
      window.location.href = "/pages/login.html";
      return;
    }

    showToast("Account created successfully!", "success");
    window.location.href = "/index.html";

  } catch (err) {
    console.error(err);
    showToast("Signup failed. Try again.", "error");
  }
};

/* =========================
   LOGIN
========================= */
window.loginUser = async () => {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    showToast("Email & password required", "error");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  if (data?.session) {
    window.location.href = "/index.html";
  }
};

/* =========================
   GOOGLE LOGIN
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLoginBtn");

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
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
    });
  }
});

/* =========================
   LOGOUT
========================= */
window.logoutUser = async () => {
  await supabase.auth.signOut();
  window.location.href = "/pages/login.html";
};

/* =========================
   NAVBAR AUTH STATE
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    authArea.innerHTML = `
      <span class="nav-user">Hi, ${user.email}</span>
      <button class="nav-btn" onclick="logoutUser()">Logout</button>
    `;
  } else {
    authArea.innerHTML = `
      <a href="/pages/login.html" class="nav-btn">Login</a>
      <a href="/pages/signup.html" class="nav-btn primary">Sign Up</a>
    `;
  }
});

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

console.log("✅ Supabase auth loaded");
