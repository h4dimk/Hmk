const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String, 
    required: true,
  },
  products: [
    {
      productImg: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number, 
        required: true,
      },
      total: {
        type: Number, 
        required: true,
      },
    },
  ],
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required:true,
  },
  totalAmount:{
    type:Number,
    required:true,
  },
  orderDate: {
    type: Date,
    required:true,
  },
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
