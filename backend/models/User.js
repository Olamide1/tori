const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, },
  fullName: { type: String, required: true },
  companyName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company", // Links to the Company model
  },
  role: {
    type: String,
    enum: ["owner", "admin", "member"], // Role in the company
    default: "member",
  },
});

module.exports = mongoose.model("User", userSchema);
