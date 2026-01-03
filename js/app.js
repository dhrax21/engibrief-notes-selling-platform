import { supabase } from "/js/supabase.js";


const ADMIN_EMAIL = "manksingh36@gmail.com";

const ROUTES = {
  home: "/index.html",
  auth: "/pages/auth.html",
  profile: "/pages/profile.html",
  admin: "/pages/admin-upload.html",
  adminRzp: "/pages/admin-upload-rzp.html" 
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

  // 2️⃣ Derived user info (JWT-based)
  const isAdmin = user.user_metadata?.role === "admin";

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email;

  /* 🛠 ADMIN USER */
 if (isAdmin) {
  authArea.innerHTML = `
    <div class="admin-actions">
      <button class="admin-btn" id="adminUploadBtn">Upload</button>
      <button class="admin-btn" id="adminUploadRzpBtn">Upload RZP</button>
    </div>

    <span class="user-name">${displayName}</span>
    <a href="${ROUTES.profile}" class="nav-link">Profile</a>
    <button class="logout-btn" id="logoutBtn">Logout</button>
  `;

  document
    .getElementById("adminUploadBtn")
    ?.addEventListener("click", () => {
      window.location.href = ROUTES.admin;        // normal upload
    });

  document
    .getElementById("adminUploadRzpBtn")
    ?.addEventListener("click", () => {
      window.location.href = ROUTES.adminRzp;     // Razorpay upload
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
