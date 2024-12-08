const express = require("express");
const mongoose = require("./config/db");
const subscriberRoutes = require("./routes/subscribers");
const authRoutes = require("./routes/auth");
const schemaRoutes = require("./routes/schemas");




const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(require("cors")());

// Routes
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schemas", schemaRoutes);



// Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
