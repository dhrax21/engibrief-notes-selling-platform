import { supabase } from "/js/supabase.js";

/* =========================
   GLOBAL STATE
========================= */


let allEbooks = [];

let user = null;
let isAdmin = false;

const purchasedSet = new Set(
  JSON.parse(localStorage.getItem("purchasedEbooks") || "[]")
);

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

  if (!grid) return;

  let ebooks = [...allEbooks];

  if (deptFilter?.value !== "ALL") {
    ebooks = ebooks.filter(b => b.department === deptFilter.value);
  }

  grid.innerHTML = "";

  for (const ebook of ebooks) {
    const cover = getCoverUrl(ebook.cover_path);

    const card = document.createElement("div");
    card.className = "ebook-card";
    card.dataset.id = ebook.id;

    card.innerHTML = `
      ${cover ? `<img src="${cover}" />` : ""}
      <h3>${ebook.title}</h3>
      <p>${ebook.subject}</p>
      <span>₹${ebook.price}</span>

      <button class="ebook-btn">
        ${purchasedSet.has(ebook.id) ? "Download" : "Buy Now"}
      </button>

      ${isAdmin ? `<button class="delete-btn">Delete</button>` : ""}
    `;

    // DELETE (admin only)
    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (evt) => {
        const ebookId = evt.currentTarget
          .closest(".ebook-card")
          ?.dataset.id;
        if (!ebookId) return;
        await deleteEbook(ebookId);
      });
    }

    // BUY / DOWNLOAD
    card.querySelector(".ebook-btn").addEventListener("click", async () => {
      if (purchasedSet.has(ebook.id)) {
        await downloadEbook(ebook.pdf_path, ebook.id);
      } else {
        await buyNow(ebook.id, ebook.price, ebook.pdf_path);
      }
    });

    grid.appendChild(card);
  }
}



/* =========================
   BUY NOW
========================= */

window.buyNow = async function (ebookId, price, filePath) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("Please login first", "info", 2000);
      window.location.href = "/pages/auth.html";
      return;
    }

    // Create order
    const res = await fetch("/.netlify/functions/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price * 100 }),
    });

    const text = await res.text();
    const order = text ? JSON.parse(text) : {};

    if (!res.ok) throw new Error("Order creation failed");

    const options = {
      key: "rzp_test_xxxxx",
      order_id: order.id,
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
              userId: user.id,
              amount: price,
            }),
          }
        );

        const result = await verifyRes.json();
        if (!verifyRes.ok || !result.success)
          throw new Error("Verification failed");

        purchasedSet.add(ebookId);
        localStorage.setItem(
          "purchasedEbooks",
          JSON.stringify([...purchasedSet])
        );

        showToast("Payment successful", "success", 1500);
        await render();

        downloadEbook(filePath, ebookId);
      },
    };

    new Razorpay(options).open();
  } catch (err) {
    console.error("Buy now error:", err);
    showToast("Payment failed", "error", 2000);
  }
};


  

/* =========================
   DOWNLOAD (SECURE)
========================= */
async function downloadEbook(filePath, ebookId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const res = await fetch("/.netlify/functions/download-ebook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ebookId,
      userId: user.id,
      filePath,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    showToast("Download failed", "error", 2000);
    return;
  }

  window.open(data.url, "_blank");
}


async function deleteEbook(ebookId) {
  try {
    const { error } = await supabase
      .from("ebooks")
      .update({ is_active: false })
      .eq("id", ebookId);

    if (error) throw error;

    allEbooks = allEbooks.filter(e => e.id !== ebookId);

    showToast("E-book deleted", "success", 2000);

    await render();

  } catch (err) {
    console.error(err);
    showToast("Delete failed", "error", 2500);
  }
}






function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}
