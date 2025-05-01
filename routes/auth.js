const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// GET Login/Register pages
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// POST Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'Email already exists' });
    }
    await User.create({ username, email, password });
    res.redirect('/login');
  } catch (err) {
    res.render('register', { error: 'Something went wrong!' });
  }
});

// POST Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    // Save session or token logic here
    res.redirect('/dashboard'); // change to your app's route
  } catch (err) {
    res.render('login', { error: 'Login error' });
  }
});

  
module.exports = router;