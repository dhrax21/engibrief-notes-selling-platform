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

    console.log("SESSION USER:", session.user);
    console.log("JWT ROLE:", session.user.user_metadata?.role);

    /* =========================
       BLOG ID SETUP
    ========================= */
    const params = new URLSearchParams(window.location.search);
    let blogId = params.get("id");

    if (!blogId) {
      blogId = crypto.randomUUID();
    }
    blogIdInput.value = blogId;

    /* =========================
       INIT QUILL EDITOR
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
            image: imageHandler
          }
        }
      }
    });

    /* =========================
       LOAD BLOG (EDIT MODE)
    ========================= */
    if (params.get("id")) {
      await loadBlogForEdit(blogId);
    }

    /* =========================
       FORM SUBMIT
    ========================= */
    console.log("AUTHOR ID:", session.user.id);

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
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      try {
        showToast(params.get("id") ? "Updating blog…" : "Publishing blog…", "info");

        /* =====================================================
           STEP 1 — INSERT BLOG FIRST (CRITICAL FIX)
        ===================================================== */
        if (!params.get("id")) {
          const { data, error } = await supabase
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
            })
            .select()
            .single();

          console.log("BLOG INSERT RESULT:", data, error);
          if (error) throw error;
        }

        /* =====================================================
           STEP 2 — THUMBNAIL UPLOAD (BEST-EFFORT)
        ===================================================== */
        if (thumbnailFile) {
          try {
            const thumbPath = `blogs/${blogId}/thumbnail.webp`;

            const { error: uploadError } = await supabase.storage
              .from("blog-thumbnails")
              .upload(thumbPath, thumbnailFile, { upsert: true });

            if (uploadError) throw uploadError;

            const thumbnailUrl = supabase.storage
              .from("blog-thumbnails")
              .getPublicUrl(thumbPath).data.publicUrl;

            await supabase
              .from("blogs")
              .update({ thumbnail_url: thumbnailUrl })
              .eq("id", blogId);

          } catch (thumbErr) {
            console.warn("Thumbnail upload failed:", thumbErr);
            showToast("Blog saved, but thumbnail upload failed", "warning");
          }
        }

        /* =========================
           UPDATE BLOG (EDIT MODE)
        ========================= */
        if (params.get("id")) {
          const updateData = {
            title,
            slug,
            excerpt,
            content
          };

          const { error } = await supabase
            .from("blogs")
            .update(updateData)
            .eq("id", blogId);

          if (error) throw error;

          showToast("Blog updated successfully", "success");
        } else {
          showToast("Blog published successfully", "success");
          window.location.href = "/pages/admin/blog-list.html";
        }

      } catch (err) {
        console.error("BLOG ERROR:", err);
        showToast(err.message || "Operation failed", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });


    async function deleteBlog(blogId) {
  if (!confirm("Are you sure you want to delete this blog?")) return;

  try {
    showToast("Deleting blog…", "info");

    /* =========================
       DELETE THUMBNAIL
    ========================= */
    try {
      await supabase.storage
        .from("blog-thumbnails")
        .remove([`blogs/${blogId}/thumbnail.webp`]);
    } catch (err) {
      console.warn("Thumbnail delete failed (ignored)", err);
    }

    /* =========================
       DELETE INLINE IMAGES
    ========================= */
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
    } catch (err) {
      console.warn("Inline images delete failed (ignored)", err);
    }

    /* =========================
       DELETE BLOG ROW (FINAL)
    ========================= */
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
       LOAD BLOG DATA
    ========================= */
    async function loadBlogForEdit(id) {
      showToast("Loading blog…", "info");

      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        showToast("Blog not found", "error");
        return;
      }

      titleInput.value = data.title;
      slugInput.value = data.slug;
      excerptInput.value = data.excerpt || "";
      quill.root.innerHTML = data.content;

      showToast("Edit mode enabled", "success", 1500);
    }

    /* =========================
       INLINE IMAGE UPLOAD
    ========================= */
    async function imageHandler() {
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
  });
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
