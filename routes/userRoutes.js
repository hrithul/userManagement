const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = express.Router();
const {
  ensureAuthenticated,
  redirectIfLoggedIn,
  redirectIfAdminLoggedIn
} = require('../middleware/auth');


// Signup
router.get('/signup', redirectIfLoggedIn, (req, res) => res.render('signup',{title:'Sign Up'}));

router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if the username or email is already taken
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      req.flash('error', 'Username or Email already exists');
      return res.redirect('/signup');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, email });
    req.flash('success', 'Registration Successful!');
    res.redirect('/login');
  } catch (error) {
    req.flash('error', 'Registration failed. Please try again');
    console.error('Error during signup:', error);
    res.redirect('/signup');
  }
});

// Login
router.get('/login', redirectIfLoggedIn, (req, res) => res.render('login',{title:'Login'}));

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    // Validate user credentials
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user; // Save user session
      req.flash('success', 'Login successful!');
      res.redirect('/home'); // Redirect to home instead of rendering it
    } else {
      req.flash('error', 'Invalid username or password');
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Error during login:', error);
    req.flash('error', 'An error occurred during login. Please try again.');
    res.redirect('/login');
  }
});

// Home - only accessible when logged in
router.get('/home', ensureAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user, title:'Home' });
});

// Logout
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.redirect('/login');
  });
});

module.exports = router;
