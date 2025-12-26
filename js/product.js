import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY
} from "/js/supabase.js";

/* =========================
   CONSTANTS
========================= */

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

/* =========================
   GLOBAL STATE
========================= */

let user = null;
let allEbooks = [];

const purchasedSet = new Set();

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();
  user = data?.session?.user ?? null;

  await loadPurchases();
  await loadEbooks();
  render();
});

/* =========================
   LOAD PURCHASES
========================= */

async function loadPurchases() {
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
   RENDER
========================= */

function render() {
  const grid = document.getElementById("ebookGrid");
  if (!grid) return;

  grid.innerHTML = "";

  for (const ebook of allEbooks) {
    const btnText = purchasedSet.has(ebook.id)
      ? "Download"
      : "Buy Now";

    const card = document.createElement("div");
    card.className = "ebook-card";

    card.innerHTML = `
      <h3>${ebook.title}</h3>
      <p>${ebook.subject}</p>
      <span>₹${ebook.price}</span>
      <button onclick="buyNow('${ebook.id}', ${ebook.price}, '${ebook.pdf_path}')">
        ${btnText}
      </button>
    `;

    grid.appendChild(card);
  }
}

/* =========================
   BUY NOW (GLOBAL)
========================= */

window.buyNow = async function (ebookId, price, pdfPath) {
  try {
    if (!user) {
      alert("Please login to continue");
      window.location.href = "/pages/auth.html";
      return;
    }

    /* 1️⃣ Create Razorpay order */
    const res = await fetch(`${EDGE_BASE}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ amount: price * 100 })
    });

    if (!res.ok) throw new Error("Order creation failed");

    const order = await res.json();

    /* 2️⃣ Razorpay checkout */
    const options = {
      key: "rzp_test_xxxxx", // Razorpay KEY_ID (public)
      order_id: order.id,
      currency: "INR",
      name: "EngiBriefs",

      handler: async function (response) {
        /* 3️⃣ Verify payment */
        const verifyRes = await fetch(`${EDGE_BASE}/verify-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ebookId,
            userId: user.id,
            amount: price
          })
        });

        if (!verifyRes.ok) throw new Error("Verification failed");

        purchasedSet.add(ebookId);
        render();

        /* 4️⃣ Download */
        await downloadEbook(pdfPath, ebookId);
      }
    };

    new Razorpay(options).open();

  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
};

/* =========================
   DOWNLOAD
========================= */

async function downloadEbook(pdfPath, ebookId) {
  try {
    const res = await fetch(`${EDGE_BASE}/download-ebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        ebookId,
        userId: user.id,
        filePath: pdfPath
      })
    });

    if (!res.ok) throw new Error("Download failed");

    const data = await res.json();
    window.open(data.url, "_blank");

  } catch (err) {
    console.error(err);
    alert("Download failed");
  }
}
