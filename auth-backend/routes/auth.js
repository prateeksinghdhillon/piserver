const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const crypto = require("crypto");

const router = express.Router();

// Helper function to validate fullname
const validateFullName = (fullname) => {
  return /^[A-Za-z]+\s?[A-Za-z]+$/.test(fullname);
};

// Register API
router.post("/register", async (req, res) => {
  const { fullname, username, password } = req.body;

  if (!validateFullName(fullname)) {
    return res
      .status(400)
      .json({ message: "Fullname can only have one space between words." });
  }

  const usernameRegex = /^[A-Za-z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return res
      .status(400)
      .json({ message: "Username can only contain letters and numbers." });
  }

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const newUser = new User({ fullname, username, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Login API
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate random 15 character token
    const token = crypto.randomBytes(15).toString("hex");
    const localIp = user.localIp;
    const fullname = user.fullname;
    user.token = token;
    await user.save();
    res
      .status(200)
      .json({ message: "Login successful!", token, localIp, fullname });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/update-ip", async (req, res) => {
  const { username, localIp } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid Username." });
    }
    user.localIp = localIp;
    await user.save();
    res.status(200).json({ message: `IP Updated successful! to ${localIp}` });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Change Password API
router.post("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    // '*' allows all origins
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
