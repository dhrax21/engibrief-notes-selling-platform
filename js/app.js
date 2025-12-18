import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("📦 app.js loaded");

onAuthStateChanged(auth, async (user) => {
  console.log("👤 Auth state:", user?.email || "NO USER");

  /* =========================
     NAVBAR STATE
  ========================= */
  const authArea = document.getElementById("authArea");
  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <span class="user-name">${user.displayName || user.email}</span>
        <button class="logout-btn" onclick="logoutUser()">Logout</button>
      `;
    } else {
      authArea.innerHTML = `<a href="login.html">Login</a>`;
    }
  }

  /* =========================
     ADMIN CHECK (Pattern 2)
  ========================= */
  if (user) {
    const token = await user.getIdTokenResult();
    console.log("🔑 Admin claims:", token.claims);

    if (token.claims.admin) {
      document.body.classList.add("is-admin");
    }
  }

  /* =========================
     ADMIN PAGE PROTECTION
  ========================= */
  if (location.pathname.includes("admin.html")) {
    if (!user) {
      location.href = "login.html";
      return;
    }

    const token = await user.getIdTokenResult();
    if (!token.claims.admin) {
      alert("Admins only");
      location.href = "index.html";
      return;
    }
  }

  /* =========================
     PROFILE PAGE
  ========================= */
  if (location.pathname.includes("profile.html") && user) {
    const emailEl = document.getElementById("profileEmail");
    const nameEl = document.getElementById("profileName");

    if (emailEl) emailEl.value = user.email;
    if (nameEl) nameEl.value = user.displayName || "";
  }
});

/* =========================
   LOGOUT
========================= */
window.logoutUser = async () => {
  await signOut(auth);
  location.href = "index.html";
};
