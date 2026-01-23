import { supabase } from "/js/supabase.js";


const PAGE_SIZE = 6;
let page = 0;
let isLoading = false;
let hasMore = true;

document.addEventListener("DOMContentLoaded", () => {
  loadNextPage();

  window.addEventListener("scroll", () => {
    if (!hasMore || isLoading) return;

    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 300
    ) {
      loadNextPage();
    }
  });
});

function truncate(text, max = 140) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function loadNextPage() {
  const listEl = document.getElementById("blogList");
  const loadingEl = document.getElementById("loading");
  const scrollLoader = document.getElementById("scrollLoader");
  const emptyEl = document.getElementById("empty");

  if (!listEl) return;

  emptyEl.classList.add("hidden");
  isLoading = true;
  scrollLoader.classList.remove("hidden");

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: blogs, error } = await supabase
    .from("blogs")
    .select("title, slug, excerpt, thumbnail_url, created_at, views")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .range(from, to);

  loadingEl.classList.add("hidden");
  scrollLoader.classList.add("hidden");

  if (error) {
    console.error(error);
    hasMore = false;
    isLoading = false;
    return;
  }

  if (!blogs || blogs.length === 0) {
    if (page === 0) emptyEl.classList.remove("hidden");
    hasMore = false;
    isLoading = false;
    return;
  }

  blogs.forEach((blog, index) => {
    const html =
      page === 0 && index === 0
        ? renderFeaturedBlog(blog)
        : renderBlogCard(blog);

    listEl.insertAdjacentHTML("beforeend", html);
  });

  listEl.classList.remove("hidden");

  if (blogs.length < PAGE_SIZE) hasMore = false;

  page++;
  isLoading = false;
}

function renderBlogCard(blog) {
  return `
    <article class="blog-card">
      <a href="/pages/blog/post.html?slug=${blog.slug}" class="blog-card-link">
        
        <div class="blog-card__image">
          <img
            src="${blog.thumbnail_url || "/assets/blog-placeholder.jpg"}"
            alt="${blog.title}"
            loading="lazy"
          />
        </div>

        <div class="blog-card__content">
          <h3 class="blog-card__title">${blog.title}</h3>

          <p class="blog-card__excerpt">
            ${truncate(blog.excerpt)}
          </p>

          <div class="blog-card__meta">
            ${new Date(blog.created_at).toLocaleDateString()}
            · ${blog.views} views
          </div>
        </div>

      </a>
    </article>
  `;
}


function renderFeaturedBlog(blog) {
  return `
    <article class="blog-card featured">
      <a href="/pages/blog/post.html?slug=${blog.slug}" class="blog-card-link">

        <div class="blog-card__image featured-image">
          <img
            src="${blog.thumbnail_url || "/assets/blog-placeholder.jpg"}"
            alt="${blog.title}"
            loading="lazy"
          />
        </div>

        <div class="blog-card__content">
          <h3 class="blog-card__title">
            ${blog.title}
          </h3>

          <p class="blog-card__excerpt featured-excerpt">
            ${truncate(blog.excerpt, 220)}
          </p>

          <div class="blog-card__meta">
            ${new Date(blog.created_at).toLocaleDateString()}
            · ${blog.views} views
          </div>
        </div>

      </a>
    </article>
  `;
}

