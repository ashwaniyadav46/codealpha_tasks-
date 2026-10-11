// State management
let products = [];
let cart = JSON.parse(localStorage.getItem("codealpha_cart") || "[]");
let currentUser = JSON.parse(localStorage.getItem("codealpha_user") || "null");
let selectedProduct = null;

// DOM Elements
const productsGrid = document.getElementById("productsGrid");
const cartItemsList = document.getElementById("cartItemsList");
const cartCount = document.getElementById("cartCount");
const subtotalEl = document.getElementById("subtotal");
const cartTotalEl = document.getElementById("cartTotal");
const custNameInput = document.getElementById("custName");
const custEmailInput = document.getElementById("custEmail");
const checkoutStatus = document.getElementById("checkoutStatus");

// Modals
const detailsModal = document.getElementById("detailsModal");
const authModal = document.getElementById("authModal");
const ordersModal = document.getElementById("ordersModal");

// Auth display elements
const userStatusText = document.getElementById("userStatusText");
const authBtn = document.getElementById("authBtn");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  loadProducts();
  renderCart();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById("seedBtn").addEventListener("click", resetSampleProducts);
  document.getElementById("placeOrderBtn").addEventListener("click", handleCheckout);
  document.getElementById("clearCartBtn").addEventListener("click", clearCart);
  document.getElementById("authBtn").addEventListener("click", openAuthModal);
  document.getElementById("myOrdersBtn").addEventListener("click", openOrdersModal);

  document.getElementById("detailAddToCartBtn").addEventListener("click", () => {
    if (selectedProduct) {
      addToCart(selectedProduct._id);
      closeDetailsModal();
    }
  });

  // Close modals on backdrop click
  window.addEventListener("click", (e) => {
    if (e.target === detailsModal) closeDetailsModal();
    if (e.target === authModal) closeAuthModal();
    if (e.target === ordersModal) closeOrdersModal();
  });
}

// ================= PRODUCT FUNCTIONS =================
async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    products = await res.json();
    renderProducts();
  } catch (err) {
    productsGrid.innerHTML = `<p class="status-msg" style="color:red;">Error loading products: ${err.message}</p>`;
  }
}

function renderProducts() {
  if (!products.length) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
        <p>No products available right now.</p>
        <button class="btn btn-primary" onclick="resetSampleProducts()">Load Sample Products</button>
      </div>`;
    return;
  }

  productsGrid.innerHTML = products.map((p) => `
    <article class="product-card" onclick="openDetailsModal('${p._id}')">
      <div class="card-img-wrap">
        <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-category">${p.category || 'General'}</span>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <p class="card-desc">${escapeHtml(p.description || '')}</p>
        <div class="card-footer">
          <span class="card-price">₹${p.price}</span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addToCart('${p._id}')">
            + Add
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

async function resetSampleProducts() {
  try {
    const res = await fetch("/api/products/seed", { method: "POST" });
    const data = await res.json();
    alert(data.message);
    loadProducts();
  } catch (err) {
    alert("Error seeding products: " + err.message);
  }
}

// ================= PRODUCT DETAILS MODAL =================
async function openDetailsModal(id) {
  selectedProduct = products.find(p => p._id === id);
  if (!selectedProduct) {
    try {
      const res = await fetch(`/api/products/${id}`);
      selectedProduct = await res.json();
    } catch {
      return;
    }
  }

  document.getElementById("detailImg").src = selectedProduct.image || 'https://via.placeholder.com/300';
  document.getElementById("detailTitle").textContent = selectedProduct.name;
  document.getElementById("detailCategory").textContent = selectedProduct.category || "General";
  document.getElementById("detailPrice").textContent = `₹${selectedProduct.price}`;
  document.getElementById("detailDescription").textContent = selectedProduct.description || "No description provided.";

  detailsModal.classList.remove("hidden");
}

function closeDetailsModal() {
  detailsModal.classList.add("hidden");
  selectedProduct = null;
}

// ================= CART FUNCTIONS =================
function addToCart(productId) {
  const product = products.find(p => p._id === productId);
  if (!product) return;

  const existing = cart.find(item => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
}

function changeQty(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
  }
  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("codealpha_cart", JSON.stringify(cart));
}

function renderCart() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartCount.textContent = totalCount;
  subtotalEl.textContent = totalPrice;
  cartTotalEl.textContent = totalPrice;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `<p class="empty-cart-msg">Your cart is currently empty.</p>`;
    return;
  }

  cartItemsList.innerHTML = cart.map((item, i) => `
    <div class="cart-row">
      <div class="cart-row-info">
        <span class="cart-row-title">${escapeHtml(item.name)}</span>
        <span class="cart-row-pricing">₹${item.price} each</span>
      </div>
      <div class="cart-qty-ctrls">
        <button class="qty-btn" onclick="changeQty(${i}, -1)">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
      </div>
      <button class="btn-link" style="margin-left: 8px;" onclick="removeFromCart(${i})">&times;</button>
    </div>
  `).join("");
}

// ================= CHECKOUT / ORDER =================
async function handleCheckout() {
  const customerName = custNameInput.value.trim();
  const customerEmail = custEmailInput.value.trim() || (currentUser ? currentUser.email : "");

  if (!customerName) {
    showStatus("Please enter your name to place the order.", "red");
    return;
  }

  if (cart.length === 0) {
    showStatus("Your cart is empty. Add products first!", "red");
    return;
  }

  showStatus("Processing your order...", "#2563eb");

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerEmail,
        userId: currentUser ? currentUser.id : null,
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      })
    });

    const data = await res.json();
    if (res.ok) {
      showStatus(data.message, "green");
      clearCart();
    } else {
      showStatus(data.message || "Failed to place order.", "red");
    }
  } catch (err) {
    showStatus("Server connection error: " + err.message, "red");
  }
}

function showStatus(msg, color) {
  checkoutStatus.textContent = msg;
  checkoutStatus.style.color = color;
}

// ================= AUTH (LOGIN / REGISTER) =================
function updateAuthUI() {
  if (currentUser) {
    userStatusText.textContent = `👋 ${currentUser.name}`;
    authBtn.textContent = "Logout";
    custNameInput.value = currentUser.name;
    custEmailInput.value = currentUser.email;
  } else {
    userStatusText.textContent = "Guest";
    authBtn.textContent = "Login / Register";
  }
}

function openAuthModal() {
  if (currentUser) {
    // Logout
    if (confirm("Do you want to log out?")) {
      currentUser = null;
      localStorage.removeItem("codealpha_user");
      updateAuthUI();
    }
  } else {
    authModal.classList.remove("hidden");
  }
}

function closeAuthModal() {
  authModal.classList.add("hidden");
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("loginTabBtn");
  const regTab = document.getElementById("registerTabBtn");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    regForm.classList.add("hidden");
    loginTab.classList.add("active");
    regTab.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    regForm.classList.remove("hidden");
    loginTab.classList.remove("active");
    regTab.classList.add("active");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const msgEl = document.getElementById("loginMsg");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem("codealpha_user", JSON.stringify(currentUser));
      updateAuthUI();
      closeAuthModal();
      alert("Welcome back, " + currentUser.name + "!");
    } else {
      msgEl.textContent = data.message;
      msgEl.style.color = "red";
    }
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
    msgEl.style.color = "red";
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const msgEl = document.getElementById("regMsg");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      localStorage.setItem("codealpha_user", JSON.stringify(currentUser));
      updateAuthUI();
      closeAuthModal();
      alert("Registration successful! Logged in as " + currentUser.name);
    } else {
      msgEl.textContent = data.message;
      msgEl.style.color = "red";
    }
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
    msgEl.style.color = "red";
  }
}

// ================= ORDERS MODAL =================
async function openOrdersModal() {
  ordersModal.classList.remove("hidden");
  const ordersListEl = document.getElementById("ordersList");
  ordersListEl.innerHTML = `<p class="loading-state">Fetching orders...</p>`;

  try {
    let url = "/api/orders";
    if (currentUser) {
      url += `?userId=${currentUser.id}`;
    }

    const res = await fetch(url);
    const orders = await res.json();

    if (!orders.length) {
      ordersListEl.innerHTML = `<p class="empty-cart-msg">No orders placed yet.</p>`;
      return;
    }

    ordersListEl.innerHTML = orders.map((o) => `
      <div class="order-entry">
        <div class="order-entry-header">
          <span>Order ID: <b>#${o._id.substring(o._id.length - 6)}</b></span>
          <span>${new Date(o.createdAt).toLocaleString()}</span>
        </div>
        <p>Customer: <b>${escapeHtml(o.customerName)}</b> ${o.customerEmail ? `(${escapeHtml(o.customerEmail)})` : ""}</p>
        <ul style="margin: 8px 0 8px 20px; font-size: 0.9rem;">
          ${o.items.map(it => `<li>${escapeHtml(it.name)} × ${it.quantity} (₹${it.price})</li>`).join("")}
        </ul>
        <div class="order-entry-total">Total: ₹${o.total}</div>
      </div>
    `).join("");
  } catch (err) {
    ordersListEl.innerHTML = `<p style="color:red;">Failed to fetch orders: ${err.message}</p>`;
  }
}

function closeOrdersModal() {
  ordersModal.classList.add("hidden");
}

function escapeHtml(value) {
  if (!value) return "";
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
