const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const databaseSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["mysql", "postgresql", "mongodb"], // Database types
  },
  host: {
    type: String,
    required: true,
  },
  port: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  databaseName: {
    type: String, // Only for relational databases
    required: function () {
      return this.type !== "mongodb"; // Database name required for SQL databases
    },
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company", // Links to the Company model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Database = mongoose.model("Database", databaseSchema);
module.exports = Database;
