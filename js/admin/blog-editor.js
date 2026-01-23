import { supabase } from "/js/supabase.js";

/* =====================================================
   ADMIN BLOG EDITOR
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
       AUTH + ADMIN CHECK
    ========================= */
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== "admin") {
      window.location.replace("/index.html");
      return;
    }

    /* =========================
       BLOG ID SETUP
    ========================= */
    const params = new URLSearchParams(window.location.search);
    const isEditMode = params.has("id");
    const blogId = params.get("id") || crypto.randomUUID();
    blogIdInput.value = blogId;

    /* =========================
       INIT QUILL
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
            image: () => imageHandler({ quill, blogId })
          }
        }
      }
    });

    /* =========================
       LOAD BLOG (EDIT MODE)
    ========================= */
    if (isEditMode) {
      await loadBlogForEdit(blogId, {
        titleInput,
        slugInput,
        excerptInput,
        quill
      });
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

      if (thumbnailFile && !thumbnailFile.type.startsWith("image/")) {
        showToast("Thumbnail must be an image", "error");
        submitBtn.disabled = false;
        return;
      }

      const slug =
        slugInput.value ||
        title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      try {
        showToast(isEditMode ? "Updating blog…" : "Publishing blog…", "info");

        /* =====================================================
           STEP 1 — CREATE OR UPDATE BLOG (NO UPSERT)
        ===================================================== */
        if (isEditMode) {
          const { error } = await supabase
            .from("blogs")
            .update({
              title,
              slug,
              excerpt,
              content
            })
            .eq("id", blogId);

          if (error) throw error;

        } else {
          const { error } = await supabase
            .from("blogs")
            .insert({
              id: blogId,
              title,
              slug,
              excerpt,
              content,
              author_id: session.user.id,
              author_name: session.user.email,
              status: "PUBLISHED",
              published_at: new Date().toISOString()
            });

          if (error) throw error;
        }

        /* =====================================================
           STEP 2 — THUMBNAIL UPLOAD (OPTIONAL)
        ===================================================== */
        if (thumbnailFile) {
          const ext = thumbnailFile.type.split("/")[1] || "webp";
          const path = `blogs/${blogId}/thumbnail.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("blog-thumbnails")
            .upload(path, thumbnailFile, {
              upsert: true,
              contentType: thumbnailFile.type
            });

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from("blog-thumbnails")
            .getPublicUrl(path);

          const { error: updateThumbError } = await supabase
            .from("blogs")
            .update({ thumbnail_url: data.publicUrl })
            .eq("id", blogId);

          if (updateThumbError) throw updateThumbError;
        }

        showToast("Saved successfully", "success");

        if (!isEditMode) {
          window.location.href = "/pages/admin/blog-list.html";
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
   HELPERS
===================================================== */

async function loadBlogForEdit(blogId, refs) {
  const { titleInput, slugInput, excerptInput, quill } = refs;

  showToast("Loading blog…", "info");

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", blogId)
    .single();

  if (error || !data) {
    showToast("Blog not found", "error");
    return;
  }

  titleInput.value = data.title;
  slugInput.value = data.slug;
  excerptInput.value = data.excerpt || "";
  quill.root.innerHTML = data.content || "";

  showToast("Edit mode enabled", "success", 1500);
}

/* =========================
   INLINE IMAGE UPLOAD
========================= */
async function imageHandler({ quill, blogId }) {
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
      const path = `blogs/${blogId}/${crypto.randomUUID()}.webp`;

      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, file);

      if (error) throw error;

      const url = supabase.storage
        .from("blog-images")
        .getPublicUrl(path).data.publicUrl;

      quill.deleteText(range.index, "Uploading image...".length);
      quill.insertEmbed(range.index, "image", url);
      quill.setSelection(range.index + 1);

    } catch (err) {
      console.error(err);
      showToast("Image upload failed", "error");
    }
  };
}

/* =========================
   TOAST
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
