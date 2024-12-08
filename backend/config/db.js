const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/tori";
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = mongoose;
