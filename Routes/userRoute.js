const expres = require("express");
const router = expres.Router();
const userController = require("../Controllers/userController");
const checkUserStatus = require("../Middlewares/userAuth");

router.get("/", checkUserStatus, userController.homeGet);

router
  .get("/login", userController.userLoginPageGet)
  .post("/login", userController.userLoginPagePost)
  .post("/logout", userController.userLogout);

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
  .get("/shop", userController.UserShopGet)
  .post("/shop/search", userController.ShopSearch)
  .get("/shop/product/:id", userController.ProductDetailsGet);

router
  .get("/cart", checkUserStatus, userController.userCartGet)
  .post("/cart/:id", userController.userCartPost)
  .put("/cart/decrease/:id", userController.CartProductdc)
  .put("/cart/increase/:id", userController.CartProductin)
  .delete("/cart/delete/:id", userController.DeleteCart)
  .get("/cart/checkout", checkUserStatus, userController.CheckoutGet);

router
  .get("/orders", checkUserStatus, userController.userOrdersGet)
  .post("/orders", userController.userOrdersPost)
  .post("/orders/cancel-order/:orderId", userController.CancelOrder)
  .post("/confirmOrder", userController.ConfirmOrder);

router
  .get("/profile", checkUserStatus, userController.UserProfileGet)
  .put("/profile/edit-profile", userController.editUserProfile);

module.exports = router;
