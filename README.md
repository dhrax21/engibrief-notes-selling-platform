
# 📘 Engibrief

**A modern platform for selling and delivering engineering e-books**

Engibrief is a full-stack web application that allows engineering students to **browse, purchase, and access high-quality academic e-books**, while providing administrators with secure tools to manage content.

Built with **Firebase** and **vanilla web technologies**, Engibrief focuses on **clarity, performance, and real-world production practices**.

---

## 🚀 Live Vision

> *“Engineering notes should save time, not waste it.”*

Engibrief is designed to:

* Eliminate cluttered PDFs and random notes
* Provide **exam-focused, structured content**
* Offer a **secure and scalable distribution model** for digital content

---

## ✨ Key Features

### 👨‍🎓 User Features

* 🔐 Secure authentication (Email/Password & Google Sign-In)
* 📚 Public e-book browsing
* 👤 Profile management
* 🔒 Role-based access control
* ⚡ Fast, responsive UI (no heavy frameworks)

### 🧑‍💼 Admin Features

* 🛡 Admin-only dashboard (via Firebase custom claims)
* 📤 Upload e-books (cover image + PDF)
* ☁️ Secure file storage with Firebase Storage
* 🗂 Metadata management using Firestore
* 🔐 Write access restricted at the database & storage level

---

## 🏗 Tech Stack

### Frontend

* HTML5
* CSS3 (custom, no frameworks)
* JavaScript (ES Modules)

### Backend / Cloud

* **Firebase Authentication** (v10 modular SDK)
* **Cloud Firestore**
* **Firebase Storage**
* **Firebase Admin SDK** (for admin role assignment)

### Security

* Firebase Security Rules (Firestore & Storage)
* API key restrictions via Google Cloud Console
* Custom claims for admin access
* Referrer-based request validation

---

## 🔐 Authentication Flow

* Users authenticate using Firebase Auth
* Admins are identified via **custom claims**
* Navbar dynamically updates based on auth state
* Protected routes (`admin.html`, uploads) are enforced both:

  * On the client
  * At the database & storage rule level

---

---

## 🛡 Security Highlights

* 🔒 Admin actions protected by **Firebase custom claims**
* 🔒 Firestore rules prevent unauthorized writes
* 🔒 Storage rules restrict uploads to admins only
* 🔒 API key protected using HTTP referrer restrictions
* ❌ No secrets committed to GitHub

---

## 🧪 Local Development

### Requirements

* Node.js (for Firebase CLI)
* Firebase project

### Run locally

```bash
# Optional but recommended
firebase serve
```

Or using VS Code Live Server:

```
http://localhost:5500
```

> ⚠️ LAN IPs must be explicitly allowed in API key restrictions.

---

## 📈 Current Status

* ✅ Authentication system complete
* ✅ Admin role enforcement complete
* ✅ Public e-book listing complete
* ✅ Landing page redesigned
* ⏳ Payment integration (planned)
* ⏳ Protected downloads (planned)

---

## 🧠 Design Philosophy

* **No over-engineering**
* **No unnecessary frameworks**
* **Production-first decisions**
* Clean separation of concerns
* Firebase used as a real backend, not a shortcut

---

## 🤝 Contribution & Collaboration

This project is actively evolving.
Contributions, reviews, and suggestions are welcome.

If you are interested in:

* Ed-tech
* Firebase-based architectures
* Clean frontend engineering

Feel free to reach out.

---

## 👤 Author

**Dheeraj Singh**
Software Engineer | Backend & Full-Stack Enthusiast

> Built as a real-world learning project with production standards in mind.

---

## ⭐ If You Like This Project

* Star the repository ⭐
* Share feedback
* Suggest improvements

Just tell me.
