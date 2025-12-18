import { supabase } from "./supabase.js";

/* SIGNUP */
window.signupUser = async () => {
  const email = document.getElementById("signupEmail")?.value;
  const password = document.getElementById("signupPassword")?.value;

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Account created. Please log in.");
  window.location.href = "login.html";
};

/* LOGIN */
window.loginUser = async () => {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Email & password required");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "index.html";
};

/* LOGOUT */
window.logoutUser = async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
};

console.log("🔐 Supabase auth module loaded");
