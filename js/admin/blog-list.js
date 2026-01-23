import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("blogTableBody");

  /* =========================
     AUTH + ADMIN CHECK
  ========================= */
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || session.user.user_metadata?.role !== "admin") {
    window.location.replace("/index.html");
    return;
  }

  /* =========================
     FETCH BLOGS
  ========================= */
  const { data: blogs, error } = await supabase
    .from("blogs")
    .select("id, title, status, created_at, views")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Failed to load blogs", "error");
    return;
  }

  tableBody.innerHTML = "";

  blogs.forEach(blog => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${blog.title}</td>
      <td>
        <span class="status ${blog.status === "PUBLISHED" ? "published" : "draft"}">
          ${blog.status}
        </span>
      </td>
      <td>${new Date(blog.created_at).toLocaleDateString()}</td>
      <td>${blog.views || 0}</td>
      <td class="actions">
        <button class="edit" data-id="${blog.id}">Edit</button>
        <button class="delete" data-id="${blog.id}">Delete</button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  /* =========================
     ACTION HANDLERS
  ========================= */
  tableBody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit")) {
      window.location.href = `/pages/admin/blog-editor.html?id=${id}`;
    }

    if (e.target.classList.contains("delete")) {
      if (!confirm("Delete this blog permanently?")) return;

      const { error } = await supabase
        .from("blogs")
        .delete()
        .eq("id", id);

      if (error) {
        showToast("Delete failed", "error");
        return;
      }

      showToast("Blog deleted", "success");
      e.target.closest("tr").remove();
    }
  });
});

async function deleteBlog(blogId) {
  if (!confirm("Are you sure you want to delete this blog?")) return;

  try {
    showToast("Deleting blog…", "info");

    // Delete thumbnail
    try {
      await supabase.storage
        .from("blog-thumbnails")
        .remove([`blogs/${blogId}/thumbnail.webp`]);
    } catch {}

    // Delete inline images
    try {
      const { data: files } = await supabase.storage
        .from("blog-images")
        .list(`blogs/${blogId}`);

      if (files?.length) {
        const paths = files.map(f => `blogs/${blogId}/${f.name}`);
        await supabase.storage
          .from("blog-images")
          .remove(paths);
      }
    } catch {}

    // Delete blog row
    const { error } = await supabase
      .from("blogs")
      .delete()
      .eq("id", blogId);

    if (error) throw error;

    showToast("Blog deleted", "success");
    location.reload();

  } catch (err) {
    console.error(err);
    showToast("Failed to delete blog", "error");
  }
}


/* =========================
   TOAST
========================= */
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.className = "toast hidden", duration);
}
