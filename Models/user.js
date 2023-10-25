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
  isActive: {
    type: Boolean,
    default: true,
  },
  otp: {
    type: String,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  walletTransaction: [
    {
      date: {
        type: Date,
      },
      amount: {
        type: Number,
      },
      type: {
        type: String,
      },
    },
  ],
  addresses: [
    {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pincode: {
        type: Number,
      },
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
