const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const User = require('../models/user');
const router = express.Router();
const {
  ensureAdminAuthenticated,
  redirectIfAdminLoggedIn
} = require('../middleware/auth');

// Admin Login
router.get('/login', redirectIfAdminLoggedIn, (req, res) => {
  res.render('adminLogin');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    // Validate admin credentials
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.admin = admin;
      res.redirect('/admin/panel');
    } else {
      res.render('adminLogin', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during admin login:', error);
    res.render('adminLogin', { error: 'An error occurred during login. Please try again.' });
  }
});

// Admin Panel - View All Users or Search Users
router.get('/panel', ensureAdminAuthenticated, async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const query = searchQuery
      ? {
          $or: [
            { username: new RegExp(searchQuery, 'i') },
            { email: new RegExp(searchQuery, 'i') }
          ]
        }
      : {};

    const users = await User.find(query);
    res.render('adminPanel', {
      users,
      admin: req.session.admin,
      searchQuery
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('adminPanel', {
      error: 'Unable to fetch user data',
      admin: req.session.admin,
      searchQuery: req.query.search || ''
    });
  }
});

// Create a new user
router.post('/create', ensureAdminAuthenticated, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, email });
    res.redirect('/admin/panel');
  } catch (error) {
    console.error('Error creating user:', error);
    res.render('adminPanel', {
      error: 'An error occurred while creating the user',
      admin: req.session.admin
    });
  }
});

// Edit user details
router.post('/edit/:id', ensureAdminAuthenticated, async (req, res) => {
  try {
    const { username, email } = req.body;
    await User.findByIdAndUpdate(req.params.id, { username, email });
    res.redirect('/admin/panel');
  } catch (error) {
    console.error('Error updating user:', error);
    res.render('adminPanel', {
      error: 'An error occurred while updating the user',
      admin: req.session.admin
    });
  }
});

// Delete a user
router.post('/delete/:id', ensureAdminAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/panel');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.render('adminPanel', {
      error: 'An error occurred while deleting the user',
      admin: req.session.admin
    });
  }
});

// Logout Admin
router.get('/logout', ensureAdminAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during admin logout:', err);
      return res.redirect('/admin/panel');
    }
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
});

// Redirect if admin is logged in
router.get('/', redirectIfAdminLoggedIn, (req, res) => {
  res.redirect('/admin/login');
});


router.get('/admin', redirectIfAdminLoggedIn, (req, res) => {
  res.redirect('/admin/login');
});




module.exports = router;
