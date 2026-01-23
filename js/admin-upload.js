import { supabase } from "/js/supabase.js";

/* =====================================================
   ADMIN BLOG EDITOR (REFactored to ebook-upload style)
===================================================== */
if (!window.__adminBlogInitialized) {
  window.__adminBlogInitialized = true;

  document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("blogForm");
    if (!form) return;

    const blogIdInput = document.getElementById("blogId");
    const titleInput = document.getElementById("title");
    const slugInput = document.getElementById("slug");
    const excerptInput = document.getElementById("excerpt");
    const thumbnailInput = document.getElementById("thumbnailFile");

    /* =========================
       AUTH CHECK (SAME AS EBOOK)
    ========================= */
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      showToast("Please login as admin", "info", 2200);
      setTimeout(() => {
        window.location.replace("/pages/auth.html");
      }, 2000);
      return;
    }

    /* =========================
       ADMIN CHECK (JWT BASED)
    ========================= */
    const isAdmin = session.user.user_metadata?.role === "admin";

    if (!isAdmin) {
      showToast("Access denied. Admins only.", "error", 2200);
      setTimeout(() => {
        window.location.replace("/index.html");
      }, 2000);
      return;
    }

    /* =========================
       BLOG ID SETUP
    ========================= */
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id") || crypto.randomUUID();
    blogIdInput.value = blogId;

    /* =========================
       INIT QUILL (SESSION SAFE)
    ========================= */
    const quill = new Quill("#editor", {
      theme: "snow",
      placeholder: "Write your blog content here...",
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "code"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote"],
            ["link", "image"],
            ["clean"]
          ],
          handlers: {
            image: () => handleInlineImageUpload(quill, blogId, session)
          }
        }
      }
    });

    /* =========================
       EDIT MODE LOAD
    ========================= */
    if (params.get("id")) {
      await loadBlogForEdit(blogId, quill);
    }

    /* =========================
       FORM SUBMIT
    ========================= */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector("button[type='submit']");
      submitBtn.disabled = true;

      const title = titleInput.value.trim();
      const excerpt = excerptInput.value.trim();
      const content = quill.root.innerHTML;
      const thumbnailFile = thumbnailInput.files[0];

      if (!title || !content) {
        showToast("Title and content are required", "error");
        submitBtn.disabled = false;
        return;
      }

      const slug =
        slugInput.value ||
        title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      try {
        showToast(params.get("id") ? "Updating blog…" : "Publishing blog…", "info");

        let thumbnailUrl;

        /* =========================
           THUMBNAIL UPLOAD
        ========================= */
        if (thumbnailFile) {
          const thumbPath = `blogs/${blogId}/thumbnail.webp`;

          const { error } = await supabase.storage
            .from("blog-thumbnails")
            .upload(thumbPath, thumbnailFile, { upsert: true });

          if (error) throw error;

          thumbnailUrl = supabase.storage
            .from("blog-thumbnails")
            .getPublicUrl(thumbPath).data.publicUrl;
        }

        /* =========================
           CREATE OR UPDATE
        ========================= */
        if (!params.get("id")) {
          const { error } = await supabase.from("blogs").insert({
            id: blogId,
            title,
            slug,
            excerpt,
            content,
            thumbnail_url: thumbnailUrl,
            author_id: session.user.id,
            author_name: session.user.email,
            status: "PUBLISHED",
            published_at: new Date().toISOString()
          });

          if (error) throw error;

          showToast("Blog published successfully", "success");
          window.location.href = "/pages/admin/blog-list.html";
        } else {
          const updateData = { title, slug, excerpt, content };
          if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;

          const { error } = await supabase
            .from("blogs")
            .update(updateData)
            .eq("id", blogId);

          if (error) throw error;

          showToast("Blog updated successfully", "success");
        }

      } catch (err) {
        console.error(err);
        showToast(err.message || "Operation failed", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
}

/* =====================================================
   HELPERS (PURE FUNCTIONS)
===================================================== */

async function loadBlogForEdit(blogId, quill) {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", blogId)
    .single();

  if (error || !data) {
    showToast("Blog not found", "error");
    return;
  }

  document.getElementById("title").value = data.title;
  document.getElementById("slug").value = data.slug;
  document.getElementById("excerpt").value = data.excerpt || "";
  quill.root.innerHTML = data.content;

  showToast("Edit mode enabled", "success", 1500);
}

async function handleInlineImageUpload(quill, blogId, session) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2MB", "error");
      return;
    }

    const range = quill.getSelection(true);
    quill.insertText(range.index, "Uploading image...", { italic: true });

    try {
      const imagePath = `blogs/${blogId}/${crypto.randomUUID()}.webp`;

      const { error } = await supabase.storage
        .from("blog-images")
        .upload(imagePath, file, { upsert: false });

      if (error) throw error;

      const imageUrl = supabase.storage
        .from("blog-images")
        .getPublicUrl(imagePath).data.publicUrl;

      quill.deleteText(range.index, "Uploading image...".length);
      quill.insertEmbed(range.index, "image", imageUrl);
      quill.setSelection(range.index + 1);

    } catch (err) {
      console.error(err);
      showToast("Image upload failed", "error");
    }
  };
}

/* =========================
   TOAST (UNCHANGED)
========================= */
function showToast(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.className = "toast hidden";
  }, duration);
}
