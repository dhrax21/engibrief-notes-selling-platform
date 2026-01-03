import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const statusText = document.getElementById("statusText");
  const backBtn = document.getElementById("backBtn");

  const params = new URLSearchParams(window.location.search);
  const ebookId = params.get("ebook_id");

  if (!ebookId) {
    statusText.textContent = "Invalid purchase reference.";
    return;
  }

  /* =========================
     AUTH CHECK
  ========================= */
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    statusText.textContent = "Please login to continue.";
    setTimeout(() => {
      window.location.replace("/pages/auth.html");
    }, 2000);
    return;
  }

  const userId = session.user.id;

  /* =========================
     RECORD PURCHASE
  ========================= */
  const { error } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      ebook_id: ebookId,
      payment_status: "paid"
    });

  if (error) {
    // Duplicate purchase (already recorded)
    if (error.code === "23505") {
      statusText.textContent = "Purchase already recorded.";
    } else {
      console.error(error);
      statusText.textContent =
        "We could not record your purchase. Please contact support.";
      return;
    }
  } else {
    statusText.textContent = "Access recorded successfully.";
  }

  backBtn.classList.remove("hidden");
});
