const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');

// Dashboard page
router.get('/dashboard', isLoggedIn, (req, res) => {
  res.render('dashboard', {
    user: req.session.user
  });
});

module.exports = router;