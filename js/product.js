import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("ebookGrid");
  const deptFilter = document.getElementById("departmentFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (!grid || !deptFilter || !sortFilter) return;

  let allEbooks = [];
  let purchasedSet = new Set();

  /* =========================
     AUTH
  ========================= */
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let isAdmin = false;
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


  async function loadPurchases() {
  purchasedSet.clear();

  if (!user) return;

  const { data, error } = await supabase
    .from("purchases")
    .select("ebook_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to load purchases:", error);
    return;
  }

  data.forEach(p => purchasedSet.add(p.ebook_id));
}


  deptFilter.addEventListener("change", render);
  sortFilter.addEventListener("change", render);

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
     COVER (PUBLIC)
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
    let ebooks = [...allEbooks];

    if (deptFilter.value !== "ALL") {
      ebooks = ebooks.filter(e => e.department === deptFilter.value);
    }

    grid.innerHTML = "";

    if (!ebooks.length) {
      grid.innerHTML = "<p>No ebooks available.</p>";
      return;
    }

    for (const e of ebooks) {
      const coverUrl = getCoverUrl(e.cover_path);

      const card = document.createElement("div");
      card.className = "ebook-card";
      card.dataset.ebookId = e.id;

      card.innerHTML = `
        ${coverUrl ? `<img src="${coverUrl}" />` : ""}
        <div class="ebook-info">
          <h3>${e.title}</h3>
          <p>${e.subject}</p>
          <div class="ebook-meta">
            <span>₹${e.price}</span>
            <span>${e.department}</span>
          </div>
          <div class="ebook-actions">
            <button class="ebook-btn">
              ${purchasedSet.has(e.id) ? "Download" : "Buy Now"}
            </button>
            ${isAdmin ? `<button class="delete-btn">Delete</button>` : ""}
          </div>
        </div>
      `;

        card.querySelector(".ebook-btn").onclick = () => {
      purchasedSet.has(e.id)
        ? downloadEbook(e.pdf_path, e.id)
        : buyNow(e.id, e.price, e.pdf_path);
    };

      const del = card.querySelector(".delete-btn");
      if (del) {
        del.onclick = () => deleteEbookSoft(e);
      }

      grid.appendChild(card);
    }
  }

  /* =========================
     DELETE (SOFT)
  ========================= */
  async function deleteEbookSoft(ebook) {
    if (!confirm("Remove this ebook?")) return;

    const { error } = await supabase.rpc("soft_delete_ebook", {
      ebook_id: ebook.id
    });

    if (error) {
      alert("Delete failed");
      return;
    }

    allEbooks = allEbooks.filter(e => e.id !== ebook.id);

    await render();
  }
});





// top or bottom of product.js (global scope)

window.buyNow = async function (ebookId, price, pdfPath) {
  try {
    const res = await fetch("/.netlify/functions/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: price }),
    });

    if (!res.ok) throw new Error("Order creation failed");

    const order = await res.json();

    const options = {
      key: "rzp_test_Rt7n1yYlzd3Lig",
      order_id: order.id,
      amount: order.amount,
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
          downloadEbook(pdfPath, ebookId);
          alert("Payment successful");
        } else {
          alert("Payment verification failed");
        }
      },
    };

    new Razorpay(options).open();
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
};



function downloadEbook(pdfPath, ebookId) {
  if (!pdfPath) {
    alert("Download link not available");
    return;
  }

  const link = document.createElement("a");
  link.href = pdfPath;
  link.download = ""; // forces download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
