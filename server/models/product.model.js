const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      validate: {
        validator: function (val) {
          return typeof val === 'number' && val > 0;
        },
        message: 'Price must be greater than 0'
      }
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Product image URL is required'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative']
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Custom JSON transformation if needed
productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
