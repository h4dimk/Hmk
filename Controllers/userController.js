const bcrypt = require("bcrypt");
const userModel = require("../Models/user");
const Product = require("../Models/products");
const nodemailer = require("nodemailer");

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
  let login = req.session.login;
  console.log("Now the user is "+login);
  res.render("LandingPage", { login });
};

const userSignUpGet = (req, res) => {
  let error = req.session.error;
  res.render("UserSignUp", { error });
};

const userSignUpPost = async (req, res) => {
  const { username, email, password, phonenumber } = req.body;
  const saltRounds = 10;

  if (!username || !email || !password || !phonenumber) {
    req.session.error = "Please fill out all fields";
    return res.redirect("/user/signup");
  }

  if (password.includes(" ")) {
    req.session.error = "Password should not contain spaces";
    return res.redirect("/user/signup");
  }

  if (!username.trim()) {
    req.session.error = "Username cannot be empty";
    return res.redirect("/user/signup");
  }

  const otp = generateRandomOTP();

  try {
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      req.session.error = "Email already in use";
      return res.redirect("/user/signup");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

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

    console.log("OTP for "+newUser.email+" is "+otp);

    // Send OTP to the user's email
    sendOTPToUser(newUser.email, otp);

    req.session.otptoentr = true;

    res.redirect("/user/verify"); // Redirect to OTP verification page
  } catch (error) {
    console.error(error);
    res.render("UserSignUp", { error: "Internal server error" });
  }
};

const userLoginPageGet = (req, res) => {
  let error = req.session.error;
  res.render("UserLogin", { error });
};

const userLogout=(req,res)=>{
  if(req.session.login){
    delete req.session.login;
    return res.redirect('/user/login') 
  }
}

const userLoginPagePost = async (req, res) => {
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
    req.session.error = "You need to verify";
    return res.redirect("/user/login");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    req.session.error = "Invalid email or password";
    return res.redirect("/user/login");
  }

  if (user) {
    req.session.login = user.email;
    res.redirect("/user");
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

  res.redirect("/user/login");
};

const UserShopGet = async (req, res) => {
  const products = await Product.find();

  res.render("UserShop", { products });
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
  user.otp = null; // Set OTP to null or handle OTP expiration as needed

  // Save the updated user document
  await user.save();

  // Redirect the user to the password reset page
  return res.redirect("/user/forgot-password/reset-password");
};

const resetPasswordGet = (req, res) => {
  if (req.session.frgtpass) {
    res.render("resetpassword");
  } else {
    res.redirect("/user/login");
  }
};

const resetPasswordPost = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const userEmail = req.session.resetEmail;

  // Check if newPassword matches confirmPassword
  if (newPassword !== confirmPassword) {
    return res.render("resetpassword", { error: "Passwords do not match" });
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
  forgotPasswordGet,
  forgotPasswordPost,
  verifyOtpGet,
  verifyOtpPost,
  resetPasswordGet,
  resetPasswordPost,
};
