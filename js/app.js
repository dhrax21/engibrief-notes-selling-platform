import { supabase } from "./supabase.js";

const ADMIN_EMAIL = "manksingh36@gmail.com";

/* =========================
   RENDER NAVBAR
========================= */
async function renderNavbar() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  const { data: { user } } = await supabase.auth.getUser();

  // 👑 ADMIN
  if (user && user.email === ADMIN_EMAIL) {
    authArea.innerHTML = `
      <button class="admin-btn" id="adminUploadBtn">Upload</button>
      <span class="user-name">${user.email}</span>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;

    document
      .getElementById("adminUploadBtn")
      ?.addEventListener("click", () => {
        window.location.href = "admin.html";
      });
  }

  // 👤 NORMAL USER
  else if (user) {
    authArea.innerHTML = `
      <span class="user-name">${user.email}</span>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;
  }

  // 🚫 LOGGED OUT
  else {
    authArea.innerHTML = `<a href="login.html">Login</a>`;
  }

  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
}

/* =========================
   INITIAL RENDER
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
});

/* =========================
   AUTH STATE LISTENER (CRITICAL)
========================= */
supabase.auth.onAuthStateChange(() => {
  renderNavbar();
});
