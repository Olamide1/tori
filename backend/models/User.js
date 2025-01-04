const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, },
  fullName: { type: String, required: true },
  companyName: { type: String }, // TODO: remove this, no longer needed since we're using ref to company now
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

// Remove __v when converting to JSON or Object
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v; // Remove __v
    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.__v; // Remove __v
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
