const admin = require("firebase-admin");

// 🔐 Load service account key
const serviceAccount = require("./serviceAccountKey.json");

console.log("🔥 Script started");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase initialized");

// 🔴 REPLACE WITH REAL UID
const uid = "CqqwGWEFf8VkkoLzc1biaa9pfXx1";

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("✅ Admin role granted successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
