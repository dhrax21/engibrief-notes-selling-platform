import { supabase } from "/js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("rzpUploadForm");
  if (!form) return;

  // 🔹 INPUT BINDINGS (FIX)
  const titleInput = document.getElementById("title");
  const subjectInput = document.getElementById("subject");
  const departmentInput = document.getElementById("department");
  const examInput = document.getElementById("exam");
  const priceInput = document.getElementById("price");
  const razorpayLinkInput = document.getElementById("razorpayLink");
  const coverFileInput = document.getElementById("coverFile");

  // 🔐 AUTH + ADMIN CHECK (JWT-based)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return location.replace("/pages/auth.html");

  const isAdmin = session.user.user_metadata?.role === "admin";
  if (!isAdmin) return location.replace("/index.html");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;

    const title = titleInput.value.trim();
    const subject = subjectInput.value.trim();
    const department = departmentInput.value.trim().toUpperCase();
    const exam = examInput.value.trim() || null;
    const price = Number(priceInput.value);
    const razorpay_link = razorpayLinkInput.value.trim();
    const coverFile = coverFileInput.files[0];

    if (!title || !subject || !department || !razorpay_link || !coverFile) {
      alert("All required fields are needed");
      btn.disabled = false;
      return;
    }

    if (!razorpay_link.startsWith("https://")) {
      alert("Invalid Razorpay link");
      btn.disabled = false;
      return;
    }

    // ---- COVER UPLOAD ----
    const ts = Date.now();
    const coverPath = `covers/${department}/${ts}-${coverFile.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("book-covers-rzp")
      .upload(coverPath, coverFile, { upsert: false });

    if (uploadErr) {
      alert("Cover upload failed");
      btn.disabled = false;
      return;
    }

    // ---- INSERT METADATA ONLY ----
    const { error } = await supabase.from("ebooks_rzp").insert({
      title,
      subject,
      department,
      exam,
      price,
      razorpay_link,
      cover_path: coverPath,
      is_active: true
    });

    if (error) {
      alert("Failed to publish ebook");
      btn.disabled = false;
      return;
    }

    alert("Ebook published");
    form.reset();
    btn.disabled = false;
  });
});
