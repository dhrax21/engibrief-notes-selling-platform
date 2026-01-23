import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const loading = document.getElementById("loading");
  const blogEl = document.getElementById("blog");
  const errorEl = document.getElementById("error");

  if (!slug) {
    showError();
    return;
  }

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .single();

  loading.classList.add("hidden");

  if (error || !data) {
    showError();
    return;
  }

  renderBlog(data);
  incrementViews(data.id);

  function renderBlog(blog) {
    document.title = blog.title;

    document.getElementById("title").textContent = blog.title;
    document.getElementById("author").textContent = "Er Mayank Singh";
    document.getElementById("date").textContent =
      new Date(blog.published_at).toLocaleDateString();

      const thumb = document.getElementById("thumbnail");

      if (blog.thumbnail_url && blog.thumbnail_url.startsWith("http")) {
        thumb.src = blog.thumbnail_url;
        thumb.alt = blog.title;
      } else {
        thumb.remove();
      }



    document.getElementById("content").innerHTML = blog.content;

    blogEl.classList.remove("hidden");
  }

  function showError() {
    errorEl.classList.remove("hidden");
  }

  async function incrementViews(id) {
    // fire-and-forget
    supabase.rpc("increment_blog_views", { blog_id: id });
  }
});
