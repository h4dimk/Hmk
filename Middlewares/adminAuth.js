const checkAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    let error = req.session.error;
    res.render("adminLogin", { error });
  }
};

module.exports = checkAdminLogin;
