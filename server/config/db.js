const mongoose = require('mongoose');

let memoryServer;

const seedInitialProducts = async () => {
  try {
    const Product = require('../models/product.model');
    const count = await Product.countDocuments();
    if (count === 0) {
      const sampleProducts = [
        {
          name: 'Mechanical Keyboard',
          description: 'RGB mechanical keyboard with blue switches, customizable keycaps, and ergonomic wrist rest.',
          price: 2999,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          stock: 10
        },
        {
          name: 'Noise Cancelling Headphones',
          description: 'Wireless over-ear headphones with active noise cancellation, 30-hour battery life, and crystal clear mic.',
          price: 4999,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          stock: 25
        },
        {
          name: 'Ergonomic Gaming Mouse',
          description: 'Ultra-lightweight wireless gaming mouse with 26K DPI optical sensor and programmable side buttons.',
          price: 1899,
          category: 'Electronics',
          image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
          stock: 15
        },
        {
          name: 'Classic Denim Jacket',
          description: 'Timeless vintage denim jacket made from 100% organic cotton with custom brass buttons.',
          price: 3499,
          category: 'Fashion',
          image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
          stock: 8
        },
        {
          name: 'Urban Canvas Sneakers',
          description: 'Minimalist breathable canvas sneakers featuring memory foam insoles for all-day comfort.',
          price: 2499,
          category: 'Fashion',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
          stock: 20
        },
        {
          name: 'Clean Code: Handbook of Agile Software',
          description: 'A classic software engineering guide by Robert C. Martin on writing readable, maintainable code.',
          price: 1199,
          category: 'Books',
          image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
          stock: 30
        },
        {
          name: 'Smart Ceramic Coffee Mug',
          description: 'Temperature control smart mug that keeps your coffee or tea at your preferred warmth for hours.',
          price: 1499,
          category: 'Home',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          stock: 5
        },
        {
          name: 'Adjustable Desk Lamp',
          description: 'Sleek aluminum LED desk lamp with dimmable brightness modes, eye-care filter, and USB charging port.',
          price: 1299,
          category: 'Home',
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
          stock: 12
        }
      ];
      await Product.insertMany(sampleProducts);
      console.log('Sample product catalog automatically seeded into database.');
    }
  } catch (err) {
    console.error('Auto seed check error:', err.message);
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopkart';

  try {
    // Attempt connecting with a 2-second timeout to detect if local mongod is active
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('DB Connected');
    await seedInitialProducts();
  } catch (error) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log('DB Connected');
      await seedInitialProducts();
    } catch (fallbackError) {
      console.error(`Failed to connect DB: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
