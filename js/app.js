import { supabase } from "/js/supabase.js";


const ADMIN_EMAIL = "manksingh36@gmail.com";

const ROUTES = {
  home: "/index.html",
  auth: "/pages/auth.html",
  profile: "/pages/profile.html",
  admin: "/pages/admin-upload.html"
};

async function renderNavbar() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  authArea.innerHTML = "";

  // 1️⃣ Get session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  /* 🚫 LOGGED OUT */
  if (!user) {
    authArea.innerHTML = `
      <a href="${ROUTES.auth}" class="nav-link">Login</a>
    `;
    return;
  }

  // 2️⃣ Fetch profile name
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch error:", error);
  }

  const displayName = profile?.full_name || user.email;

  /* 👑 ADMIN */
  if (user.email === ADMIN_EMAIL) {
    authArea.innerHTML = `
      <button class="admin-btn" id="adminUploadBtn">Upload</button>
      <span class="user-name">${displayName}</span>
      <a href="${ROUTES.profile}" class="nav-link">Profile</a>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;

    document
      .getElementById("adminUploadBtn")
      ?.addEventListener("click", () => {
        window.location.href = ROUTES.admin;
      });
  }

  /* 👤 NORMAL USER */
  else {
    authArea.innerHTML = `
      <span class="user-name">${displayName}</span>
      <a href="${ROUTES.profile}" class="nav-link">Profile</a>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;
  }

  /* 🔓 LOGOUT */
  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = ROUTES.home;
    });
}

/* =========================
   INITIAL LOAD
========================= */
document.addEventListener("DOMContentLoaded", renderNavbar);

/* =========================
   AUTH STATE CHANGE
========================= */
supabase.auth.onAuthStateChange(() => {
  renderNavbar();
});


document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
});
