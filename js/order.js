import { supabase } from "./supabase.js";

const grid = document.getElementById("ordersGrid");

/* =========================
   AUTH CHECK
========================= */
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  location.href = "login.html";
}

/* =========================
   FETCH ORDERS
========================= */
const { data, error } = await supabase
  .from("purchases")
  .select(`
    id,
    ebooks (
      title,
      pdf_path
    )
  `)
  .eq("user_id", user.id);

if (error) {
  alert("Failed to load orders");
  console.error(error);
}

/* =========================
   RENDER
========================= */
grid.innerHTML = (data || []).map(o => `
  <div class="order-card">
    <h3>${o.ebooks.title}</h3>
    <button onclick="download('${o.ebooks.pdf_path}')">
      Download
    </button>
  </div>
`).join("");

/* =========================
   DOWNLOAD (SECURE)
========================= */
window.download = async (path) => {
  const { data, error } = await supabase
    .storage
    .from("ebooks")
    .createSignedUrl(path, 60); // 60 seconds

  if (error) {
    alert("Download failed");
    return;
  }

  window.open(data.signedUrl, "_blank");
};
