const bcrypt = require("bcrypt");
const userModel = require("../Models/user");
const nodemailer = require('nodemailer')

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

const homeGet = (req, res) => {
  res.render("LandingPage");
};

const userSignUpGet = (req, res) => {
  res.render("UserSignUp");
};

function generateRandomOTP() {
  // Generate a random number between 100000 and 999999
  const min = 100000;
  const max = 999999;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;

  return otp.toString(); // Convert the number to a string
}

const userSignUpPost = async (req, res) => {
  const { username, email, password, phonenumber } = req.body;
  const saltRounds = 10; 

  if (!username || !email || !password || !phonenumber) {
    return res.render("UserSignUp", { error: "Please fill out all fields" });
  }

  if (password.includes(" ")) {
    return res.render("UserSignUp", {
      error: "Password should not contain spaces",
    });
  }

  if (!username.trim()) {
    return res.render("UserSignUp", { error: "Username cannot be empty" });
  }

  const otp=generateRandomOTP()

  try {
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      return res.render("UserSignUp", { error: "Email already in use" });
    }

    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      return res.render("UserSignUp", { error: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    req.session.email=email;

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

    res.redirect("/user/verify"); // Redirect to OTP verification page
  } catch (error) {
    console.error(error); 
    res.render("UserSignUp", { error: "Internal server error" });
  }
};



const userLoginPageGet = (req, res) => {
  res.render("UserLogin");
};

const userLoginPagePost = async (req, res) => {
  const { email, password } = req.body;
  console.log("username = " + email);
  console.log("passs = " + password);

  if (!email || !password) {
    return res.render("UserLogin", {
      error: "Please enter your username and password",
    });
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.render("UserLogin", {
      error: "Invalid email or password",
    });
  }

  if(!user.isActive){
    return res.render("UserLogin",{
      error:"You need to verify"
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.render("UserLogin", {
      error: "Invalid email or password",
    });
  }
  if (user) {
    res.redirect("/user");
  }
};

const otpEntryGet=(req,res)=>{
  res.render("verify-otp")
}

const otpEntryPost= async (req, res) => {
  const { otp } = req.body;

  // Retrieve the user by their email or username, and check if the OTP matches
  const user = await userModel.findOne({ email: req.session.email });
  console.log(req.session.email);
  if (!user || user.otp != otp) {
    return res.render("verify-otp", { error: "Invalid OTP" });
  }

  // OTP is valid, mark the user as verified (you can add a field in the user document)
  user.isActive = true;
  await user.save();

  
  res.redirect("/user/login");
};

const UserShopGet=(req,res)=>{
  res.render("UserShop");
}


module.exports = {
  userSignUpGet,
  otpEntryGet,
  otpEntryPost,
  userSignUpPost,
  homeGet,
  userLoginPageGet,
  userLoginPagePost,
  UserShopGet
};


