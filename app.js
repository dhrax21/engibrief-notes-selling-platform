/************************************************************
 * APP.JS – ENGIBRIEFS (CLEAN, FINAL, MODULAR)
 ************************************************************/

/* ==================== IMPORTS ==================== */
import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ==================== INIT ==================== */
console.log("app.js loaded");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ==================== AUTH STATE HANDLER ==================== */
let authHandled = false;

onAuthStateChanged(auth, async (user) => {
  if (authHandled) return;
  authHandled = true;

  const path = window.location.pathname;
  /* ---------- NAVBAR AUTH UI ---------- */
const authArea = document.getElementById("authArea");

if (authArea) {
  if (user) {
    authArea.innerHTML = `
      <div class="nav-user">
        <span class="nav-username">
          ${user.displayName || user.email}
        </span>
        <a href="profile.html" class="nav-link"></a>
        <button class="logout-btn" onclick="logoutUser()">Logout</button>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <a href="login.html" class="login-btn">Login</a>
    `;
  }
}


  console.log("Auth state:", user ? user.email : "NO USER");

  /* ---------- LOGIN PAGE ---------- */
  if (path.includes("login.html")) {
    if (user) {
      window.location.replace("index.html");
    }
    return;
  }

  /* ---------- ADMIN PAGE ---------- */
  if (path.includes("admin.html")) {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    const token = await user.getIdTokenResult(true);
    console.log("Admin claims:", token.claims);

    if (!token.claims.admin) {
      alert("Admins only");
      window.location.replace("index.html");
      return;
    }
  }

  /* ---------- PROFILE PAGE ---------- */
  if (path.includes("profile.html")) {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");

    if (nameInput) nameInput.value = user.displayName || "";
    if (emailInput) emailInput.value = user.email || "";
  }
});

/* ==================== AUTH FUNCTIONS ==================== */

// LOGIN
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

// SIGNUP
async function signupUser() {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value;

  if (!name || !email || !password) {
    alert("All fields are required");
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

// GOOGLE LOGIN
async function googleLogin() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    window.location.replace("index.html");
  } catch (err) {
    alert(err.message);
  }
}

// FORGOT PASSWORD
async function forgotPassword() {
  const email = document.getElementById("loginEmail")?.value;

  if (!email) {
    alert("Enter your email first");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent");
  } catch (err) {
    alert(err.message);
  }
}

// LOGOUT
async function logoutUser() {
  await signOut(auth);
  window.location.replace("login.html");
}

/* ==================== ADMIN UPLOAD ==================== */
async function uploadEbook() {
  try {
    const title = document.getElementById("title")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const price = Number(document.getElementById("price")?.value);
    const tags = document.getElementById("tags")?.value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const coverImage = document.getElementById("coverImage")?.files[0];
    const pdfFile = document.getElementById("pdfFile")?.files[0];

    if (!title || !price || !coverImage || !pdfFile) {
      alert("All fields are required");
      return;
    }

    if (pdfFile.type !== "application/pdf") {
      alert("Only PDF files allowed");
      return;
    }

    const ts = Date.now();

    const coverRef = ref(storage, `ebooks/covers/${ts}-${coverImage.name}`);
    await uploadBytes(coverRef, coverImage);
    const coverURL = await getDownloadURL(coverRef);

    const pdfRef = ref(storage, `ebooks/pdfs/${ts}-${pdfFile.name}`);
    await uploadBytes(pdfRef, pdfFile);
    const pdfURL = await getDownloadURL(pdfRef);

    await addDoc(collection(db, "ebooks"), {
      title,
      description,
      price,
      tags,
      coverURL,
      pdfURL,
      createdAt: serverTimestamp()
    });

    alert("E-book uploaded successfully");
    document.getElementById("addProductForm")?.reset();

  } catch (err) {
    alert("Upload failed: " + err.message);
  }
}

/* ==================== EXPOSE TO HTML ==================== */
window.loginUser = loginUser;
window.signupUser = signupUser;
window.googleLogin = googleLogin;
window.forgotPassword = forgotPassword;
window.logoutUser = logoutUser;
window.uploadEbook = uploadEbook;
