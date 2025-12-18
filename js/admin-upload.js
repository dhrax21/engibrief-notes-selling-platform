import { ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth, db, storage } from "./firebase.js";

// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("uploadForm");

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     // 1️⃣ Read inputs
//     const title = document.getElementById("title").value.trim();
//     const subject = document.getElementById("subject").value.trim();
//     const department = document.getElementById("department").value.trim();
//     const price = Number(document.getElementById("price").value);

//     const imageFile = document.getElementById("coverFile").files[0];
//     const pdfFile = document.getElementById("pdfFile").files[0];

//     if (!title || !subject || !department || !price) {
//       alert("All fields are required");
//       return;
//     }

//     if (!imageFile || !pdfFile) {
//       alert("Cover image and PDF are required");
//       return;
//     }

//     try {
//       const timestamp = Date.now();

//       // 2️⃣ Upload cover image
//       const imageRef = ref(
//         storage,
//         `covers/${timestamp}-${imageFile.name}`
//       );
//       await uploadBytes(imageRef, imageFile);
//       const coverURL = await getDownloadURL(imageRef);

//       // 3️⃣ Upload PDF
//       const pdfRef = ref(
//         storage,
//         `pdfs/${timestamp}-${pdfFile.name}`
//       );
//       await uploadBytes(pdfRef, pdfFile, {
//         contentType: "application/pdf"
//       });
//       const pdfURL = await getDownloadURL(pdfRef);

//       console.log("➡️ Saving metadata to Firestore...");

//       // 4️⃣ Save metadata to Firestore
//       await addDoc(collection(db, "uploads"), {
//         title,
//         subject,
//         department,
//         price,
//         coverURL,
//         pdfURL,
//         createdAt: serverTimestamp(),
//         uploadedBy: auth.currentUser.email
//       });

//       console.log("✅ Saved to Firestore");

//       alert("Upload successful");
//       form.reset();

//     } catch (err) {
//       console.error("❌ Upload or Firestore failed:", err);
//       alert("Upload failed: " + err.message);
//     }
//   });
// });

