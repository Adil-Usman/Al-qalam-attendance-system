function isLoggedIn(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
}

function checkRole(roles) {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      return next();
    }
    res.send('Access Denied. You do not have permission.');
  };
}

module.exports = { isLoggedIn, checkRole };