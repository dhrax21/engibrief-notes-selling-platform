import { supabase } from "./supabase.js";

if (!window.__adminUploadInitialized) {
  window.__adminUploadInitialized = true;

  document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("uploadForm");
    if (!form) return;

    /* =========================
       AUTH & ROLE CHECK
    ========================= */
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login as admin");
      location.href = "login.html";
      return;
    }

    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError || profile?.role !== "admin") {
      alert("Admins only");
      location.href = "index.html";
      return;
    }

    /* =========================
       FORM SUBMIT
    ========================= */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      console.log("🚀 Upload started");

      const title = document.getElementById("title").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const departmentRaw = document.getElementById("department").value.trim();
      const price = Number(document.getElementById("price").value);

      const coverFile = document.getElementById("coverFile").files[0];
      const pdfFile = document.getElementById("pdfFile").files[0];

      if (!title || !subject || !departmentRaw || !price) {
        alert("All fields required");
        return;
      }

      if (!coverFile || !pdfFile) {
        alert("Cover image and PDF required");
        return;
      }

      const department = departmentRaw.toLowerCase();
      const timestamp = Date.now();

      try {
        /* =========================
           UPLOAD COVER IMAGE
        ========================= */
        const coverPath = `covers/${department}/${timestamp}-${coverFile.name}`;

        const { error: coverError } = await supabase.storage
          .from("ebooks")
          .upload(coverPath, coverFile);

        if (coverError) throw coverError;

        /* =========================
           UPLOAD PDF
        ========================= */
        const pdfPath = `${department}/${timestamp}-${pdfFile.name}`;

        const { error: pdfError } = await supabase.storage
          .from("ebooks")
          .upload(pdfPath, pdfFile);

        if (pdfError) throw pdfError;

        /* =========================
           SAVE METADATA TO DB
        ========================= */
        const { error: dbError } = await supabase
          .from("ebooks")
          .insert([
            {
              title,
              subject,
              department: department.toUpperCase(),
              price,
              pdf_path: pdfPath,
              cover_path: coverPath
            }
          ]);

        if (dbError) throw dbError;

        console.log("✅ Upload complete");
        alert("Upload successful");
        form.reset();

      } catch (err) {
        console.error("❌ Upload failed:", err);
        alert(err.message || "Upload failed");
      }
    });
  });
}
