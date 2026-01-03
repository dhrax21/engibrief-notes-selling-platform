import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL
} from "/js/supabase.js";

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;


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
        const ok = confirm("Are you sure you want to delete this ebook?");
        if (!ok) return;
        await deleteEbook(ebookId);
        card.remove();
      });
    }

       // BUY / DOWNLOAD
        card.querySelector(".ebook-btn").addEventListener("click", async () => {
        if (purchasedSet.has(ebook.id)) {
          await downloadWithRetry(ebook.id);
          return;
        }

        const success = await buyNow(ebook.id, ebook.price);

        if (success === true) {
          purchasedSet.add(ebook.id);
          localStorage.setItem(
            "purchasedEbooks",
            JSON.stringify([...purchasedSet])
          );

          await render();           // updates button
          await downloadWithRetry(ebook.id);
        }
      });


//    card.querySelector(".ebook-btn").addEventListener("click", async () => {
//       if (purchasedSet.has(ebook.id)) {
//         await downloadWithRetry(ebook.id);   
//       } else {
//         await buyNow(ebook.id, ebook.price);
//       }
// });


    grid.appendChild(card);
  }
}

//  Without this Dont Open any PDF

/* =========================
   BUY NOW
========================= */

let isBuying = false;

window.buyNow = async function buyNow(ebookId, price) {
  try {
    if (!user) {
      showToast("Please login to continue", "info", 2000);
      window.location.href = "/pages/auth.html";
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");

    /* ================= CREATE ORDER ================= */

    const orderRes = await fetch(`${EDGE_BASE}/create-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ebookId,
        amount: price * 100,
      }),
    });

    if (!orderRes.ok) throw new Error("Create order failed");
    const order = await orderRes.json();

    /* ================= RAZORPAY ================= */

    return await new Promise((resolve) => {
      const options = {
        key: "rzp_live_RxKTMEIG9aY8n1", // move to env later
        order_id: order.id,
        amount: price * 100,
        currency: "INR",
        name: "EngiBriefs",

        handler: async function (response) {
          try {
            /* ================= VERIFY ================= */

            const verifyRes = await fetch(`${EDGE_BASE}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error("Verification failed");

            const result = await verifyRes.json();
            if (!result.success) throw new Error("Payment not verified");

            showToast("Payment successful", "success", 1500);
            resolve(true);

          } catch (err) {
            console.error(err);
            showToast("Payment failed", "error", 2500);
            resolve(false);
          }
        },

        modal: {
          ondismiss() {
            showToast("Payment cancelled", "info", 2000);
            resolve(false);
          },
        },
      };

      new Razorpay(options).open();
    });

  } catch (err) {
    console.error(err);
    showToast("Payment failed", "error", 2500);
    return false;
  }
};



// Delete Ebook Logic 
async function deleteEbook(ebookId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const res = await fetch(`${EDGE_BASE}/delete-ebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ebookId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    showToast("E-book deleted", "success", 2000);
    await render();

  } catch (err) {
    console.error(err);
    showToast("Delete failed", "error", 2500);
  }
}




// downloadWithRetry




async function downloadWithRetry(ebookId, retries = 5, delay = 400) {
  for (let i = 0; i < retries; i++) {
    try {
      await downloadEbook(ebookId);
      return; // success
    } catch (err) {
      if (err.message === "RETRY" && i < retries - 1) {
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

  

/* =========================
   DOWNLOAD (SECURE)
========================= */

// -----------------------//
async function downloadEbook(ebookId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const res = await fetch(`${EDGE_BASE}/download-ebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ebookId }),
    });

    if (!res.ok) {
      const text = await res.text();

      // Ignore expected race-condition 403
      if (res.status === 403 && text.includes("Not purchased")) {
        throw new Error("RETRY");
      }

      throw new Error(text);
    }

    const data = await res.json();
    window.open(data.url, "_blank", "noopener,noreferrer");

  } catch (err) {
    if (err.message !== "RETRY") {
      console.error("Download error:", err);
      showToast("Download failed", "error", 2500);
    }
    throw err;
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
