import { supabase } from "/js/supabase.js";


document.addEventListener("DOMContentLoaded", async () => {

  const grid = document.getElementById("ordersGrid");
  if (!grid) {
    console.error("ordersGrid not found in DOM");
    return;
  }

  /* =========================
     AUTH CHECK (SAFE)
  ========================= */
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "/pages/login.html";
    return;
  }

  const user = session.user;

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
    console.error("Orders fetch failed:", error);
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
      <button data-path="${o.ebook?.pdf_path}">
        Download
      </button>
    </div>
  `).join("");

  /* Attach handlers safely */
  grid.querySelectorAll("button[data-path]").forEach(btn => {
    btn.addEventListener("click", () => {
      downloadEbook(btn.dataset.path);
    });
  });
});

/* =========================
   DOWNLOAD (SECURE)
========================= */
async function downloadEbook(path) {
  if (!path) {
    alert("File not available");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Session expired. Please login again.");
    window.location.href = "/pages/login.html";
    return;
  }

  const { data, error } = await supabase
    .storage
    .from("ebooks")
    .createSignedUrl(path, 60); // 60 seconds

  if (error) {
    console.error("Signed URL error:", error);
    alert("Download failed");
    return;
  }

  window.open(data.signedUrl, "_blank");
}
