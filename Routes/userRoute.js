const expres = require("express");
const router = expres.Router();
const userController = require("../Controllers/userController");

router.get("/", userController.homeGet);

router
  .get("/login", userController.userLoginPageGet)
  .post("/login", userController.userLoginPagePost)
  .post("/logout",userController.userLogout)

router
  .get("/signup", userController.userSignUpGet)
  .post("/signup", userController.userSignUpPost);

router
  .get("/verify", userController.otpEntryGet)
  .post("/verify", userController.otpEntryPost);

router
.get("/forgot-password", userController.forgotPasswordGet)
.post("/forgot-password", userController.forgotPasswordPost)
.get("/forgot-password/verify", userController.verifyOtpGet)
.post("/forgot-password/verify", userController.verifyOtpPost)
.get("/forgot-password/reset-password", userController.resetPasswordGet)
.post("/forgot-password/reset-password", userController.resetPasswordPost);

router
.get("/shop",userController.UserShopGet)
.post("/shop/search",userController.ShopSearch)
.get("/shop/product",userController.ProductDetailsGet)

router
.get("/cart",userController.userCartGet)
.get("/cart/checkout",userController.CheckoutGet)




module.exports = router;
