import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("ebookGrid");
  const deptFilter = document.getElementById("departmentFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (!grid || !deptFilter || !sortFilter) return;

  let allEbooks = [];
  let purchasedSet = new Set();
  const coverCache = new Map();

  /* =========================
     AUTH (SAFE)
  ========================= */
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  /* =========================
     INIT
  ========================= */
  await loadPurchases();
  await loadEbooks();
  await render();

  deptFilter.addEventListener("change", render);
  sortFilter.addEventListener("change", render);

  /* =========================
     LOAD PURCHASES
  ========================= */
  async function loadPurchases() {
    if (!user) return;

    const { data } = await supabase
      .from("purchases")
      .select("ebook_id")
      .eq("user_id", user.id)
      .eq("payment_status", "paid");

    (data || []).forEach(p => purchasedSet.add(p.ebook_id));
  }

  /* =========================
     LOAD EBOOKS
  ========================= */
  async function loadEbooks() {
    const { data, error } = await supabase
      .from("ebooks")
      .select("*")
      .eq("is_active", true);

    if (error) {
      alert("Failed to load ebooks");
      return;
    }

    allEbooks = data || [];
  }

  /* =========================
     SIGNED COVER (CACHED)
  ========================= */
  async function getCoverUrl(path) {
    if (!path) return null;
    if (coverCache.has(path)) return coverCache.get(path);

    const { data } = await supabase
      .storage
      .from("ebooks")
      .createSignedUrl(path, 300);

    coverCache.set(path, data?.signedUrl ?? null);
    return data?.signedUrl ?? null;
  }

  /* =========================
     RENDER
  ========================= */
  async function render() {
    let ebooks = [...allEbooks];

    if (deptFilter.value !== "ALL") {
      ebooks = ebooks.filter(e => e.department === deptFilter.value);
    }

    if (sortFilter.value === "low") ebooks.sort((a, b) => a.price - b.price);
    if (sortFilter.value === "high") ebooks.sort((a, b) => b.price - a.price);
    if (sortFilter.value === "newest") {
      ebooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    grid.innerHTML = "";

    if (!ebooks.length) {
      grid.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    for (const e of ebooks) {
      const coverUrl = await getCoverUrl(e.cover_path);

      const card = document.createElement("div");
      card.className = "ebook-card";

      card.innerHTML = `
        ${coverUrl ? `<img src="${coverUrl}" alt="${e.title}">` : ""}
        <div class="ebook-info">
          <h3>${e.title}</h3>
          <p>${e.subject}</p>
          <div class="ebook-meta">
            <span class="ebook-price">₹${e.price}</span>
            <span class="ebook-tag">${e.department}</span>
          </div>
          <button class="ebook-btn"
            data-id="${e.id}"
            data-price="${e.price}"
            data-path="${e.pdf_path}">
            ${purchasedSet.has(e.id) ? "Download" : "Buy Now"}
          </button>
        </div>
      `;

      card.querySelector("button").addEventListener("click", async (ev) => {
        if (purchasedSet.has(e.id)) {
          await downloadEbook(ev.target.dataset.path, e.id);
        } else {
          await buyNow(e.id, e.price);
        }
      });

      grid.appendChild(card);
    }
  }

  /* =========================
     BUY NOW
  ========================= */
  async function buyNow(ebookId, price) {
    if (!user) {
      alert("Please log in to purchase.");
      window.location.href = "/pages/login.html";
      return;
    }

    const amount = price * 100;

    const res = await fetch("http://127.0.0.1:7000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ebookId, amount })
    });

    if (!res.ok) {
      alert("Payment failed");
      return;
    }

    const order = await res.json();

    new Razorpay({
      key: "rzp_test_Rt7n1yYlzd3Lig",
      order_id: order.id,
      amount: order.amount,
      currency: "INR",
      name: "EngiBriefs",
      handler: async (response) => {
        await fetch("http://127.0.0.1:7000/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            ebookId,
            userId: user.id,
            amount
          })
        });

        alert("Payment successful");
        location.reload();
      }
    }).open();
  }

  /* =========================
     DOWNLOAD (SECURE)
  ========================= */
  async function downloadEbook(pdfPath, ebookId) {
    if (!user) {
      window.location.href = "/pages/login.html";
      return;
    }

    const { data: allowed } = await supabase.rpc("can_download", {
      uid: user.id,
      ebook: ebookId
    });

    if (!allowed) {
      alert("Download limit reached");
      return;
    }

    const { data } = await supabase
      .storage
      .from("ebooks")
      .createSignedUrl(pdfPath, 60);

    await supabase.from("download_logs").insert({
      user_id: user.id,
      ebook_id: ebookId
    });

    window.open(data.signedUrl, "_blank");
  }
});
