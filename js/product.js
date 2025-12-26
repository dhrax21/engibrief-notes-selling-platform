import { supabase } from "/js/supabase.js";
const EDGE_BASE ="https://vzetfjzfvfhfvcqpkbbd.supabase.co/functions/v1";


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

async function buyNow(ebookId, price, pdfPath) {
  try {
    if (!user) {
      showToast("Please login to continue", "info", 2000);
      return;
    }

    // 1️⃣ Create Razorpay order
    const res = await fetch(`${EDGE_BASE}/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price * 100 }),
    });

    const order = await res.json();
    if (!res.ok) throw new Error("Order creation failed");

    // 2️⃣ Open Razorpay checkout
    const options = {
      key: "rzp_test_Rt7n1yYlzd3Lig", // PUBLIC test key only
      order_id: order.id,
      currency: "INR",
      name: "EngiBriefs",
      description: "E-Book Purchase",

      handler: async function (response) {
        // 3️⃣ Verify payment
        const verifyRes = await fetch(
          `${EDGE_BASE}/verify-payment`,
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
        if (!verifyRes.ok || !result.success) {
          throw new Error("Verification failed");
        }

        purchasedSet.add(ebookId);
        localStorage.setItem(
          "purchasedEbooks",
          JSON.stringify([...purchasedSet])
        );

        showToast("Payment successful", "success", 1500);
        await render();

        // Auto download
        await downloadEbook(pdfPath, ebookId);
      },
    };

    new Razorpay(options).open();
  } catch (err) {
    console.error(err);
    showToast("Payment failed", "error", 2500);
  }
}



  

/* =========================
   DOWNLOAD (SECURE)
========================= */

async function downloadEbook(pdfPath, ebookId) {
  try {
    if (!user) {
      showToast("Please login first", "info", 2000);
      return;
    }

    const res = await fetch(`${EDGE_BASE}/download-ebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ebookId,
        userId: user.id,
        filePath: pdfPath,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error("Download failed");
    }

    window.open(data.url, "_blank");
  } catch (err) {
    console.error(err);
    showToast("Download failed", "error", 2500);
  }
}


// -----------------------//
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
