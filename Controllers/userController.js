const bcrypt = require("bcrypt");
const userModel = require("../Models/user");
const Product = require("../Models/products");
const nodemailer = require("nodemailer");
const Banner = require("../Models/banner");
const Cart = require("../Models/cart");
const Order = require("../Models/order");

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

function generateRandomOTP() {
  // Generate a random number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString(); // Convert the number to a string
}

const homeGet = async (req, res) => {
  try {
    const banners = await Banner.find();
    const login = req.session.login;
    console.log("Now the user is " + login);
    res.render("LandingPage", { login, banners });
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

    const otp = generateRandomOTP();

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

const userLoginPageGet = (req, res) => {
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
      delete req.session.login;
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
  const products = await Product.find();

  res.render("UserShop", { products });
};

const ShopSearch = async (req, res) => {
  const searchText = req.body.search;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ],
    });

    res.render("UserShop", { products });
  } catch (error) {
    console.log(error);
  }
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
    const otp = generateRandomOTP();

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
    const user = req.session.login;
    const carts = await Cart.find({ userId: user });
    res.render("UserCart", { carts });
  } catch (error) {
    console.error(error);
  }
};

// const userCartPost = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const product = await Product.findById(productId);

//     const quantity = req.body["num-product"];
//     const price = product.price;

//     const userId = req.user.id;

//     let user = await userModel.findById(userId).populate("cart");

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!user.cart) {
//       const cart = new Cart({
//         productImg: product.imagePath[0],
//         name: product.name,
//         price: price,
//         quantity: parseInt(quantity),
//         total: quantity * price,
//       });

//       await cart.save();

//       user.cart = cart;
//     } else {
//       const cartItem = user.cart;
//       cartItem.quantity += parseInt(quantity);
//       cartItem.total += quantity * price;

//       await cartItem.save();
//     }

//     await user.save();

//     res.redirect("/user/cart");
//   } catch (error) {
//     console.error(error);
//   }
// };

const userCartPost = async (req, res) => {
  try {
    const user = req.session.login;
    if (!user) {
      return res.redirect("/user/login");
    }
    const productId = req.params.id;
    const product = await Product.findById(productId);

    const quantity = req.body["num-product"];
    const price = product.price;

    const cartItem = await Cart.findOne({ userId: user, name: product.name });

    if (cartItem) {
      cartItem.quantity += parseInt(quantity);
      cartItem.total += quantity * price;
      await cartItem.save();
    } else {
      const cart = new Cart({
        userId: user,
        productImg: product.imagePath[0],
        name: product.name,
        price: product.price,
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
    const userId = req.session.login;
    const orders = await Order.find({ userId });

    res.render("UserOrders", { orders });
  } catch (error) {
    console.error(error);
  }
};

const userOrdersPost = async (req, res) => {
  try {
    const user = req.session.login;
    const carts = await Cart.find({ userId: user });

    // Calculate the total amount on the server-side
    let totalAmount = 0;
    carts.forEach((cartItem) => {
      totalAmount += cartItem.price * cartItem.quantity;
    });

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

    const order = new Order({
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
      totalAmount: totalAmount,
      orderDate: new Date(),
    });

    await order.save();

    await Cart.deleteMany({ userId: user });

    res.redirect("/user/orders");
  } catch (error) {
    console.error(error);
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

    // Update the order status to "Cancelled"
    order.status = "Cancelled";

    // Save the updated order in the database
    await order.save();
    res.redirect("/user/orders");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cancelling order" });
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
  CancelOrder,
};
