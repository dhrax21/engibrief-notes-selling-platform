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
      if (isAdmin) {
        const deleteBtn = card.querySelector(".delete-btn");

         deleteBtn.addEventListener("click", async () => {
         await deleteEbook(ebook.id);
        });
      }


    card.querySelector(".ebook-btn").onclick = async () => {
      if (!user) {
        showToast("Please login to continue", "info", 2000);

        setTimeout(() => {
          window.location.href = "/pages/auth.html";
        }, 1800);

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
  if (!user) {
    showToast("Please login to continue", "info", 2000);
    setTimeout(() => {
      window.location.href = "/pages/auth.html";
    }, 1800);
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price }),
    });

    if (!res.ok) {
      throw new Error("Order creation failed");
    }

    const order = await res.json();

    const options = {
      key: "rzp_test_Rt7n1yYlzd3Lig",
      order_id: order.id, 
      currency: "INR",
      name: "EngiBriefs",
      description: "E-Book Purchase",

      handler: async function (response) {
        try {
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

          if (!verifyRes.ok) {
            throw new Error("Payment verification failed");
          }

          const result = await verifyRes.json();

          if (!result.success) {
            showToast("Payment verification failed", "error", 2500);
            return;
          }
          purchasedSet = purchasedSet || new Set();
          purchasedSet.add(ebookId);

          showToast("Payment successful", "success", 1800);

          await render();

          setTimeout(() => {
            downloadEbook(pdfPath, ebookId);
          }, 800);

        } catch (err) {
          console.error("Verification error:", err);
          showToast("Payment verification error", "error", 2500);
        }
      },

      modal: {
        ondismiss: function () {
          showToast("Payment cancelled", "info", 2000);
        },
      },
    };
    new Razorpay(options).open();

  } catch (err) {
    console.error("Buy now error:", err);
    showToast("Payment failed. Please try again.", "error", 2500);
  }
};


/* =========================
   DOWNLOAD (SECURE)
========================= */
async function downloadEbook(pdfPath, ebookId) {
  // 🔐 Auth check
  if (!user) {
    showToast("Please login to download this e-book", "info", 2000);

    setTimeout(() => {
      window.location.href = "/pages/auth.html";
    }, 1800);

    return;
  }

  // 🔒 Purchase check
  if (!purchasedSet || !purchasedSet.has(ebookId)) {
    showToast("You have not purchased this e-book", "error", 2500);
    return;
  }

  try {
    const { data, error } = await supabase.storage
      .from("ebooks") // PRIVATE bucket
      .createSignedUrl(pdfPath, 60); // 60 seconds

    if (error) throw error;

    // ⬇️ Trigger secure download
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Download started", "success", 1500);

  } catch (err) {
    console.error("Download error:", err);
    showToast("Download failed. Please try again.", "error", 2500);
  }
}

async function deleteEbook(ebookId) {
  try {
    showToast("Deleting e-book…", "info", 1500);

    const { error } = await supabase
      .from("ebooks")
      .update({ is_active: false }) // soft delete
      .eq("id", ebookId);

    if (error) throw error;

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
