const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const Product = require('../models/product.model');
const productRoutes = require('../routes/product.routes');

let mongoServer;
let server;
let baseUrl;

const startTestServer = async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.4' } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  app.use('/products', productRoutes);

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
};

const stopTestServer = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const runTests = async () => {
  console.log('--- Starting ShopKart Lab 03 Product Service Verification ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    await startTestServer();

    // Task 2 Test: POST /products success (201)
    const validProduct = {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with blue switches.',
      price: 2999,
      category: 'Electronics',
      image: 'https://example.com/keyboard.jpg',
      stock: 10
    };

    const res1 = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProduct)
    });
    const data1 = await res1.json();
    assert(res1.status === 201, 'POST /products returns 201 Created');
    assert(data1.success === true && data1.product && data1.product._id, 'POST /products returns created product object with _id');
    const createdId1 = data1.product._id;

    // Task 2 Test: POST /products failure cases (400)
    // Missing required field
    const resMissing = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Keyboard', price: 2000 })
    });
    assert(resMissing.status === 400, 'POST /products with missing fields returns 400');

    // Invalid price <= 0
    const resPriceZero = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validProduct, price: 0 })
    });
    assert(resPriceZero.status === 400, 'POST /products with price <= 0 returns 400');

    // Invalid stock < 0
    const resStockNeg = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validProduct, stock: -5 })
    });
    assert(resStockNeg.status === 400, 'POST /products with stock < 0 returns 400');

    // Insert second product
    const secondProduct = {
      name: 'Noise Cancelling Headphones',
      description: 'Wireless over-ear headphones.',
      price: 4999,
      category: 'Electronics',
      image: 'https://example.com/headphones.jpg',
      stock: 25
    };
    await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondProduct)
    });

    // Insert third product (different category)
    const thirdProduct = {
      name: 'Clean Code Book',
      description: 'Handbooks of Agile Software Craftsmanship.',
      price: 1200,
      category: 'Books',
      image: 'https://example.com/book.jpg',
      stock: 15
    };
    await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thirdProduct)
    });

    // Task 3 Test: GET /products (200)
    const resAll = await fetch(`${baseUrl}/products`);
    const dataAll = await resAll.json();
    assert(resAll.status === 200, 'GET /products returns 200 OK');
    assert(dataAll.success === true && dataAll.count === 3 && Array.isArray(dataAll.products), 'GET /products returns success: true, count: 3, and products array');

    // Task 4 Test: GET /products/:id (200, 400, 404)
    const resSingle = await fetch(`${baseUrl}/products/${createdId1}`);
    const dataSingle = await resSingle.json();
    assert(resSingle.status === 200, 'GET /products/:id returns 200 OK for valid ID');
    assert(dataSingle.product && dataSingle.product.name === 'Mechanical Keyboard', 'GET /products/:id returns correct product');

    // Invalid product ID format (400)
    const resInvalidId = await fetch(`${baseUrl}/products/invalid-mongo-id-123`);
    assert(resInvalidId.status === 400, 'GET /products/invalid-id returns 400 Bad Request');

    // Non-existent product ID (404)
    const nonExistentId = new mongoose.Types.ObjectId();
    const resNotFound = await fetch(`${baseUrl}/products/${nonExistentId}`);
    assert(resNotFound.status === 404, 'GET /products/non-existent-id returns 404 Not Found');

    // Task 5 Test: Search & Category Filtering
    // Search
    const resSearch = await fetch(`${baseUrl}/products?search=keyboard`);
    const dataSearch = await resSearch.json();
    assert(resSearch.status === 200 && dataSearch.products.length === 1 && dataSearch.products[0].name.toLowerCase().includes('keyboard'), 'GET /products?search=keyboard filters by name case-insensitively');

    // Category
    const resCat = await fetch(`${baseUrl}/products?category=Electronics`);
    const dataCat = await resCat.json();
    assert(resCat.status === 200 && dataCat.products.length === 2, 'GET /products?category=Electronics filters by category');

    // Combined search and category
    const resComb = await fetch(`${baseUrl}/products?search=keyboard&category=Electronics`);
    const dataComb = await resComb.json();
    assert(resComb.status === 200 && dataComb.products.length === 1, 'GET /products?search=keyboard&category=Electronics applies combined filters');

    // Bonus Test: Sorting price_asc and price_desc
    const resSortAsc = await fetch(`${baseUrl}/products?sort=price_asc`);
    const dataSortAsc = await resSortAsc.json();
    assert(
      resSortAsc.status === 200 &&
      dataSortAsc.products[0].price === 1200 &&
      dataSortAsc.products[2].price === 4999,
      'GET /products?sort=price_asc sorts products by price ascending'
    );

    const resSortDesc = await fetch(`${baseUrl}/products?sort=price_desc`);
    const dataSortDesc = await resSortDesc.json();
    assert(
      resSortDesc.status === 200 &&
      dataSortDesc.products[0].price === 4999 &&
      dataSortDesc.products[2].price === 1200,
      'GET /products?sort=price_desc sorts products by price descending'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await stopTestServer();
  }

  console.log(`\n--- Verification Summary ---`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
