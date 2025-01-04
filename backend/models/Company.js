const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Links to the User model
    required: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to the User model
    },
  ],
  databases: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Database", // Links to the Database model
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Remove __v when converting to JSON or Object
companySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v; // Remove __v
    return ret;
  },
});

companySchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.__v; // Remove __v
    return ret;
  },
});

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
