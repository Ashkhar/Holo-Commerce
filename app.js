// ===========================
// 📦 Imports
// ===========================
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const products = require("./products");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();

// ===========================
// 🛠 MongoDB Connection
// ===========================
mongoose.connect("mongodb://localhost:27017/holoCommerce", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===========================
// ⚙️ Middleware
// ===========================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===========================
// 🔐 Auth Middleware
// ===========================
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// ===========================
// 🌐 Routes
// ===========================
app.get("/", (req, res) => {
  res.render("home", { user: req.session.user || null });
});

app.get("/register", (req, res) => {
  res.render("register", { error: null, success: null });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.render("register", { error: "Email already registered", success: null });
  const newUser = new User({ username, email, password });
  await newUser.save();
  req.session.user = newUser;
  res.redirect("/dashboard");
});



app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.render("login", { error: "Invalid email or password" });
  req.session.user = user;
  res.redirect("/dashboard");
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  const mockOrders = [
    { id: 'ORD123', date: '2025-04-01', total: '$49.99' },
    { id: 'ORD124', date: '2025-04-17', total: '$129.00' },
  ];
  res.render("dashboard", { user: req.session.user, orders: mockOrders });
});

app.get("/mall", isAuthenticated, (req, res) => {
  res.render("mall", { products, user: req.session.user });
});

app.get("/product-viewer", isAuthenticated, (req, res) => {
  const key = req.query.product;
  const product = products.find((p) => p.key === key);
  if (!product) return res.status(404).send("Product not found!");
  res.render("product-viewer", { product });
});

app.post("/add-to-cart", isAuthenticated, (req, res) => {
  const { productId } = req.body;
  const product = products.find((p) => p.key === productId);
  if (!product) return res.status(404).send("Product not found!");
  req.session.cart = req.session.cart || [];
  req.session.cart.push(product);
  res.redirect("/cart");
});

app.get("/cart", isAuthenticated, (req, res) => {
  const cartItems = req.session.cart || [];
  res.render("cart", { cartItems });
});

app.post("/remove-from-cart/:index", isAuthenticated, (req, res) => {
  const index = req.params.index;
  const cart = req.session.cart || [];
  cart.splice(index, 1);
  req.session.cart = cart;
  res.redirect("/cart");
});

app.get("/placeorder", isAuthenticated, (req, res) => {
  const cartItems = req.session.cart || [];
  const total = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  res.render("placeorder", { cartItems, total });
});

app.post("/placeorder", isAuthenticated, async (req, res) => {
  const { name, email, address, coupon, payment } = req.body;
  const cartItems = req.session.cart || [];
  if (cartItems.length === 0) return res.status(400).send("Your cart is empty!");
  const total = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  // Send confirmation email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-email-password"
    }
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Order Confirmation - HoloCommerce",
    text: `Thank you for your order, ${name}!\n\nOrder Total: ₹${total}\nShipping to: ${address}\n\n- HoloCommerce Team`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("❌ Email send failed:", error);
    else console.log("✅ Email sent:", info.response);
  });

  req.session.cart = [];
  res.redirect("/order-success");
});

app.get("/order-success", (req, res) => {
  const cartItems = req.session.cart || [];
  const total = cartItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  res.render("order-success", { cartItems, total });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.use((req, res) => {
  res.status(404).send("404 - Page Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🛒 Server running at http://localhost:${PORT}`));
