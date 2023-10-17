const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  sellingPrice: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  islisted: {
    type: Boolean,
    default: true,
  },
  imagePath: [{
    type: String,
    required: true,
  }],
  stockQuantity: {
    type: Number,
    required: true,
  },
});

const Products = mongoose.model("Products", ProductSchema);

module.exports = Products;
