import { supabase } from "./supabase.js";

/* =====================================================
   DOM REFERENCES
===================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("ebookGrid");
  const deptFilter = document.getElementById("departmentFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (!grid || !deptFilter || !sortFilter) return;

  let allEbooks = [];
  let purchasedSet = new Set();

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
    const { data: { user } } = await supabase.auth.getUser();
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
     SIGNED COVER URL
  ========================= */
  async function getSignedCoverUrl(path) {
    const { data } = await supabase
      .storage
      .from("ebooks")
      .createSignedUrl(path, 300);

    return data?.signedUrl || null;
  }

  /* =========================
     RENDER
  ========================= */
  async function render() {
    let ebooks = [...allEbooks];

    const dept = deptFilter.value;
    if (dept !== "ALL") {
      ebooks = ebooks.filter(e => e.department === dept);
    }

    const sort = sortFilter.value;
    if (sort === "low") ebooks.sort((a, b) => a.price - b.price);
    if (sort === "high") ebooks.sort((a, b) => b.price - a.price);
    if (sort === "newest") {
      ebooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    grid.innerHTML = "";

    if (!ebooks.length) {
      grid.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    for (const e of ebooks) {
      const coverUrl = e.cover_path
        ? await getSignedCoverUrl(e.cover_path)
        : null;

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

          ${
            purchasedSet.has(e.id)
              ? `<button class="ebook-btn"
                   onclick="downloadEbook('${e.pdf_path}', '${e.id}')">
                   Download
                 </button>`
              : `<button class="ebook-btn"
                   onclick="buyNow('${e.id}', ${e.price})">
                   Buy Now
                 </button>`
          }
        </div>
      `;

      grid.appendChild(card);
    }
  }
});

/* =====================================================
   BUY NOW (RAZORPAY)
===================================================== */
window.buyNow = async (ebookId, price) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Please login to continue");
    location.href = "login.html";
    return;
  }

  const amountInPaise = price * 100;

  try {
    const res = await fetch("http://127.0.0.1:7000/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ebookId, amount: amountInPaise })
    });

    if (!res.ok) throw new Error();

    const order = await res.json();
    if (!order.id) return;

    const options = {
      key: "rzp_test_Rt7n1yYlzd3Lig",
      order_id: order.id,
      amount: order.amount,
      currency: "INR",
      name: "Engibrief",
      description: "Engineering E-Book",

      handler: async (response) => {
        await fetch("http://127.0.0.1:7000/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ebookId,
            userId: user.id,
            amount: amountInPaise
          })
        });

        alert("Payment successful");
        location.reload();
      }
    };

    new Razorpay(options).open();
  } catch {
    alert("Payment failed");
  }
};

/* =====================================================
   DOWNLOAD (SECURE)
===================================================== */
window.downloadEbook = async (pdfPath, ebookId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.href = "login.html";
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

  const { data, error } = await supabase
    .storage
    .from("ebooks")
    .createSignedUrl(pdfPath, 60);

  if (error) {
    alert("Download failed");
    return;
  }

  await supabase.from("download_logs").insert({
    user_id: user.id,
    ebook_id: ebookId
  });

  window.open(data.signedUrl, "_blank");
};
