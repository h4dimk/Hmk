const expres = require("express");
const router = expres.Router();
const multer =require("multer");
const path = require('path');
const adminController = require("../Controllers/adminController");

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Set the destination folder where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Create an instance of the multer middleware
const upload = multer({ storage });

router.get("/", adminController.adminHomeGet);

router.get("/dashboard", adminController.adminDashboardGet);

router.get("/usermanagement", adminController.adminUsermanagementGet)
.patch("/usermanagement/block-unblock/:id", adminController.toggleUserStatus)
.post('/usermanagement/search',adminController.UserSearch)
  

 
router.get("/products", adminController.adminProductsGet)
  .get("/products/add", adminController.addProductGet)
  .post("/products/add",upload.single('image'),adminController.addProductPost)
  .post("/product/search",adminController.ProductSearch)
  .get("/products/edit/:id", adminController.editProductGet)
  .post("/products/edit/:id",upload.single('image'),adminController.editProductPost);

router.get("/categories", adminController.adminCategoryGet)
.post('/categories/add', adminController.addCategoryPost)
.patch('/categories/edit/:id', adminController.editCategory)
.patch('/categories/toggle/:id', adminController.toggleCategory)
.delete('/categories/delete/:id',adminController.deleteCategory)
.post('/categories/search',adminController.CategorySearch)


router.get("/logout", adminController.adminlogout);


router
  .get("/login", adminController.adminLoginGet)
  .post("/login", adminController.adminLoginPost);

module.exports = router;
