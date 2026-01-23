import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", loadBlogs);

async function loadBlogs() {
  const container = document.getElementById("blog-feed");
  if (!container) return;

  const { data: blogs, error } = await supabase
    .from("blogs")
    .select("title, slug, excerpt, thumbnail_url, published_at, views")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(3);

  if (error || !blogs?.length) return;

  container.innerHTML = blogs.map(renderBlogCard).join("");
}

function renderBlogCard(blog) {
  return `
    <article class="blog-card">
      <a href="/pages/blog/post.html?slug=${blog.slug}">
        <img
          class="blog-card-img"
          src="${blog.thumbnail_url || "/assets/blog-placeholder.jpg"}"
          alt="${blog.title}"
        />
        <div class="blog-card-body">
          <h3>${blog.title}</h3>
          <p>${blog.excerpt || ""}</p>
          <small>
            ${new Date(blog.published_at).toLocaleDateString()}
            · ${blog.views} views
          </small>
        </div>
      </a>
    </article>
  `;
}
