// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.session.user) {
    // If the user is logged in, prevent access to the index page
    if (req.originalUrl === '/') {
      return res.redirect('/home'); // Redirect to the home page if trying to access the index
    }
    return next(); // User is authenticated, proceed to the next middleware or route handler
  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

// Middleware to redirect users to home if they are already logged in
function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect('/home'); // Redirect logged-in users to the home page
  }
  next(); // Proceed if no user is logged in
}

// Middleware to ensure the admin is authenticated
function ensureAdminAuthenticated(req, res, next) {
  if (req.session.admin) {
    // If the admin is logged in, prevent access to the index page
    if (req.originalUrl === '/') {
      return res.redirect('/admin/panel'); // Redirect to the admin panel if trying to access the index
    }
    return next(); // Admin is authenticated, proceed to the next middleware or route handler
  }
  res.redirect('/admin/login'); // Redirect to admin login if not authenticated
}

// Middleware to redirect admins to the admin panel if they are already logged in
function redirectIfAdminLoggedIn(req, res, next) {
  if (req.session.admin) {
    return res.redirect('/admin/panel'); // Redirect logged-in admins to the admin panel
  }
  next(); // Proceed if no admin is logged in
}

module.exports = {
  ensureAuthenticated,
  redirectIfLoggedIn,
  ensureAdminAuthenticated,
  redirectIfAdminLoggedIn,
};
