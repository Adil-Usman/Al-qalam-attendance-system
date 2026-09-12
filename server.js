const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');`
`

dotenv.config();

const app = express();

// ========== 1. BASIC MIDDLEWARE ==========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ========== 2. SESSION (MUST BE BEFORE ROUTES) ==========
app.use(session({
  secret: process.env.SESSION_SECRET || 'attendance-secret-key',
  resave: false,
  saveUninitialized: false
}));

// ========== 3. VIEW ENGINE ==========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========== 4. ROUTES ==========
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const parentsRoutes = require('./routes/parents');

app.use('/auth', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', studentRoutes);
app.use('/', attendanceRoutes);
app.use('/', parentsRoutes);

// Home redirect
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// ========== 5. DATABASE ==========
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance-system')
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});