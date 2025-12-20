import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {

  const grid = document.getElementById("ordersGrid");
  if (!grid) {
    console.error("❌ ordersGrid not found in DOM");
    return;
  }

  /* =========================
     AUTH CHECK
  ========================= */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    location.href = "login.html";
    return;
  }

  /* =========================
     FETCH PAID ORDERS ONLY
  ========================= */
  const { data, error } = await supabase
    .from("purchases")
    .select(`
      id,
      ebook:ebooks (
        title,
        pdf_path
      )
    `)
    .eq("user_id", user.id)
    .eq("payment_status", "paid");

  if (error) {
    console.error("❌ Orders fetch failed:", error);
    alert("Failed to load orders");
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = "<p>No purchases yet.</p>";
    return;
  }

  /* =========================
     RENDER
  ========================= */
  grid.innerHTML = data.map(o => `
    <div class="order-card">
      <h3>${o.ebook?.title ?? "Untitled"}</h3>
      <button onclick="downloadEbook('${o.ebook?.pdf_path}')">
        Download
      </button>
    </div>
  `).join("");

});

/* =========================
   DOWNLOAD (SECURE)
========================= */
window.downloadEbook = async (path) => {
  if (!path) {
    alert("File not available");
    return;
  }

  const { data, error } = await supabase
    .storage
    .from("ebooks")
    .createSignedUrl(path, 60);

  if (error) {
    console.error("❌ Signed URL error:", error);
    alert("Download failed");
    return;
  }

  window.open(data.signedUrl, "_blank");
};
