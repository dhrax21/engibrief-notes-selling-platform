import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();


  if (user) {
    alert("You are already logged in! ")
    window.location.href = "index.html";
  }
});
