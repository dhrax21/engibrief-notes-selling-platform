import { supabase } from "/js/supabase.js";

/* =========================
   GLOBAL STATE
========================= */
let allEbooks = [];
const purchasedSet = new Set();
let user = null;
let isAdmin = false;

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("ebookGrid");
  const deptFilter = document.getElementById("departmentFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (!grid) return;

  const { data: sessionData } = await supabase.auth.getSession();
  user = sessionData?.session?.user ?? null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    isAdmin = profile?.role === "admin";
  }

  await loadPurchases();
  await loadEbooks();
  await render();

  deptFilter?.addEventListener("change", render);
  sortFilter?.addEventListener("change", render);
});

/* =========================
   LOAD PURCHASES
========================= */
async function loadPurchases() {
  purchasedSet.clear();
  if (!user) return;

  const { data, error } = await supabase
    .from("purchases")
    .select("ebook_id")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(p => purchasedSet.add(p.ebook_id));
}

/* =========================
   LOAD EBOOKS
========================= */
async function loadEbooks() {
  const { data } = await supabase
    .from("ebooks")
    .select("*")
    .eq("is_active", true);

  allEbooks = data || [];
}

/* =========================
   COVER URL (PUBLIC)
========================= */
function getCoverUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage
    .from("ebook-covers")
    .getPublicUrl(path);
  return data.publicUrl;
}

/* =========================
   RENDER
========================= */
async function render() {
  const grid = document.getElementById("ebookGrid");
  const deptFilter = document.getElementById("departmentFilter");

  let ebooks = [...allEbooks];

  if (deptFilter?.value !== "ALL") {
    ebooks = ebooks.filter(e => e.department === deptFilter.value);
  }

  grid.innerHTML = "";

  for (const e of ebooks) {
    const cover = getCoverUrl(e.cover_path);

    const card = document.createElement("div");
    card.className = "ebook-card";

    card.innerHTML = `
      ${cover ? `<img src="${cover}" />` : ""}
      <h3>${e.title}</h3>
      <p>${e.subject}</p>
      <span>₹${e.price}</span>
      <button class="ebook-btn">
        ${purchasedSet.has(e.id) ? "Download" : "Buy Now"}
      </button>
      ${isAdmin ? `<button class="delete-btn">Delete</button>` : ""}
    `;

    card.querySelector(".ebook-btn").onclick = async () => {
      if (!user) {
        alert("Please login first");
        location.href = "/pages/login.html";
        return;
      }

      purchasedSet.has(e.id)
        ? downloadEbook(e.pdf_path, e.id)
        : buyNow(e.id, e.price, e.pdf_path);
    };

    grid.appendChild(card);
  }
}

/* =========================
   BUY NOW
========================= */
window.buyNow = async function (ebookId, price, pdfPath) {
  try {
    const res = await fetch("/.netlify/functions/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price }),
    });

    if (!res.ok) throw new Error("Order failed");

    const order = await res.json();

    const options = {
      key: "rzp_test_Rt7n1yYlzd3Lig",
      order_id: order.id, // ✅ DO NOT PASS AMOUNT
      currency: "INR",
      name: "EngiBriefs",
      handler: async function (response) {
        const verifyRes = await fetch(
          "/.netlify/functions/verify-payment",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ebookId,
            }),
          }
        );

        const result = await verifyRes.json();

        if (result.success) {
          purchasedSet.add(ebookId);
          await render();
          await downloadEbook(pdfPath, ebookId);
          alert("Payment successful");
        } else {
          alert("Verification failed");
        }
      },
    };

    new Razorpay(options).open();
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
};

/* =========================
   DOWNLOAD (SECURE)
========================= */
async function downloadEbook(pdfPath, ebookId) {
  if (!user || !purchasedSet.has(ebookId)) {
    alert("Unauthorized");
    return;
  }

  const { data, error } = await supabase.storage
    .from("ebooks") // PRIVATE bucket
    .createSignedUrl(pdfPath, 60);

  if (error) {
    console.error(error);
    alert("Download failed");
    return;
  }

  const link = document.createElement("a");
  link.href = data.signedUrl;
  link.download = "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
