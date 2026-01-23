import { supabase } from "/js/supabase.js";

const ROUTES = {
  home: "/index.html",
  auth: "/pages/auth.html",
  profile: "/pages/profile.html",
  admin: "/pages/admin-upload.html",
  adminBlog: "/pages/admin/blog-editor.html",
  adminRzp: "/pages/admin-upload-rzp.html",
};

/* =========================
   NAVBAR RENDER
========================= */
async function renderNavbar() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  authArea.innerHTML = "";

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  /* LOGGED OUT */
  if (!user) {
    authArea.innerHTML = `
      <a href="${ROUTES.auth}" class="nav-link">Login</a>
    `;
    return;
  }

  const isAdmin = user.user_metadata?.role === "admin";
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email;

  /* ADMIN */
  if (isAdmin) {
    authArea.innerHTML = `
      <div class="admin-actions">
        <button class="admin-btn" id="adminUploadBtn">Upload</button>
        <button class="admin-btn" id="adminUploadRzpBtn">Upload RZP</button>
         <button class="admin-btn admin-blog-btn" id="adminBlogBtn">
        Upload Blog
      </button>
      </div>
      <span class="user-name">${displayName}</span>
      <a href="${ROUTES.profile}" class="nav-link">Profile</a>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;

    document.getElementById("adminUploadBtn")
      ?.addEventListener("click", () => {
        window.location.href = ROUTES.admin;
      });
     document.getElementById("adminBlogBtn")
    ?.addEventListener("click", () => {
      window.location.href = ROUTES.adminBlog;
    });  

    document.getElementById("adminUploadRzpBtn")
      ?.addEventListener("click", () => {
        window.location.href = ROUTES.adminRzp;
      });
  } 
  /* NORMAL USER */
  else {
    authArea.innerHTML = `
      <span class="user-name">${displayName}</span>
      <a href="${ROUTES.profile}" class="nav-link">Profile</a>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;
  }

  document.getElementById("logoutBtn")
    ?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = ROUTES.home;
    });
}

/* =========================
   HAMBURGER INIT
========================= */
function initHamburger() {
  const hamburger = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    hamburger.classList.toggle("active");
  });
}

/* =========================
   INIT (SINGLE ENTRY POINT)
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  await renderNavbar();
  initHamburger();
});

/* =========================
   AUTH STATE CHANGE
========================= */
supabase.auth.onAuthStateChange(() => {
  renderNavbar();
});

window.renderNavbar = renderNavbar;
