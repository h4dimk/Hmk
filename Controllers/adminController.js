const userModel = require("../Models/user");
const Product = require("../Models/products");
const Category = require("../Models/category");
const Admin = require("../Models/admin");
const Banner = require("../Models/banner");
const Order = require("../Models/order");
const Coupon = require("../Models/coupon");
const json2csv = require("json2csv").Parser;

const adminHomeGet = (req, res) => {
  try {
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
  }
};

const adminLoginGet = (req, res) => {
  try {
    res.redirect("/admin/dashboard");
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
    // Order Per Month
    const currentYear = new Date().getFullYear();

    const matchStage = {
      $match: {
        status: {
          $nin: ["Cancelled"],
        },
        orderDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    };

    const pipeline1 = [
      matchStage,
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$orderDate",
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ];

    const monthlyOrderData = await Order.aggregate(pipeline1);

    function fillMissingMonthsOrder(monthlyOrderData) {
      const resultArray = [];
      const monthsMap = new Map();

      for (const monthData of monthlyOrderData) {
        monthsMap.set(monthData._id, monthData.totalOrders);
      }

      for (let month = 1; month <= 12; month++) {
        const monthKey = `2023-${month.toString().padStart(2, "0")}`;
        const orders = monthsMap.get(monthKey) || 0;
        resultArray.push(orders);
      }

      return resultArray;
    }
    const monthlyOrdersArray = fillMissingMonthsOrder(monthlyOrderData);

    // Monthly Total Revenue
    const pipeline2 = [
      matchStage,
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$orderDate",
            },
          },
          totalRevenue: { $sum: "$totalAmount" }, // Calculate total revenue for each month
        },
      },
      {
        $sort: {
          _id: 1, // Sort by month in ascending order
        },
      },
    ];

    const revenuePerMonth = await Order.aggregate(pipeline2);

    function fillMissingMonthsRevenue(monthlyRevenueData) {
      const resultArray = [];
      const monthsMap = new Map();

      for (const monthData of monthlyRevenueData) {
        monthsMap.set(monthData._id, monthData.totalRevenue);
      }

      for (let month = 1; month <= 12; month++) {
        const monthKey = `2023-${month.toString().padStart(2, "0")}`;
        const revenue = monthsMap.get(monthKey) || 0;
        resultArray.push(revenue);
      }

      return resultArray;
    }

    const monthlyRevenueArray = fillMissingMonthsRevenue(revenuePerMonth);

    const data = {
      monthlyOrdersArray,
      monthlyRevenueArray,
    };
    res.render("adminDashboard", { data });
  } catch (error) {
    console.log(error);
  }
};

const adminSalesReport = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $ne: "Cancelled" } });
    res.render("adminSalesReport", { orders });
  } catch (error) {
    console.error(error);
  }
};

const downloadSalesReport = async (req, res) => {
  const { fromDate, toDate } = req.query;

  try {
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ error: "Invalid date range provided" });
    }

    const salesData = await Order.find({
      status: { $ne: "Cancelled" },
      orderDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    });

    if (salesData.length === 0) {
      return res
        .status(404)
        .json({ error: "No sales data found for the selected date range" });
    }

    // Flatten the products array and include product-related details in the CSV
    const flattenedSalesData = salesData.map((order) => {
      return order.products.map((product) => ({
        orderDate: order.orderDate,
        productName: product.name,
        quantity: product.quantity,
        amount: product.total,
      }));
    });

    // Merge the arrays into a single flat array
    const flatSalesData = [].concat(...flattenedSalesData);

    const fields = ["orderDate", "productName", "quantity", "amount"];
    const opts = { fields, header: true, includeEmptyRows: true };
    const json2csvParser = new json2csv(opts);
    const csv = json2csvParser.parse(flatSalesData);

    res.setHeader("Content-Type", "text/csv");
    res.attachment("sales_report.csv");
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const adminUsermanagementGet = async (req, res) => {
  try {
    const users = await userModel.find();
    res.render("adminUsermanagement", { users: users });
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
    let error = req.session.error;
    const categories = await Category.find();
    res.render("adminCategory", { categories, error });
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
    Category.findByIdAndDelete(req.params.id).then((res) => {
      console.log(res + " deleted");
    });
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
    req.session.destroy();
    res.redirect("/admin/login");
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
    const products = await Product.find();
    res.render("adminProducts", { products });
  } catch (error) {
    console.log(error);
  }
};

const addProductGet = async (req, res) => {
  try {
    const products = await Product.find();
    const categories = await Category.find();
    const error = req.session.error;
    res.render("addProduct", { products, categories, error });
  } catch (error) {
    console.log(error);
  }
};

const addProductPost = async (req, res) => {
  try {
    const { name, description, price, discount, category, stockQuantity } =
      req.body;
    const filenames = req.files.map((file) => file.filename);
    if (price < 0) {
      // Check if the price is less than zero
      req.session.error = "Price cannot be negative value";
      return res.redirect("/admin/products/add");
    }
    if (stockQuantity < 0) {
      // Check if the Stock is less than zero
      req.session.error = "Stock Quantity cannot be negative value";
      return res.redirect("/admin/products/add");
    }
    const sellingPrice = Math.round(price - price * (discount / 100));
    const product = new Product({
      name: name,
      description: description.trim(),
      price: price,
      discount: discount,
      sellingPrice: sellingPrice,
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
  }
};

const editProductPost = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, discount, category, stockQuantity } =
      req.body;
    const filenames = req.files ? req.files.map((file) => file.filename) : null;
    console.log(req.file);
    if (price < 0) {
      // Check if the Price is less than zero
      req.session.error = "Price cannot be negative value";
      return res.redirect(`/admin/products/edit/${productId}`);
    }
    if (stockQuantity < 0) {
      // Check if the Stock is less than zero
      req.session.error = "Stock Quantity cannot be negative value";
      return res.redirect("/admin/products/add");
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const sellingPrice = Math.round(price - price * (discount / 100));

    // Update the product fields
    product.name = name;
    product.description = description.trim();
    product.price = price;
    product.discount = discount;
    product.sellingPrice = sellingPrice;
    product.category = category;
    product.stockQuantity = stockQuantity;

    // Update image paths only if new images are uploaded
    if (filenames && filenames.length > 0) {
      product.imagePath = filenames;
    }

    await product.save();

    // Redirect to the product list
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
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
    Product.findByIdAndDelete(req.params.id).then((resp) => {
      console.log(resp + "deleted");
      res.send(200);
    });
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
    const banners = await Banner.find();
    res.render("adminBannerMng", { banners: banners });
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

    res.redirect("/admin/banners"); // Redirect to the banner list page
  } catch (error) {
    console.error("Error adding banner:", error);
    res.status(500).render("error", {
      message: "Internal server error. Please try again later.",
    });
  }
};

const deleteBanner = (req, res) => {
  try {
    Banner.findByIdAndDelete(req.params.id).then((resp) => {
      console.log(resp + " deleted");
      res.send(200);
    });
  } catch (error) {
    console.error(error);
  }
};

const adminOrdersGet = async (req, res) => {
  try {
    const orders = await Order.find();

    res.render("adminOrders", { orders });
  } catch (error) {
    console.error(error);
  }
};

const adminOrdersDetailsGet = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orders = await Order.find({ _id: orderId });

    res.render("adminOrderDetails", { orders });
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

    // Check if the order has an online payment
    if (
      orderStatus === "Cancelled" &&
      (order.paymentMethod === "Online Payment" ||
        order.paymentMethod === "Wallet Payment")
    ) {
      // Refund the amount to the user's wallet
      const userId = order.userId;
      const refundAmount = order.totalAmount;
      const user = await userModel.findOne({ email: userId });

      if (user) {
        user.wallet += refundAmount;

        // Create a wallet transaction record
        const walletTransaction = {
          date: new Date(),
          amount: refundAmount,
          type: "Credited",
        };

        user.walletTransaction.push(walletTransaction);

        await user.save();
      }
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

const adminCouponGet = async (req, res) => {
  try {
    const error = req.session.error;
    const coupons = await Coupon.find();
    res.render("adminCoupon", { coupons, error });
  } catch (error) {
    console.error(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      code,
      discountPercentage,
      minPurchaseAmount,
      expiresAt,
      maxRedimableAmount,
    } = req.body;

    const trimmedCode = code.trim();

    // Check if any of the required fields are empty or only spaces
    if (
      !trimmedCode ||
      !discountPercentage ||
      !minPurchaseAmount ||
      !expiresAt
    ) {
      req.session.error = "All fields are required";
      return res.redirect("/admin/coupon");
    }

    if (
      discountPercentage < 0 ||
      minPurchaseAmount < 0 ||
      maxRedimableAmount < 0
    ) {
      req.session.error =
        "Discount, purchase amount, and redemable amount cannot be negative";
      return res.redirect("/admin/coupon");
    }

    // Check if the coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: trimmedCode });

    if (existingCoupon) {
      req.session.error = "Coupon code already exists";
      return res.redirect("/admin/coupon");
    }
    const newCoupon = new Coupon({
      code,
      discountPercentage,
      minPurchaseAmount,
      createdAt: new Date(),
      expiresAt,
      active: true,
      maxRedimableAmount,
    });
    delete req.session.error;
    await newCoupon.save();
    return res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};

const couponList = async (req, res) => {
  try {
    const couponId = req.params.id;
    const active = req.body.active;

    // Find and update the coupon's active status in the database
    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { active });

    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    // Send a success response
    res.status(200).json({
      success: true,
      message: `Coupon ${active ? "listed" : "unlisted"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling coupon:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const deleteCoupon = (req, res) => {
  try {
    Coupon.findByIdAndDelete(req.params.id).then((res) => {
      console.log(res + " deleted");
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  adminHomeGet,
  adminLoginGet,
  adminLoginPost,
  adminDashboardGet,
  adminSalesReport,
  downloadSalesReport,
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
  adminCouponGet,
  addCoupon,
  couponList,
  deleteCoupon,
};
