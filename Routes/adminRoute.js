const expres = require("express");
const router = expres.Router();
const multer = require("multer");
const path = require("path");
const adminController = require("../Controllers/adminController");

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Set the destination folder where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Create an instance of the multer middleware
const upload = multer({ storage });

router.get("/", adminController.adminHomeGet);

router.get("/dashboard", adminController.adminDashboardGet);

router
  .get("/usermanagement", adminController.adminUsermanagementGet)
  .patch("/usermanagement/block-unblock/:id", adminController.toggleUserStatus)
  .post("/usermanagement/search", adminController.UserSearch);

router
  .get("/products", adminController.adminProductsGet)
  .get("/products/add", adminController.addProductGet)
  .post("/products/add", upload.array("images"), adminController.addProductPost)
  .post("/product/search", adminController.ProductSearch)
  .get("/products/edit/:id", adminController.editProductGet)
  .post("/products/edit/:id",upload.array("images"),adminController.editProductPost)
  .delete("/products/delete/:id", adminController.deleteProduct)
  .patch("/products/list-unlist/:id", adminController.ListUnlistProduct);

router
  .get("/categories", adminController.adminCategoryGet)
  .post("/categories/add", adminController.addCategoryPost)
  .patch("/categories/edit/:id", adminController.editCategory)
  .patch("/categories/list-unlist/:id", adminController.ListUnlistCategory)
  .delete("/categories/delete/:id", adminController.deleteCategory)
  .post("/categories/search", adminController.CategorySearch);

router.get("/logout", adminController.adminlogout);

router
  .get("/login", adminController.adminLoginGet)
  .post("/login", adminController.adminLoginPost);

router
  .get("/banners", adminController.adminBannersGet)
  .post("/banners",upload.single("bannerImage"),adminController.adminBannersPost)
  .delete("/banners/delete/:id", adminController.deleteBanner);

module.exports = router;
