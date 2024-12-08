const express = require("express");
const router = express.Router();
const Subscriber = require("../models/Subscriber");
const { verifyToken } = require("../middlewares/authMiddleware");

// POST: Add a new subscriber
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ message: "Email is required" });

    const subscriber = new Subscriber({ email, plan: "Trial", remainingQueries: 3 });
    await subscriber.save();
    res.status(201).send({ message: "Subscriber added successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error adding subscriber", error });
  }
});

// GET: Get subscription details
router.get("/details", verifyToken, async (req, res) => {
  try {
    const { email } = req.user; // Use email from the token
    const subscriber = await Subscriber.findOne({ email });

    if (!subscriber) {
      return res.status(404).send({ message: "Subscriber not found." });
    }

    res.send({
      plan: subscriber.plan,
      remainingQueries: subscriber.remainingQueries,
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).send({ message: "Error fetching subscription details.", error });
  }
});

// POST: Upgrade to Pro
router.post("/upgrade", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const subscriber = await Subscriber.findOneAndUpdate(
      { email },
      { plan: "Pro", remainingQueries: Infinity },
      { new: true }
    );

    if (!subscriber) return res.status(404).send({ message: "Subscriber not found." });

    res.send({ message: "Successfully upgraded to Pro plan.", plan: subscriber.plan });
  } catch (error) {
    res.status(500).send({ message: "Error upgrading subscription.", error });
  }
});

module.exports = router;
