document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hamburgerBtn");
  const nav = document.getElementById("navLinks");

  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
});
