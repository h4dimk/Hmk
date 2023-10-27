const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const nocache=require("nocache");
const path = require("path");
const morgan = require("morgan");

const app = express();

app.set("views", path.join(__dirname, "Views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "secret-key",
    resave: true,
    saveUninitialized: false,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static('uploads'));
app.use(nocache())
app.use(morgan("dev"));   

const adminRoute = require("./Routes/adminRoute");
const userRoute = require("./Routes/userRoute");

app.use("/admin", adminRoute);
app.use("/user", userRoute);
app.use('/',(req,res)=> res.redirect('/user'));

mongoose
  .connect("mongodb+srv://hadimk04:iamhmk@cluster0.j3dweww.mongodb.net/?retryWrites=true&w=majority")
  .then(() => {
    console.log("MongoDB is connected");
    app.listen(3000, () => {
      console.log("Server started");
    });
  })
  .catch((err) => {
    console.log("MongoDB is not connected", err);
  });




