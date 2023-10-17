const bcrypt = require("bcrypt");
require("dotenv").config();
const userModel = require("../Models/user");
const Product = require("../Models/products");
const nodemailer = require("nodemailer");
const Banner = require("../Models/banner");
const Cart = require("../Models/cart");
const Order = require("../Models/order");
const Category = require("../Models/category");
const RazorPay = require("razorpay");
const Admin = require("../Models/admin");

// Create a transporter object using your email service provider's SMTP settings
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use your email service provider
  auth: {
    user: "hmk2xx4@gmail.com", // Your email address
    pass: "hwbtiohhgwghoekv", // Your email password or app password
  },
});

// Function to send OTP to the user's email
const sendOTPToUser = (email, otp) => {
  // Define email content
  const mailOptions = {
    from: "hmk2xx4@gmail.com", // Sender's email address
    to: email, // Recipient's email address
    subject: "OTP Verification", // Email subject
    text: `Your OTP is: ${otp}`, // Email body
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

const instance = new RazorPay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function generateRandomOtp() {
  // Generate a random number
  const min = 100000;
  const max = 999999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString();
}

function generateRandomOrderId() {
  // Get the current timestamp in milliseconds
  const timestamp = new Date().getTime();
  let modifiedTimestamp = timestamp.toString().slice(0, 5);

  const randomPart = Math.floor(100 + Math.random() * 900);

  const orderId = `${modifiedTimestamp}${randomPart}`;

  return orderId.toString();
}

const homeGet = async (req, res) => {
  try {
    const banners = await Banner.find();
    const products = await Product.find().limit(8);
    const login = req.session.login;

    console.log("Now the user is " + login);

    res.render("LandingPage", { login, banners, products });
  } catch (error) {
    console.error(error);
  }
};

const userSignUpGet = (req, res) => {
  try {
    const error = req.session.error;
    res.render("UserSignUp", { error });
  } catch (error) {
    console.error(error);
  }
};

const userSignUpPost = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, phonenumber } =
      req.body;
    const saltRounds = 10;

    if (!username || !email || !password || !confirmPassword || !phonenumber) {
      req.session.error = "Please fill out all fields";
      return res.redirect("/user/signup");
    }

    if (password.length < 6) {
      req.session.error = "Password should contain Minimum 6 characters";
      return res.redirect("/user/signup");
    }

    if (password.includes(" ")) {
      req.session.error = "Password should not contain spaces";
      return res.redirect("/user/signup");
    }

    if (!/[A-Z]/.test(password)) {
      req.session.error =
        "Password should contain at least one uppercase letter";
      return res.redirect("/user/signup");
    }

    if (!/[a-z]/.test(password)) {
      req.session.error =
        "Password should contain at least one lowercase letter";
      return res.redirect("/user/signup");
    }

    if (!/\d/.test(password)) {
      req.session.error = "Password should contain at least one digit";
      return res.redirect("/user/signup");
    }

    if (!/[!@#$%^&*()_+[\]{};':"\\|,.<>?/~`]/.test(password)) {
      req.session.error =
        "Password should contain at least one special character";
      return res.redirect("/user/signup");
    }

    if (!username.trim()) {
      req.session.error = "Username cannot be empty";
      return res.redirect("/user/signup");
    }

    if (password !== confirmPassword) {
      req.session.error = "Passwords do not match";
      return res.redirect("/user/signup");
    }

    const otp = generateRandomOtp();

    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      req.session.error = "Email already in use";
      return res.redirect("/user/signup");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    delete req.session.error;
    req.session.email = email;

    // Create a new user document with OTP
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      phonenumber,
      isActive: false, // Set the user as inactive until OTP verification
      otp: otp, // Store OTP in the user document
    });

    // Send OTP to the user's email
    sendOTPToUser(newUser.email, otp);

    console.log("OTP for " + newUser.email + " is " + otp);

    req.session.otptoentr = true;

    res.redirect("/user/verify"); // Redirect to OTP verification page
  } catch (error) {
    console.error(error);
    res.render("UserSignUp", { error: "Internal server error" });
  }
};

const userLoginPageGet = async (req, res) => {
  try {
    const error = req.session.error;

    res.render("UserLogin", { error });
  } catch (error) {
    console.error(error);
  }
};

const userLogout = (req, res) => {
  try {
    if (req.session.login) {
      req.session.destroy();
      return res.redirect("/user/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const userLoginPagePost = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("username = " + email);
    console.log("passs = " + password);

    if (!email || !password) {
      req.session.error = "Please enter your username and password";
      return res.redirect("/user/login");
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      req.session.error = "Invalid email or password";
      return res.redirect("/user/login");
    }

    if (!user.isActive) {
      req.session.error = "You are Blocked";
      return res.redirect("/user/login");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      req.session.error = "Invalid email or password";
      return res.redirect("/user/login");
    }

    delete req.session.error;

    if (user) {
      req.session.login = user.email;
      res.redirect("/user");
    }
  } catch (error) {
    console.error(error);
  }
};

const otpEntryGet = (req, res) => {
  if (req.session.otptoentr) {
    res.render("verify-otp");
  } else {
    res.redirect("/user/signup");
  }
};

const otpEntryPost = async (req, res) => {
  const { otp } = req.body;

  // Retrieve the user by their email and check if the OTP matches
  const user = await userModel.findOne({ email: req.session.email });
  console.log(req.session.email);
  if (!user || user.otp != otp) {
    return res.render("verify-otp", { error: "Invalid OTP" });
  }

  // OTP is valid, mark the user as verified
  user.isActive = true;

  // Reset the user's OTP
  user.otp = null; // Set OTP to null or handle OTP expiration as needed

  await user.save();

  delete req.session.otptoentr;
  delete req.session.error;

  res.redirect("/user/login");
};

const UserShopGet = async (req, res) => {
  try {
    const categories = await Category.find({ islisted: true });

    const {
      products,
      currentPage,
      totalPages,
      selectedMinPrice,
      selectedMaxPrice,
    } = await getFilteredProducts(req.query);
    res.render("UserShop", {
      products,
      categories,
      currentPage,
      totalPages,
      selectedMinPrice,
      selectedMaxPrice,
    });
  } catch (error) {
    console.log(error);
  }
};

const getFilteredProducts = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  const minPrice = parseFloat(query.minPrice) || 0;
  const maxPrice = parseFloat(query.maxPrice) || Number.MAX_VALUE;

  // Fetch only categories marked as "listed"
  const categories = await Category.find({ islisted: true });

  const categoryFilter = query.category; // Get the category filter from the query parameters

  // Construct the search query
  const searchQuery = {
    sellingPrice: { $gte: minPrice, $lte: maxPrice },
  };

  if (categoryFilter && categoryFilter !== "All Categories") {
    // Apply the category filter if a specific category is selected
    searchQuery.category = categoryFilter;
  } else {
    // If "All Categories" is selected, filter by listed categories
    searchQuery.category = { $in: categories.map((category) => category.name) };
  }

  // Fetch products that meet the search criteria
  const filteredProducts = await Product.find(searchQuery).exec();

  const totalFilteredProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalFilteredProducts / limit);
  const products = filteredProducts.slice(skip, skip + limit);

  return {
    products,
    currentPage: page,
    totalPages,
    selectedMinPrice: minPrice,
    selectedMaxPrice: maxPrice,
  };
};

const ShopSearch = async (req, res) => {
  try {
    const categories = await Category.find({ islisted: true });

    const {
      products,
      currentPage,
      totalPages,
      selectedMinPrice,
      selectedMaxPrice,
    } = await searchProducts(req.body.search, req.query);

    res.render("UserShop", {
      products,
      categories,
      currentPage,
      totalPages,
      selectedMinPrice,
      selectedMaxPrice,
    });
  } catch (error) {
    console.log(error);
  }
};

const searchProducts = async (searchText, query) => {
  const page = parseInt(query.page) || 1;
  const selectedMinPrice = parseFloat(query.minPrice) || 0;
  const selectedMaxPrice = parseFloat(query.maxPrice) || Number.MAX_VALUE;

  const categories = await Category.find({ islisted: true });

  // Construct the search query using regular expressions
  const searchQuery = {
    category: { $in: categories.map((category) => category.name) },
    $or: [
      { name: { $regex: searchText, $options: "i" } },
      { category: { $regex: searchText, $options: "i" } },
    ],
    sellingPrice: { $gte: selectedMinPrice, $lte: selectedMaxPrice },
  };

  // Count the total number of matching products
  const totalProducts = await Product.countDocuments(searchQuery);

  const limit = 8;
  const skip = (page - 1) * limit;

  // Retrieve the products for the current page
  const products = await Product.find(searchQuery)
    .skip(skip)
    .limit(limit)
    .exec();

  const totalPages = Math.ceil(totalProducts / limit);

  return {
    products,
    currentPage: page,
    totalPages,
    selectedMinPrice,
    selectedMaxPrice,
  };
};

const ProductDetailsGet = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    res.render("ProductDetails", { product });
  } catch (error) {
    console.error(error);
  }
};

const forgotPasswordGet = (req, res) => {
  res.render("forgotpassword");
};

const forgotPasswordPost = async (req, res) => {
  const { email } = req.body;

  // Check if the email exists in your database
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      // Email not found in the database
      return res.render("forgotpassword", {
        error:
          "Email address not found. Please check your email and try again.",
      });
    }

    // Generate a random OTP
    const otp = generateRandomOtp();

    req.session.frgtpass = true;

    // Send the OTP to the user's email
    const mailOptions = {
      from: "hmk2xx4@gmail.com",
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP:", error);
        return res.redirect("/user/forgot-password");
      } else {
        console.log("OTP sent:", info.response);
        // Store the OTP and user email in a session
        user.otp = otp; // Store the OTP in the db
        user.save();
        req.session.resetEmail = email; // Store the user's email for reference
        res.redirect("/user/forgot-password/verify");
      }
    });
  } catch (error) {
    console.error("Error checking email in database:", error);
    return res.status(500).render("error", {
      message: "Internal server error. Please try again later.",
    });
  }
};

const verifyOtpGet = (req, res) => {
  if (req.session.frgtpass) {
    res.render("verify-otp-frgtpass");
  } else {
    res.redirect("/user/login");
  }
};

const verifyOtpPost = async (req, res) => {
  const { otp } = req.body;
  const userEmail = req.session.resetEmail;

  // Retrieve the user by their email and check if the OTP matches
  const user = await userModel.findOne({ email: userEmail });
  if (!user || user.otp !== otp) {
    // Invalid OTP or user not found
    return res.render("verify-otp-frgtpass", { error: "Invalid OTP" });
  }

  // OTP is valid, mark the user as verified
  user.isActive = true;

  // Reset the user's OTP
  user.otp = null;

  // Save the updated user document
  await user.save();

  delete req.session.error;

  // Redirect the user to the password reset page
  return res.redirect("/user/forgot-password/reset-password");
};

const resetPasswordGet = (req, res) => {
  if (req.session.frgtpass) {
    const error = req.session.error;
    res.render("resetpassword", { error });
  } else {
    res.redirect("/user/login");
  }
};

const resetPasswordPost = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const userEmail = req.session.resetEmail;

  if (!newPassword || !confirmPassword) {
    req.session.error = "Please fill out all fields";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (newPassword.length < 6) {
    req.session.error = "Password should contain Minimum 6 characters";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (newPassword.includes(" ")) {
    req.session.error = "Password should not contain spaces";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (!/[A-Z]/.test(newPassword)) {
    req.session.error = "Password should contain at least one uppercase letter";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (!/[a-z]/.test(newPassword)) {
    req.session.error = "Password should contain at least one lowercase letter";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (!/\d/.test(newPassword)) {
    req.session.error = "Password should contain at least one digit";
    return res.redirect("/user/forgot-password/reset-password");
  }

  if (!/[!@#$%^&*()_+[\]{};':"\\|,.<>?/~`]/.test(newPassword)) {
    req.session.error =
      "Password should contain at least one special character";
    return res.redirect("/user/forgot-password/reset-password");
  }

  // Check if newPassword matches confirmPassword
  if (newPassword !== confirmPassword) {
    req.session.error = "Password do not match";
    return res.redirect("/user/forgot-password/reset-password");
  }

  try {
    // Find the user by their email
    const user = await userModel.findOne({ email: userEmail });
    // If the user is found, update their password
    if (user) {
      // Hash the new password before saving it to the database (assuming you're using bcrypt)
      const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the saltRounds

      // Update the user's password field with the hashed password
      user.password = hashedPassword;

      // Save the updated user document
      await user.save();

      delete req.session.frgtpass;
      delete req.session.error;

      // Redirect the user to the login page with a success message
      return res.redirect("/user/login");
    } else {
      return res.render("resetpassword", { error: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const userCartGet = async (req, res) => {
  try {
    delete req.session.error;
    if (req.session.login) {
      const user = req.session.login;
      const carts = await Cart.find({ userId: user });
      res.render("UserCart", { carts });
    } else {
      res.redirect("/user/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const userCartPost = async (req, res) => {
  try {
    const user = req.session.login;
    if (!user) {
      return res.redirect("/user/login");
    }
    const productId = req.params.id;
    const product = await Product.findById(productId);

    const quantity = req.body["num-product"];
    const price = product.sellingPrice;

    const cartItem = await Cart.findOne({ userId: user, name: product.name });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity);
      cartItem.total += quantity * price;
      await cartItem.save();
    } else {
      const cart = new Cart({
        userId: user,
        productId: product._id,
        productImg: product.imagePath[0],
        name: product.name,
        price: product.sellingPrice,
        quantity: parseInt(quantity),
        total: quantity * price,
      });
      await cart.save();
    }
    res.redirect("/user/cart");
  } catch (error) {
    console.error(error);
  }
};

const DeleteCart = async (req, res) => {
  try {
    Cart.findByIdAndDelete(req.params.id).then((resp) => {
      console.log(resp + " deleted");
      res.send(200);
    });
  } catch (error) {
    console.error(error);
  }
};

const CartProductdc = async (req, res) => {
  try {
    const cartId = req.params.id;

    // Find the cart item by ID
    const cartItem = await Cart.findById(cartId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Decrease the quantity by 1 (you can customize this logic)
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;

      cartItem.total = cartItem.quantity * cartItem.price;

      // Save the updated cart item
      await cartItem.save();
    }

    res.sendStatus(200); // Send a success status code
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const CartProductin = async (req, res) => {
  try {
    const cartId = req.params.id;

    // Find the cart item by ID
    const cartItem = await Cart.findById(cartId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // increase the quantity by 1
    cartItem.quantity += 1;

    cartItem.total = cartItem.quantity * cartItem.price;
    // Save the updated cart item
    await cartItem.save();

    res.sendStatus(200); // Send a success status code
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const CheckoutGet = async (req, res) => {
  try {
    const user = req.session.login;
    const carts = await Cart.find({ userId: user });
    res.render("CheckoutPage", { carts });
  } catch (error) {
    console.error(error);
  }
};

const userOrdersGet = async (req, res) => {
  try {
    if (req.session.login) {
      const userId = req.session.login;
      const orders = await Order.find({ userId });
      res.render("UserOrders", { orders });
    } else {
      res.redirect("/user/login");
    }
  } catch (error) {
    console.error(error);
  }
};

const userOrdersPost = async (req, res) => {
  try {
    console.log(req.body);
    console.log("called");

    const {
      name,
      email,
      state,
      district,
      city,
      phone,
      pincode,
      paymentMethod,
    } = req.body;

    const user = req.session.login;
    const carts = await Cart.find({ userId: user });

    if (paymentMethod === "Cash On Delivery") {
      let totalAmount = 0;

      const updatedStockQuantities = {};

      for (const cartItem of carts) {
        totalAmount += cartItem.price * cartItem.quantity;

        const product = await Product.findById(cartItem.productId);

        if (product) {
          const orderedQuantity = cartItem.quantity;
          const currentStockQuantity = product.stockQuantity;

          if (orderedQuantity <= currentStockQuantity) {
            product.stockQuantity -= orderedQuantity;
            await product.save();

            updatedStockQuantities[product._id] =
              currentStockQuantity - orderedQuantity;
          }
        }
      }

      const orderId = generateRandomOrderId();

      const order = new Order({
        orderId: orderId,
        userId: user,
        products: carts,
        name,
        email,
        state,
        district,
        city,
        phone,
        pincode,
        paymentMethod,
        status: "Pending",
        totalAmount,
        orderDate: new Date(),
      });

      await order.save();

      // Delete the user's cart after placing the order
      await Cart.deleteMany({ userId: user });
      delete req.session.error;

      return res.json({ cod: true });
    } else if (paymentMethod === "Online Payment") {
      let totalAmount = 0;

      const updatedStockQuantities = {};

      for (const cartItem of carts) {
        totalAmount += cartItem.price * cartItem.quantity;

        const product = await Product.findById(cartItem.productId);

        if (product) {
          const orderedQuantity = cartItem.quantity;
          const currentStockQuantity = product.stockQuantity;

          if (orderedQuantity <= currentStockQuantity) {
            product.stockQuantity -= orderedQuantity;
            await product.save();

            updatedStockQuantities[product._id] =
              currentStockQuantity - orderedQuantity;
          }
        }
      }
      const orderId = generateRandomOrderId();
      let options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: orderId,
      };

      instance.orders.create(options, async (err, order) => {
        if (!err) {
          console.log(order);
          const user = await userModel.find({ email: req.session.login });

          res.json({ order, user, online: true });
        } else {
          // Handle payment error
          console.log(err);
          // Send an error response to the client
          res.status(500).json({ error: "Payment failed" });
        }
      });
    } else if (paymentMethod === "Wallet Payment") {
      const userDoc = await userModel.findOne({ email: user });

      let totalAmount = 0;

      const updatedStockQuantities = {};

      for (const cartItem of carts) {
        totalAmount += cartItem.price * cartItem.quantity;

        const product = await Product.findById(cartItem.productId);

        if (product) {
          const orderedQuantity = cartItem.quantity;
          const currentStockQuantity = product.stockQuantity;

          if (orderedQuantity <= currentStockQuantity) {
            product.stockQuantity -= orderedQuantity;
            await product.save();

            updatedStockQuantities[product._id] =
              currentStockQuantity - orderedQuantity;
          }
        }
      }

      if (!userDoc) {
        return res.status(400).json({ error: "User not found" });
      }

      // Deduct the order total from the user's wallet
      userDoc.wallet -= totalAmount;
      await userDoc.save();

      const orderId = generateRandomOrderId();

      const order = new Order({
        orderId: orderId,
        userId: user,
        products: carts,
        name,
        email,
        state,
        district,
        city,
        phone,
        pincode,
        paymentMethod,
        status: "Pending",
        totalAmount,
        orderDate: new Date(),
      });

      await order.save();

      // Delete the user's cart after placing the order
      await Cart.deleteMany({ userId: user });

      return res.json({ wallet: true });
    }
  } catch (error) {
    console.log(error);
  }
};

const ConfirmOrder = async (req, res) => {
  try {
    const { orderId, orderData } = req.body;

    const { amount, receipt } = orderId;

    const {
      name,
      email,
      state,
      district,
      city,
      phone,
      pincode,
      paymentMethod,
    } = orderData;

    const user = req.session.login;
    const carts = await Cart.find({ userId: user });

    const order = new Order({
      orderId: receipt,
      userId: user,
      products: carts,
      name,
      email,
      state,
      district,
      city,
      phone,
      pincode,
      paymentMethod,
      status: "Pending",
      totalAmount: amount / 100,
      orderDate: new Date(),
    });

    await order.save();

    // Delete the user's cart after placing the order
    await Cart.deleteMany({ userId: user });
    res.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const CancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(req.params);

    // Find the order by its ID in the database
    const order = await Order.findById(orderId);

    if (!order) {
      // If the order doesn't exist, respond with an error
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the order status to "Requested to cancel the order"
    order.status = "Requesting order cancellation";

    // Save the updated order in the database
    await order.save();
    res.redirect("/user/orders");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling order" });
  }
};

const UserProfileGet = async (req, res) => {
  try {
    if (req.session.login) {
      const userId = req.session.login;
      const user = await userModel.findOne({ email: userId });

      res.render("UserProfile", { user });
    } else {
      res.redirect("/user/login");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userSignUpGet,
  otpEntryGet,
  otpEntryPost,
  userSignUpPost,
  homeGet,
  userLoginPageGet,
  userLoginPagePost,
  userLogout,
  UserShopGet,
  ShopSearch,
  ProductDetailsGet,
  forgotPasswordGet,
  forgotPasswordPost,
  verifyOtpGet,
  verifyOtpPost,
  resetPasswordGet,
  resetPasswordPost,
  userCartGet,
  userCartPost,
  DeleteCart,
  CartProductdc,
  CartProductin,
  CheckoutGet,
  userOrdersGet,
  userOrdersPost,
  ConfirmOrder,
  CancelOrder,
  UserProfileGet,
};
