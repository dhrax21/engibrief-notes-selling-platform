import { supabase } from "/js/supabase.js";

/* =========================
   TOAST HELPER
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

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("rzpUploadForm");
  if (!form) return;

  /* INPUT BINDINGS */
  const titleInput = document.getElementById("title");
  const subjectInput = document.getElementById("subject");
  const departmentInput = document.getElementById("department");
  const examInput = document.getElementById("exam");
  const priceInput = document.getElementById("price");
  const razorpayLinkInput = document.getElementById("razorpayLink");
  const coverFileInput = document.getElementById("coverFile");

  /* AUTH + ADMIN CHECK */
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return location.replace("/pages/auth.html");

  const isAdmin = session.user.user_metadata?.role === "admin";
  if (!isAdmin) return location.replace("/index.html");

  /* =========================
     SUBMIT HANDLER
  ========================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    const title = titleInput.value.trim();
    const subject = subjectInput.value.trim();
    const department = departmentInput.value.trim().toUpperCase();
    const exam = examInput ? examInput.value.trim() || null : null;
    const price = Number(priceInput.value);
    const razorpay_link = razorpayLinkInput.value.trim();
    const coverFile = coverFileInput.files[0];

    /* VALIDATION */
    if (!title || !subject || !department || !razorpay_link || !coverFile) {
      showToast("All required fields are needed", "error");
      btn.disabled = false;
      return;
    }

    if (!razorpay_link.startsWith("https://")) {
      showToast("Invalid Razorpay link", "error");
      btn.disabled = false;
      return;
    }

    try {
      showToast("Uploading cover image…", "info", 2000);

      /* COVER UPLOAD */
      const ts = Date.now();
      const coverPath = `covers/${department}/${ts}-${coverFile.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("book-covers-rzp")
        .upload(coverPath, coverFile, { upsert: false });

      if (uploadErr) throw uploadErr;

      showToast("Publishing ebook…", "info", 2000);

      /* INSERT METADATA */
      const { error } = await supabase
        .from("ebooks_rzp")
        .insert({
          title,
          subject,
          department,
          exam,
          price,
          razorpay_link,
          cover_path: coverPath,
          is_active: true,
        });

      if (error) throw error;

      showToast("Ebook published successfully", "success", 2500);
      form.reset();

    } catch (err) {
      console.error("RZP upload failed:", err);
      showToast(err.message || "Something went wrong", "error", 3000);
    } finally {
      btn.disabled = false;
    }
  });
});
