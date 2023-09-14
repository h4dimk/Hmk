const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  islisted: {
    type: Boolean,
    default: true, 
  },
  // You can add more fields to the category schema as needed.
});

const Category = mongoose.model("Category", CategorySchema);

module.exports = Category;
