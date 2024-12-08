const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Adjust the model path if necessary
const Subscriber = require("../models/Subscriber"); // Add this at the top

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { verifyToken } = require("../middlewares/authMiddleware");


// POST: Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, fullName, companyName, email, password } = req.body;

    // Check for missing fields
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "This username is already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username,
      fullName,
      companyName,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create a new subscriber with a trial plan
    const subscriber = new Subscriber({
      email,
      plan: "Trial",
      remainingQueries: 3, // Set initial trial queries
    });

    await subscriber.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the user already has a subscriber record
    let subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      // Create a default subscriber record if none exists
      subscriber = new Subscriber({
        email,
        plan: "Trial",
        remainingQueries: 3,
      });
      await subscriber.save();
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST: Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Construct the reset URL
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    // Send the reset email
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. The link will expire in 1 hour.</p>`,
    });

    res.status(200).json({ message: "Reset email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Protected routes
router.put("/update-profile", verifyToken, async (req, res) => {
  try {
    const { username, companyName } = req.body;
    const userId = req.user.id;

    // Check if the username already exists for another user
    const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUsername) {
      return res.status(400).json({ message: "This username is already taken" });
    }

    // Update the user's profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, companyName },
      { new: true }
    );

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});


router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
});

router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password"); // Exclude password from the response

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
});


 

module.exports = router;
