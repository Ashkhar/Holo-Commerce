const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cartItems: [{
    name: String,
    price: Number,
    quantity: Number,
  }],
  address: String,
  paymentMethod: { type: String, enum: ["UPI", "Card", "Cash on Delivery"], required: true },
  total: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
