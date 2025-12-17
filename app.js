/************************************************************
 * APP.JS – ENGIBRIEFS (STABLE, RESTORED)
 ************************************************************/
console.log("🔥 app.js loaded");

import { firebaseConfig } from "./firebase-config.js";

/* ==================== FIREBASE IMPORTS ==================== */
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ==================== INIT ==================== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ==================== AUTH STATE ==================== */
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;

  console.log("Auth state:", user ? user.email : "NO USER");

  // Navbar
  const authArea = document.getElementById("authArea");
  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <span>${user.displayName || user.email}</span>
        <button onclick="logoutUser()">Logout</button>
      `;
    } else {
      authArea.innerHTML = `<a href="login.html">Login</a>`;
    }
  }

  // Login page redirect
  if (path.includes("login.html") && user) {
    window.location.replace("index.html");
  }

  // Admin protection
  if (path.includes("admin.html")) {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    const token = await user.getIdTokenResult(true);
    if (!token.claims.admin) {
      alert("Admins only");
      window.location.replace("index.html");
    }
  }
});

/* ==================== AUTH FUNCTIONS ==================== */
async function loginUser() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.replace("index.html");
  } catch (err) {
    alert(err.message);
  }
}

async function signupUser() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value;

  if (!name || !email || !password) {
    alert("All fields required");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    window.location.replace("index.html");
  } catch (err) {
    alert(err.message);
  }
}

async function googleLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
  window.location.replace("index.html");
}

async function forgotPassword() {
  const email = document.getElementById("loginEmail")?.value;
  if (!email) return alert("Enter email first");

  await sendPasswordResetEmail(auth, email);
  alert("Password reset email sent");
}

async function logoutUser() {
  await signOut(auth);
  window.location.href = "login.html";
}

/* ==================== ADMIN UPLOAD ==================== */
async function uploadEbook(event) {
  event.preventDefault();

  try {
    console.log("🚀 Upload started");

    const title = document.getElementById("title")?.value.trim();
    const subject = document.getElementById("subject")?.value.trim();
    const price = Number(document.getElementById("price")?.value);
    const coverFile = document.getElementById("coverImage")?.files[0];
    const pdfFile = document.getElementById("pdfFile")?.files[0];

    if (!title || !subject || !price || !coverFile || !pdfFile) {
      alert("All fields required");
      return;
    }

    const docRef = await addDoc(collection(db, "ebooks"), {
      title,
      subject,
      price,
      isActive: true,
      createdAt: serverTimestamp()
    });

    const coverRef = ref(storage, `ebooks/covers/${docRef.id}`);
    await uploadBytes(coverRef, coverFile);
    const coverURL = await getDownloadURL(coverRef);

    const pdfRef = ref(storage, `ebooks/pdfs/${docRef.id}.pdf`);
    await uploadBytes(pdfRef, pdfFile);
    const pdfURL = await getDownloadURL(pdfRef);

    await updateDoc(docRef, { coverURL, pdfURL });

    alert("Ebook uploaded successfully");
    document.getElementById("addProductForm").reset();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

/* ==================== DRAG & DROP ==================== */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".drop-zone").forEach(zone => {
    const input = zone.querySelector("input");
    const text = zone.querySelector(".drop-text");
    const subtext = zone.querySelector(".drop-subtext");

    if (!input || !text) return;

    // Click opens file picker
    zone.addEventListener("click", () => {
      input.click();
    });

    // Allow drop
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    // Handle drop
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // Attach file to hidden input (correct way)
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;

      // Update UI
      text.textContent = file.name;
      if (subtext) subtext.style.display = "none";

      console.log("✅ File attached:", file.name);
    });

    // Handle manual selection
    input.addEventListener("change", () => {
      if (!input.files.length) return;
      text.textContent = input.files[0].name;
      if (subtext) subtext.style.display = "none";
    });
  });
});




/* ==================== GLOBAL EXPORTS ==================== */
window.loginUser = loginUser;
window.signupUser = signupUser;
window.googleLogin = googleLogin;
window.forgotPassword = forgotPassword;
window.logoutUser = logoutUser;
window.uploadEbook = uploadEbook;




