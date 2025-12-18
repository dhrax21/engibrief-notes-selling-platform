import { supabase } from "./supabase.js";

console.log("📦 app.js loaded");

/* =========================
   AUTH STATE LISTENER
========================= */
supabase.auth.onAuthStateChange((_event, session) => {
  const user = session?.user || null;
  const authArea = document.getElementById("authArea");

  if (!authArea) return;

  if (user) {
    authArea.innerHTML = `
      <span class="user-name">${user.email}</span>
      <button class="logout-btn" id="logoutBtn">Logout</button>
    `;

    document
      .getElementById("logoutBtn")
      .addEventListener("click", logoutUser);

  } else {
    authArea.innerHTML = `<a href="login.html">Login</a>`;
  }
});

/* =========================
   LOGOUT FUNCTION
========================= */
async function logoutUser() {
  console.log("🚪 Logging out...");

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("❌ Logout failed:", error);
    alert("Logout failed");
    return;
  }

  console.log("✅ Logged out");
  window.location.href = "index.html";
}
