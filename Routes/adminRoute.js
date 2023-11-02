const expres = require("express");
const router = expres.Router();
const multer = require("multer");
const path = require("path");
const adminController = require("../Controllers/adminController");
const checkAdminLogin = require("../Middlewares/adminAuth");

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Create an instance of the multer middleware
const upload = multer({ storage });

router.get("/", checkAdminLogin, adminController.adminHomeGet);

router.get("/dashboard", checkAdminLogin, adminController.adminDashboardGet);

router
  .get("/salesreport", checkAdminLogin, adminController.adminSalesReport)
  .get("/salesreport/download", adminController.downloadSalesReport);

router
  .get(
    "/usermanagement",
    checkAdminLogin,
    adminController.adminUsermanagementGet
  )
  .patch("/usermanagement/block-unblock/:id", adminController.toggleUserStatus)
  .post("/usermanagement/search", adminController.UserSearch);

router
  .get("/products", checkAdminLogin, adminController.adminProductsGet)
  .get("/products/add", checkAdminLogin, adminController.addProductGet)
  .post("/products/add", upload.array("images"), adminController.addProductPost)
  .post("/product/search", adminController.ProductSearch)
  .get("/products/edit/:id", checkAdminLogin, adminController.editProductGet)
  .post(
    "/products/edit/:id",
    upload.array("images"),
    adminController.editProductPost
  )
  .delete("/products/delete/:id", adminController.deleteProduct)
  .patch("/products/list-unlist/:id", adminController.ListUnlistProduct);

router
  .get("/categories", checkAdminLogin, adminController.adminCategoryGet)
  .post("/categories/add", adminController.addCategoryPost)
  .patch("/categories/edit/:id", adminController.editCategory)
  .patch("/categories/list-unlist/:id", adminController.ListUnlistCategory)
  .delete("/categories/delete/:id", adminController.deleteCategory)
  .post("/categories/search", adminController.CategorySearch);

router.get("/logout", checkAdminLogin, adminController.adminlogout);

router
  .get("/login", adminController.adminLoginGet)
  .post("/login", adminController.adminLoginPost);

router
  .get("/banners", checkAdminLogin, adminController.adminBannersGet)
  .post(
    "/banners",
    upload.single("bannerImage"),
    adminController.adminBannersPost
  )
  .delete("/banners/delete/:id", adminController.deleteBanner);

router
  .get("/orders", checkAdminLogin, adminController.adminOrdersGet)
  .get("/orders/details/:id", adminController.adminOrdersDetailsGet)
  .post("/orders/details/:id", adminController.adminOrdersDetailsPost);

router
  .get("/coupon", checkAdminLogin, adminController.adminCouponGet)
  .post("/coupon/add", adminController.addCoupon)
  .patch("/coupon/list/:id", adminController.couponList)
  .delete("/coupon/delete/:id", adminController.deleteCoupon);

module.exports = router;
