const ADMIN_EMAIL = "manksingh36@gmail.com";


/* ================= GLOBAL MODAL (AUTO-INJECTED) ================= */

(function createGlobalModal() {
    const modalHTML = `
        <div id="modalOverlay" class="modal-overlay" style="display:none">
            <div class="modal">
                <h3 id="modalTitle">Message</h3>
                <p id="modalMessage"></p>
                <button class="modal-btn" id="modalCloseBtn">OK</button>
            </div>
        </div>
    `;

    document.addEventListener("DOMContentLoaded", () => {
        document.body.insertAdjacentHTML("beforeend", modalHTML);

        document
            .getElementById("modalCloseBtn")
            .addEventListener("click", closeModal);
    });
})();

/* ================= MODAL FUNCTIONS ================= */

function showModal(title, message) {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const msgEl   = document.getElementById("modalMessage");

    if (!overlay) {
        console.error("Modal not initialized");
        return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.style.display = "flex";
}

function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (overlay) overlay.style.display = "none";
}



if (typeof firebase === "undefined") {
    alert("FIREBASE IS UNDEFINED — SDK NOT LOADED");
    throw new Error("Firebase SDK not loaded");
}

console.log("Firebase is available");



// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log("Firebase initialized");

// ✅ DEFINE AUTH FIRST
const auth = firebase.auth();
const db   = firebase.firestore();

// (Optional) expose auth globally if needed
window.auth = auth;

// ✅ NOW IT IS SAFE TO USE auth
auth.onAuthStateChanged(user => {
    console.log("Auth state:", user ? user.email : "NO USER");

    const path = window.location.pathname;

    /* ---------- NAVBAR ---------- */
    const authArea = document.getElementById("authArea");
    if (authArea) {
        if (user) {
            authArea.innerHTML = `
                <div class="user-menu">
                    <span class="user-name">${user.displayName || user.email}</span>
                    <button class="logout-btn" onclick="logoutUser()">Logout</button>
                </div>
            `;
        } else {
            authArea.innerHTML = `<a href="login.html" class="login-btn">Login</a>`;
        }
    }

    /* ---------- PAGE PROTECTION ONLY ---------- */
    if (path.includes("profile.html")) {
        if (!user) {
            window.location.href = "login.html";
        } else {
            const emailEl = document.getElementById("profileEmail");
            const nameEl  = document.getElementById("profileName");

            if (emailEl) emailEl.value = user.email;
            if (nameEl)  nameEl.value = user.displayName || "";
        }
    }

    /* ---------- ADMIN PAGE PROTECTION ---------- */
    if (path.includes("admin.html")) {
        if (!user || user.email !== ADMIN_EMAIL) {
            showModal(
                "Access Denied",
                "You are not authorized to access the admin panel."
            );
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
            return;
        }
    }
});




/* ---------------- AUTH FUNCTIONS ---------------- */

// LOGIN
function loginUser() {
    auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch(() => {
        showModal(
        "Login Failed",
        "Incorrect email or password. Please try again."
    );
});

}


// SIGNUP
function signupUser() {
    auth.createUserWithEmailAndPassword(signupEmail.value, signupPassword.value)
        .then(res => {
            return db.collection("users").doc(res.user.uid).set({
                email: res.user.email,
                uid: res.user.uid,
                createdAt: Date.now()
            });
        })
        .then(() => {
        window.location.href = "index.html";
        }).catch(err => alert(err.message));
}

// GOOGLE LOGIN
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(() => window.location.href = "index.html")
        .catch(err => alert(err.message));
}

// LOGOUT
function logoutUser() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}

function forgotPassword() {
    const email = document.getElementById("loginEmail")?.value;

    if (!email) {
        alert("Please enter your email address first.");
        return;
    }

  auth.sendPasswordResetEmail(email)
    .then(() => {
        showModal(
            "Email Sent",
            "A password reset link has been sent to your email."
        );
    })
    .catch(err => {
        showModal("Error", err.message);
    });

}

