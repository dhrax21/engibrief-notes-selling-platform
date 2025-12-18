import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { auth } from "./firebase.js";



import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* SIGNUP */
window.signupUser = async function () {
  const email = document.getElementById("signupEmail")?.value;
  const password = document.getElementById("signupPassword")?.value;

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  await createUserWithEmailAndPassword(auth, email, password);
  window.location.href = "index.html";
};

/* LOGIN */
window.loginUser = async function () {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  await signInWithEmailAndPassword(auth, email, password);
  window.location.href = "index.html";
};

/* LOGOUT */
window.logoutUser = async function () {
  await signOut(auth);
  window.location.href = "login.html";
};

console.log("🔐 Auth module loaded");
