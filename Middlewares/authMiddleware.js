const userModel = require("../Models/user");
const checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.session.login;

    if (!userId) {
      return next();
    }

    const user = await userModel.findOne({ email: userId });

    if (!user || !user.isActive) {
      delete req.session.login;
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = checkUserStatus;
