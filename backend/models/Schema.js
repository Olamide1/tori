const mongoose = require("mongoose");

const schemaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  columns: [
    {
      name: { type: String, required: true },
      dataType: { type: String, required: true },
      description: { type: String, default: "No description"  },
    },
  ],
  favorites: [
    {
      name: { type: String, required: true },
      query: { type: String, required: true },
    },
  ],
  history: [
    {
      prompt: { type: String, required: true },
      generatedQuery: { type: String, required: true },
      databaseType: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Schema", schemaSchema);
