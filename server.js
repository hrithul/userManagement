const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nocache = require('nocache');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const flash = require('connect-flash')

dotenv.config();
const app = express();

mongoose.connect('mongodb://localhost:27017/webapp')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Middleware to handle form data
app.use(express.urlencoded({ extended: true }));

// Middleware to prevent caching
app.use(nocache());

// Session setup with MongoDB store for session persistence
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/webapp',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true, // Mitigates XSS attacks
  }
}));

app.use(flash());

app.use((req, res, next)=>{
  res.locals.flash=req.flash()
  next()
})

// Set view engine
app.set('view engine', 'hbs');
app.use('/public', express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});