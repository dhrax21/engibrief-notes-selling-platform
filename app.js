// Initialize Firebase
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Example: Fetch products
function loadProducts() {
    const container = document.getElementById("productContainer");
    if (!container) return;

    db.collection("products").get().then(snapshot => {
        container.innerHTML = "";
        snapshot.forEach(doc => {
            const p = doc.data();
            container.innerHTML += `
                <div class="feature-card">
                    <h3>${p.title}</h3>
                    <p>₹${p.price}</p>
                    <a href="product-detail.html?id=${doc.id}">View Details</a>
                </div>
            `;
        });
    });
}
loadProducts();
