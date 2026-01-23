const toggleBtn = document.getElementById("themeToggle");
const root = document.documentElement;

const savedTheme = localStorage.getItem("blog-theme");

if (savedTheme) {
  root.setAttribute("data-theme", savedTheme);
  toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
}

toggleBtn?.addEventListener("click", () => {
  const isDark = root.getAttribute("data-theme") === "dark";
  const nextTheme = isDark ? "light" : "dark";

  root.setAttribute("data-theme", nextTheme);
  localStorage.setItem("blog-theme", nextTheme);

  toggleBtn.textContent = nextTheme === "dark" ? "☀️" : "🌙";
});
