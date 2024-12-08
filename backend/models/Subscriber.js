const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  plan: { type: String, enum: ["Trial", "Pro"], default: "Trial" },
  remainingQueries: { type: Number, default: 3 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);
