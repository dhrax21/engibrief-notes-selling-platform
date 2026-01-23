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
  initComments(data.id);
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
    supabase.rpc("increment_blog_views", { blog_id: id });
  }
});


async function initComments(blogId) {
  const form = document.getElementById("commentForm");
  const input = document.getElementById("commentInput");
  const list = document.getElementById("commentsList");
  const loginPrompt = document.getElementById("loginPrompt");

  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.user_metadata?.role === "admin";

  if (session) {
    form.classList.remove("hidden");
  } else {
    loginPrompt.classList.remove("hidden");
  }

  async function loadComments() {
    const { data } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("blog_id", blogId)
      .order("created_at", { ascending: true });

    list.innerHTML = data
      .map(c => renderComment(c, isAdmin))
      .join("");
  }


  list.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("comment-delete")) return;

    const commentEl = e.target.closest(".comment");
    if (!commentEl) return;

    const commentId = commentEl.dataset.id;

    if (!confirm("Delete this comment?")) return;

    // Admin delete via Edge Function
    if (isAdmin) {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(
        "https://vzetfjzfvfhfvcqpkbbd.supabase.co/functions/v1/delete-comment",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ commentId })
        }
      );

      if (!res.ok) return;
      commentEl.remove();
      return;
    }

    // User delete (own comment)
    const { count } = await supabase
      .from("blog_comments")
      .delete({ count: "exact" })
      .eq("id", commentId);

    if (count === 0) return;
    commentEl.remove();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = input.value.trim();
    if (!content || !session) return;

    await supabase.from("blog_comments").insert({
      blog_id: blogId,
      user_id: session.user.id,
      user_name: session.user.email,
      content
    });

    input.value = "";
    loadComments();
  });

  loadComments(); 
}


function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}



function renderComment(comment, isAdmin = false) {
  const date = new Date(comment.created_at).toLocaleString();

  return `
    <div class="comment" data-id="${comment.id}">
      <div class="comment-header">
        <strong class="comment-user">
          ${comment.user_name || "Anonymous"}
        </strong>
        <span class="comment-date">${date}</span>

        ${
          isAdmin
            ? `<button class="comment-delete" data-id="${comment.id}">
                 Delete
               </button>`
            : ""
        }
      </div>

      <p class="comment-content">
        ${escapeHtml(comment.content)}
      </p>
    </div>
  `;
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
