import { addDoc, collection, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db, auth } from "./firebase.js";

console.log("👤 User:", auth.currentUser?.email);

try {
  await addDoc(collection(db, "uploads"), {
    test: "ok",
    createdAt: serverTimestamp(),
    by: auth.currentUser?.email || "unknown"
  });

  console.log("🔥 FIRESTORE WRITE SUCCESS");

} catch (e) {
  console.error("❌ FIRESTORE WRITE FAILED", e);
}
