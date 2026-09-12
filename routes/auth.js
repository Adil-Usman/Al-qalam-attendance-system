const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Show Register Page
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Handle Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, secret } = req.body;

    // Check secret code
    if (secret !== process.env.REGISTER_SECRET) {
      return res.render('register', { error: 'Invalid Secret Code. Please try again.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'This email is already registered.' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'teacher'
    });

    await user.save();
    res.redirect('/auth/login');
  } catch (error) {
    console.log(error);
    res.render('register', { error: 'Something went wrong. Please try again.' });
  }
});

// Show Login Page
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    // Save user in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Redirect based on role
    if (user.role === 'message_faculty') {
      return res.redirect('/absent');
    } else {
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.log(error);
    res.render('login', { error: 'Login failed. Please try again.' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;