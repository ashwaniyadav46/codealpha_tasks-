require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codealpha_ecommerce";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  image: { type: String, default: "" },
  category: { type: String, default: "General" }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: "" },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

// Initial sample catalog
const sampleProducts = [
  {
    name: "Wireless Noise-Canceling Headphones",
    description: "High-fidelity audio with active noise cancellation, 30-hour battery life, and comfortable memory foam ear cushions.",
    price: 1499,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    category: "Audio"
  },
  {
    name: "Smart Fitness Watch",
    description: "Advanced health tracking with heart-rate monitor, SpO2 sensor, sleep analysis, and water resistance up to 50m.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
    category: "Wearables"
  },
  {
    name: "Ergonomic Laptop Backpack",
    description: "Water-resistant, anti-theft backpack with dedicated padded sleeve for up to 16-inch laptops and USB charging port.",
    price: 999,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    category: "Accessories"
  },
  {
    name: "RGB Mechanical Keyboard",
    description: "Compact 75% mechanical keyboard with customizable RGB backlighting, hot-swappable switches, and aluminum top frame.",
    price: 1999,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800",
    category: "Computers"
  },
  {
    name: "Ultra-Fast Wireless Charger",
    description: "15W fast wireless charging pad with intelligent temperature protection and LED status indicator.",
    price: 699,
    image: "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800",
    category: "Accessories"
  },
  {
    name: "Portable Bluetooth Speaker",
    description: "Compact IPX7 waterproof speaker delivering 360-degree punchy bass and up to 14 hours of continuous playtime.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800",
    category: "Audio"
  }
];

// --- Product Routes ---
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Could not load products" });
  }
});

// Single product details
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error loading product details" });
  }
});

app.post("/api/products/seed", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      return res.json({ message: "Products already seeded" });
    }
    await Product.insertMany(sampleProducts);
    res.json({ message: "Sample products added successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to seed products" });
  }
});

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password // Plain for simple demo; in production use bcrypt
    });

    res.status(201).json({
      message: "Registration successful!",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful!",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: "Error during login" });
  }
});

// --- Order Routes ---
app.post("/api/orders", async (req, res) => {
  try {
    const { items, customerName, customerEmail, userId } = req.body;
    if (!items?.length || !customerName) {
      return res.status(400).json({ message: "Customer name and cart items are required." });
    }

    const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const order = await Order.create({
      userId: userId || null,
      customerName,
      customerEmail: customerEmail || "",
      items,
      total
    });

    res.status(201).json({
      message: "Order placed successfully! Thank you for shopping with us.",
      order
    });
  } catch (err) {
    res.status(500).json({ message: "Could not place order: " + err.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const { email, userId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    else if (email) query.customerEmail = email.toLowerCase();

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Could not load orders" });
  }
});

// --- Server Startup ---
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully:", MONGO_URI);

    // Auto-seed if catalog is empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await Product.insertMany(sampleProducts);
      console.log("Auto-seeded catalog with sample products.");
    }

    app.listen(PORT, () => {
      console.log(`E-commerce store running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
