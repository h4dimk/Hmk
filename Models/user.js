const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phonenumber: {
    type: Number,
  },
  isActive:{
    type:Boolean,
    default:true
  },
  otp:{
    type:String
  },
  // cart:{
  //   type:mongoose.Schema.Types.ObjectId,
  //   ref: "cart",
  // }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
