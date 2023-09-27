const userModel = require("../Models/user");
const Product = require("../Models/products");
const Category = require("../Models/category");
const Admin = require("../Models/admin");
const Banner = require("../Models/banner");
const Order = require("../Models/order");

const adminHomeGet = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const adminLoginGet = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/dashboard");
    } else {
      let error = req.session.error;
      res.render("adminLogin", { error });
    }
  } catch (error) {
    console.error(error);
  }
};

const adminLoginPost = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.session.error = "Please enter username and password";
      return res.redirect("/admin/login");
    }
    const admin = await Admin.findOne({ username });

    if (!admin) {
      req.session.error = "Admin not found";
      return res.redirect("/admin/login");
    }

    if (password === admin.password) {
      delete req.session.error;
      req.session.admin = username;
      return res.redirect("/admin");
    } else {
      req.session.error = "Invalid password";
      return res.redirect("/admin/login");
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
  try {
    const searchText = req.body.search;
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
      let error = req.session.error;
      const categories = await Category.find();
      res.render("adminCategory", { categories, error });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const addCategoryPost = async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) {
      req.session.error = "Enter Category Name";
      return res.redirect("/admin/categories");
    }

    if (!categoryName.trim()) {
      req.session.error = "Category cannot be empty";
      return res.redirect("/admin/categories");
    }

    const existingCategory = await Category.findOne({ name: categoryName });
    if (existingCategory) {
      req.session.error = "Category already exist";
      return res.redirect("/admin/categories");
    }

    // Create a new category
    const category = new Category({ name: categoryName });

    delete req.session.error;

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
  try {
    const categoryId = req.params.id;
    const newCategoryName = req.body.categoryName;
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
  try {
    const categoryId = req.params.id;
    const isListed = req.body.isListed;
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
  try {
    if (req.session.admin) {
      Category.findByIdAndDelete(req.params.id).then((res) => {
        console.log(res + " deleted");
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const CategorySearch = async (req, res) => {
  try {
    const searchText = req.body.search;
    const categories = await Category.find({
      name: { $regex: searchText, $options: "i" },
    });

    res.render("adminCategory", { categories });
  } catch (error) {
    console.log(error);
  }
};

const adminlogout = (req, res) => {
  try {
    if (req.session.admin) {
      req.session.destroy();
      res.redirect("/admin/login");
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
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
      const error = req.session.error;
      res.render("addProduct", { products, categories, error });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const addProductPost = async (req, res) => {
  try {
    const { name, description, price, category, stockQuantity } = req.body;
    const filenames = req.files.map((file) => file.filename);
    if (price < 0) {
      // Check if the price is less than zero
      req.session.error = "Price cannot be negative value";
      return res.redirect("/admin/products/add");
    }
    if (stockQuantity < 0) {
      // Check if the price is less than zero
      req.session.error = "Stock Quantity cannot be negative value";
      return res.redirect("/admin/products/add");
    }

    const product = new Product({
      name: name,
      description: description,
      price: price,
      category: category,
      imagePath: filenames,
      stockQuantity: stockQuantity,
    });
    await product.save();
    delete req.session.error;
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const editProductGet = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(productId);
    if (req.session.admin) {
      const product = await Product.findById(productId);
      const categories = await Category.find();
      const error = req.session.error;
      res.render("editProduct", { product, categories, error });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
    // Handle errors here
  }
};

const editProductPost = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, category, stockQuantity } = req.body;
    const filenames = req.files ? req.files.map((file) => file.filename) : null;
    console.log(req.file);
    if (price < 0) {
      req.session.error = "Price cannot be negative value";
      return res.redirect(`/admin/products/edit/${productId}`);
    }
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Update the product fields
    product.name = name;
    product.description = description;
    product.price = price;
    product.category = category;
    product.stockQuantity = stockQuantity;

    // Update image paths only if new images are uploaded
    if (filenames && filenames.length > 0) {
      product.imagePath = filenames;
    }

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
  try {
    const searchText = req.body.search;
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
  try {
    if (req.session.admin) {
      Product.findByIdAndDelete(req.params.id).then((resp) => {
        console.log(resp + "deleted");
        res.send(200);
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
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

const adminBannersGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const banners = await Banner.find();
      res.render("adminBannerMng", { banners: banners });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const adminBannersPost = async (req, res) => {
  try {
    // Retrieve data from the form
    const { mainTitle, subtitle } = req.body;
    const bannerImage = req.file.filename;
    console.log(req.file);

    // Create a new banner instance
    const newBanner = new Banner({
      bannerImage: bannerImage,
      mainTitle: mainTitle,
      subtitle: subtitle,
    });

    // Save the banner to the database
    await newBanner.save();

    // Redirect to the banner list page or perform any other desired action
    res.redirect("/admin/banners"); // Redirect to the banner list page
  } catch (error) {
    console.error("Error adding banner:", error);
    // Handle the error and render an error page or display an error message
    res.status(500).render("error", {
      message: "Internal server error. Please try again later.",
    });
  }
};

const deleteBanner = (req, res) => {
  try {
    if (req.session.admin) {
      Banner.findByIdAndDelete(req.params.id).then((resp) => {
        console.log(resp + " deleted");
        res.send(200);
      });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const adminOrdersGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const orders = await Order.find();

      res.render("adminOrders", { orders });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const adminOrdersDetailsGet = async (req, res) => {
  try {
    if (req.session.admin) {
      const orderId = req.params.id;
      const orders = await Order.find({ _id: orderId });

      res.render("adminOrderDetails", { orders });
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const adminOrdersDetailsPost = async (req, res) => {
  try {
    const orderId = req.params.id.trim();
    const { orderStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Update the order's status
    order.status = orderStatus;
    await order.save();

    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
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
  adminBannersGet,
  adminBannersPost,
  deleteBanner,
  adminOrdersGet,
  adminOrdersDetailsGet,
  adminOrdersDetailsPost,
};
