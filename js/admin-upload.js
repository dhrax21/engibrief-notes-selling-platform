import { supabase } from "/js/supabase.js";

/* =====================================================
   ADMIN UPLOAD INITIALIZER
===================================================== */
if (!window.__adminUploadInitialized) {
  window.__adminUploadInitialized = true;

  document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("uploadForm");
    if (!form) return;

    /* =========================
       AUTH CHECK
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
       ROLE CHECK
    ========================= */
    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (roleError || profile?.role !== "admin") {
      showToast("Access denied. Admins only.", "error", 2200);

      setTimeout(() => {
        window.location.replace("/index.html");
      }, 2000);

      return;
    }


    /* =========================
       FORM SUBMIT
    ========================= */
  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector("button[type='submit']");
  submitBtn.disabled = true;

  const title = document.getElementById("title").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const departmentRaw = document.getElementById("department").value.trim();
  const price = Number(document.getElementById("price").value);

  const coverFile = document.getElementById("coverFile").files[0];
  const pdfFile = document.getElementById("pdfFile").files[0];

  // =========================
  // VALIDATION
  // =========================
  if (!title || !subject || !departmentRaw || !price) {
    showToast("All fields are required", "error", 2500);
    submitBtn.disabled = false;
    return;
  }

  if (!coverFile || !pdfFile) {
    showToast("Cover image and PDF are required", "error", 2500);
    submitBtn.disabled = false;
    return;
  }

  if (price <= 0) {
    showToast("Price must be greater than zero", "error", 2500);
    submitBtn.disabled = false;
    return;
  }

  const department = departmentRaw.toLowerCase();
  const timestamp = Date.now();

  try {
    showToast("Uploading content…", "info", 2000);

    /* =========================
       UPLOAD COVER (PUBLIC)
    ========================= */
    const coverPath = `covers/${department}/${timestamp}-${coverFile.name}`;

    const { error: coverError } = await supabase.storage
      .from("ebook-covers") // PUBLIC bucket
      .upload(coverPath, coverFile, { upsert: false });

    if (coverError) throw coverError;

    /* =========================
       UPLOAD PDF (PRIVATE)
    ========================= */
    const pdfPath = `${department}/${timestamp}-${pdfFile.name}`;

    const { error: pdfError } = await supabase.storage
      .from("ebooks") // PRIVATE bucket
      .upload(pdfPath, pdfFile, { upsert: false });

    if (pdfError) throw pdfError;

    /* =========================
       SAVE METADATA
    ========================= */
    const { error: dbError } = await supabase
      .from("ebooks")
      .insert({
        title,
        subject,
        department: department.toUpperCase(),
        price,
        pdf_path: pdfPath,
        cover_path: coverPath,
        is_active: true
      });

    if (dbError) throw dbError;

    showToast("Upload successful", "success", 2000);
    form.reset();

  } catch (err) {
    console.error("Upload failed:", err);
    showToast(err.message || "Upload failed", "error", 3000);
  } finally {
    submitBtn.disabled = false;
  }
   });
  })};
