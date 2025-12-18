import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { firebaseConfig } from "../firebase-config.js";

export const app = initializeApp(firebaseConfig);

// 🔴 EXPLICITLY bind the bucket
export const storage = getStorage(
  app,
  "gs://engibriefs-bb7a1.firebasestorage.app"
);

export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase initialized with explicit bucket");
