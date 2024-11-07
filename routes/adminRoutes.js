const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const User = require('../models/user');
const router = express.Router();
const { ensureAdminAuthenticated, redirectIfAdminLoggedIn } = require('../middleware/auth');

// Admin Login - GET
router.get('/login', redirectIfAdminLoggedIn, (req, res) => {
  res.render('adminLogin', { title: 'Admin Login' });
});

// Admin Login - POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });

    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.admin = admin;
      return res.redirect('/admin/panel');
    }

    // If login failed, render with error message
    req.flash('error', 'Invalid credentials');
    return res.redirect('/admin/login');  // Redirect to login page
  } catch (error) {
    console.error('Error during admin login:', error);
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect('/admin/login');  // Redirect to login page on error
  }
});

// Admin Panel - GET (View/Search Users)
router.get('/panel', ensureAdminAuthenticated, async (req, res) => {
  const searchQuery = req.query.search || '';
  const query = searchQuery ? {
    $or: [
      { username: new RegExp(searchQuery, 'i') },
      { email: new RegExp(searchQuery, 'i') }
    ]
  } : {};

  try {
    const users = await User.find(query);
    res.render('adminPanel', {
      title: 'Admin Panel',
      users,
      admin: req.session.admin,
      searchQuery
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('adminPanel', {
      title: 'Admin Panel',
      error: 'Unable to fetch user data',
      admin: req.session.admin,
      searchQuery
    });
  }
});

// Create a New User - POST
router.post('/create', ensureAdminAuthenticated, async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      req.flash('error', 'Username or Email already exists.');
      return res.redirect('/admin/panel');  // Redirect back to the admin panel
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, email });
    req.flash('success', 'User created successfully.');
    return res.redirect('/admin/panel');  // Redirect to admin panel after success
  } catch (error) {
    console.error('Error creating user:', error);
    req.flash('error', 'An error occurred while creating the user');
    return res.redirect('/admin/panel');  // Redirect to admin panel on error
  }
});

// Edit User Details - POST
router.post('/edit/:id', ensureAdminAuthenticated, async (req, res) => {
  const { username, email } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { username, email });
    req.flash('success', 'User updated successfully.');
    return res.redirect('/admin/panel');  // Redirect to admin panel after success
  } catch (error) {
    console.error('Error updating user:', error);
    req.flash('error', 'An error occurred while updating the user');
    return res.redirect('/admin/panel');  // Redirect to admin panel on error
  }
});

// Delete a User - POST
router.post('/delete/:id', ensureAdminAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'User deleted successfully.');
    return res.redirect('/admin/panel');  // Redirect to admin panel after success
  } catch (error) {
    console.error('Error deleting user:', error);
    req.flash('error', 'An error occurred while deleting the user');
    return res.redirect('/admin/panel');  // Redirect to admin panel on error
  }
});

// Admin Logout - GET
router.get('/logout', ensureAdminAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during admin logout:', err);
      return res.redirect('/admin/panel');
    }
    res.clearCookie('connect.sid');
    return res.redirect('/admin/login');  // Redirect to login page after logout
  });
});

// Redirect '/' to Admin Login
router.get('/', redirectIfAdminLoggedIn, (req, res) => {
  res.redirect('/admin/login');
});

module.exports = router;
