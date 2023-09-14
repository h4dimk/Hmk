const expres = require("express");
const router = expres.Router();
const userController = require("../Controllers/userController");

router.get("/", userController.homeGet);

router
  .get("/Login", userController.userLoginPageGet)
  .post("/Login", userController.userLoginPagePost);

router
  .get("/Signup", userController.userSignUpGet)
  .post("/signup", userController.userSignUpPost);

router
  .get("/verify", userController.otpEntryGet)
  .post("/verify", userController.otpEntryPost);

router.get("/shop",userController.UserShopGet)

module.exports = router;
