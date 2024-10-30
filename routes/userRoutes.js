const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const router = express.Router();
const {
  ensureAuthenticated,
  redirectIfLoggedIn,
  redirectIfAdminLoggedIn
} = require('../middleware/auth');

// Index route with redirection for logged-in users and admins
router.get('/', (req, res) => {
  // If the user is logged in, redirect to the home page
  if (req.session.user) {
    return res.redirect('/home');
  }
  // If the admin is logged in, redirect to the admin panel
  if (req.session.admin) {
    return res.redirect('/admin/panel');
  }
  // Render the index page if no one is logged in
  res.render('index');
});

// Signup
router.get('/signup', redirectIfLoggedIn, (req, res) => res.render('signup'));

router.post('/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if the username or email is already taken
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('signup', { error: 'Username or Email already exists' });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, email });
    req.flash('success', 'Registration Successfull !')
    res.redirect('/login');
  } catch (error) {
    req.flash('error','Registration failed. Please try again')
    console.error('Error during signup:', error);
    res.render('signup', { error: 'An error occurred during signup. Please try again.' });
  }
});

// Login
router.get('/login', redirectIfLoggedIn, (req, res) => res.render('login'));

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    // Validate user credentials
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user; // Save user session
      res.redirect('/home');
    } else {
      res.render('login', { error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.render('login', { error: 'An error occurred during login. Please try again.' });
  }
});

// Home - only accessible when logged in
router.get('/home', ensureAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
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
