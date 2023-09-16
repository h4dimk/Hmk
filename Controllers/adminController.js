const userModel = require("../Models/user");
const Product = require("../Models/products");
const Category = require("../Models/category");
const Admin = require("../Models/admin");

const adminLoginGet = (req, res) => {
  res.render("adminLogin");
};

const adminHomeGet = (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    res.redirect("/admin/login");
  }
};

const adminLoginPost = async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password){
    return res.render("adminLogin", { error: "Please enter username and password" })
  }

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.render("adminLogin", { error: "Admin not found" });
    }

    if (password === admin.password) {
      req.session.admin = username;
      return res.redirect("/admin");
    } else {
      return res.render("adminLogin", { error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).render("error", {
      message: "Internal server error. Please try again later.",
    });
  }
};

const adminDashboardGet = async (req, res) => {
  try {
    if (req.session.admin) {
      res.render("adminDashboard");
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const adminUsermanagementGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const users = await userModel.find();
      res.render("adminUsermanagement", { users: users });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const UserSearch = async (req, res) => {
  const searchText = req.body.search;

  try {
    const users = await userModel.find({
      $or: [
        { username: { $regex: searchText, $options: "i" } },
        { email: { $regex: searchText, $options: "i" } },
      ],
    });
    res.render("adminUsermanagement", { users });
  } catch (error) {
    console.log(error);
  }
};

const adminCategoryGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const categories = await Category.find();
      res.render("adminCategory", { categories });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const addCategoryPost = async (req, res) => {
  const { categoryName } = req.body;

  try {
    // Create a new category
    const category = new Category({ name: categoryName });

    // Save the category to the database
    await category.save();

    // Redirect to the category management page or show a success message
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error);
    // Handle errors here
    res.status(500).json({ error: "Internal server error" });
  }
};

const editCategory = async (req, res) => {
  const categoryId = req.params.id;
  const newCategoryName = req.body.categoryName;

  try {
    // Update the category name in the database (replace with your database logic)
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, {
      name: newCategoryName,
    });

    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Send a success response
    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const ListUnlistCategory = async (req, res) => {
  const categoryId = req.params.id;
  const isListed = req.body.isListed;

  try {
    // Find and update the category listing status in the database
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, {
      islisted: isListed,
    });
    console.log("Button clicked. Category ID:", categoryId);
    console.log("Is listed:", isListed);

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Send a success response
    res.status(200).json({
      success: true,
      message: `Category ${isListed ? "listed" : "unlisted"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const deleteCategory = (req, res) => {
  if (req.session.admin) {
    Category.findByIdAndDelete(req.params.id).then((res) => {
      console.log(res);
    });
  } else {
    res.redirect("/admin/login");
  }
};

const CategorySearch = async (req, res) => {
  const searchText = req.body.search;
  try {
    const categories = await Category.find({
      name: { $regex: searchText, $options: "i" },
    });

    res.render("adminCategory", { categories });
  } catch (error) {
    console.log(error);
  }
};

const adminlogout = (req, res) => {
  if (req.session.admin) {
    req.session.destroy();
    res.redirect("/admin/login");
  } else {
    res.redirect("/admin/login");
  }
};

const toggleUserStatus = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by userId
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Toggle the user's isActive status
    user.isActive = !user.isActive;

    // Save the updated user document
    await user.save();

    return res.status(200).json({
      message: `User status updated to ${
        user.isActive ? "active" : "inactive"
      }`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const adminProductsGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const products = await Product.find();
      res.render("adminProducts", { products });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const addProductGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const products = await Product.find();
      const categories = await Category.find();
      res.render("addProduct", { products, categories });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const addProductPost = async (req, res) => {
  const { name, description, price, category } = req.body;
  const filename = req.file.filename;
  console.log(filename);

  try {
    const product = new Product({
      name: name,
      description: description,
      price: price,
      category: category,
      imagePath: filename, // Save the filename in the "image" field of the product
    });
    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const editProductGet = async (req, res) => {
  const productId = req.params.id;
  console.log(productId);

  try {
    if (req.session.admin) {
      const product = await Product.findById(productId);
      const categories = await Category.find();
      res.render("editProduct", { product, categories });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
    // Handle errors here
  }
};

const editProductPost = async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, category } = req.body;
  const filename = req.file.filename;
  console.log(req.file);

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Update the product fields
    product.name = name;
    product.description = description;
    product.price = price;
    product.category = category;
    product.imagePath = filename;

    await product.save();

    // Redirect to the product list or show a success message
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    // Handle errors here
    res.status(500).json({ error: "Internal server error" });
  }
};

const ProductSearch = async (req, res) => {
  const searchText = req.body.search;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ],
    });

    res.render("adminProducts", { products });
  } catch (error) {
    console.log(error);
  }
};

const deleteProduct = (req, res) => {
  if (req.session.admin) {
    Product.findByIdAndDelete(req.params.id).then((resp) => {
      console.log(resp);
      res.send(200);
    });
  } else {
    res.redirect("/admin/login");
  }
};

const ListUnlistProduct = async (req, res) => {
  const productId = req.params.id;
  const isListed = req.body.isListed;

  try {
    // Find and update the category listing status in the database
    const updatedCategory = await Product.findByIdAndUpdate(productId, {
      islisted: isListed,
    });
    console.log("Button clicked. Produst ID:", productId);
    console.log("Is listed:", isListed);

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Send a success response
    res.status(200).json({
      success: true,
      message: `Product ${isListed ? "listed" : "unlisted"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling category:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  adminHomeGet,
  adminLoginGet,
  adminLoginPost,
  adminDashboardGet,
  adminUsermanagementGet,
  adminProductsGet,
  adminCategoryGet,
  adminlogout,
  toggleUserStatus,
  addProductPost,
  addProductGet,
  editProductGet,
  editProductPost,
  addCategoryPost,
  editCategory,
  ListUnlistCategory,
  deleteCategory,
  CategorySearch,
  UserSearch,
  ProductSearch,
  deleteProduct,
  ListUnlistProduct,
};
