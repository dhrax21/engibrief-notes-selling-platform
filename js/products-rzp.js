import { supabase } from "/js/supabase.js";

/* =========================
   DOM REFERENCES
========================= */
const grid = document.getElementById("rzpGrid");
const emptyState = document.getElementById("emptyState");
const deptFilter = document.getElementById("deptFilter");
const sortSelect = document.getElementById("sortRzp");

if (!grid) {
  console.error("rzpGrid not found");
}

/* =========================
   RENDER GRID
========================= */
function renderRzpGrid(ebooks) {
  grid.innerHTML = "";

  if (!ebooks || ebooks.length === 0) {
    emptyState?.classList.remove("hidden");
    return;
  }

  emptyState?.classList.add("hidden");

  ebooks.forEach((ebook) => {
    const card = document.createElement("div");
    card.className = "product-card";

    let coverUrl = "";
    if (ebook.cover_path) {
      coverUrl = supabase.storage
        .from("book-covers-rzp")
        .getPublicUrl(ebook.cover_path).data.publicUrl;
    }

    card.innerHTML = `
      ${coverUrl ? `<img src="${coverUrl}" alt="${ebook.title}" />` : ""}
      <h3>${ebook.title}</h3>
      <p class="subject">${ebook.subject}</p>
      ${ebook.exam ? `<span class="exam-badge">${ebook.exam}</span>` : ""}
      <div class="card-footer">
        <span class="price">₹${ebook.price}</span>
        <button class="buy-btn">Buy Now</button>
      </div>
      <p class="rzp-note">
        No login required · Secure checkout via Razorpay
      </p>
    `;

    card.querySelector(".buy-btn").addEventListener("click", () => {
      window.open(ebook.razorpay_link, "_blank", "noopener,noreferrer");
    });

    grid.appendChild(card);
  });
}

/* =========================
   LOAD WITH FILTER + SORT
========================= */
async function loadRzpEbooks() {
  const dept = deptFilter?.value || "ALL";
  const sort = sortSelect?.value || "latest";

  let query = supabase
    .from("ebooks_rzp")
    .select("*")
    .eq("is_active", true);

  // Department filter
  if (dept !== "ALL") {
    query = query.eq("department", dept);
  }

  // Sorting
  if (sort === "price_low") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_high") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("RZP load error:", error);
    return;
  }

  renderRzpGrid(data);
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadRzpEbooks();

  deptFilter?.addEventListener("change", loadRzpEbooks);
  sortSelect?.addEventListener("change", loadRzpEbooks);
});