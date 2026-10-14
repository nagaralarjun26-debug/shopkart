const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const customerRoutes = require('../routes/customer.routes');
const productRoutes = require('../routes/product.routes');
const wishlistRoutes = require('../routes/wishlist.routes');

let mongoServer;
let server;
let baseUrl;

const parseCookie = (setCookieHeader) => {
  if (!setCookieHeader) return null;
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return cookieStr.split(';')[0];
};

const startTestServer = async () => {
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.4' } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  app.use('/customers', customerRoutes);
  app.use('/products', productRoutes);
  app.use('/wishlist', wishlistRoutes);

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
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const runTests = async () => {
  console.log('\n==================================================');
  console.log('  STARTING SHOPKART LAB 04 WISHLIST SERVICE TESTS');
  console.log('==================================================\n');

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

    // 1. Create a customer & login
    const regRes = await fetch(`${baseUrl}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Walker',
        email: 'alice@example.com',
        password: 'password123',
        phone: '9876543210'
      })
    });
    assert(regRes.status === 201, 'Customer registered successfully');

    const loginRes = await fetch(`${baseUrl}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'password123'
      })
    });
    assert(loginRes.status === 200, 'Customer logged in successfully');
    const setCookie = loginRes.headers.get('set-cookie');
    const authCookie = parseCookie(setCookie);
    assert(authCookie && authCookie.startsWith('token='), 'Auth cookie received');

    // 2. Create products
    const prod1 = await Product.create({
      name: 'Wireless Mechanical Keyboard',
      description: 'Tactile mechanical switches with RGB backlighting',
      price: 3499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      stock: 12
    });

    const prod2 = await Product.create({
      name: 'Noise Cancelling Headphones',
      description: 'Over-ear wireless headphones with ANC',
      price: 4999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      stock: 8
    });

    // 3. GET /wishlist initially empty
    const initialWishRes = await fetch(`${baseUrl}/wishlist`, {
      headers: { Cookie: authCookie }
    });
    const initialWishData = await initialWishRes.json();
    assert(initialWishRes.status === 200, 'GET /wishlist returns 200 OK');
    assert(initialWishData.success === true && initialWishData.count === 0 && Array.isArray(initialWishData.wishlist), 'Initial wishlist is empty');

    // 4. Test unauthenticated request to /wishlist -> 401
    const unauthRes = await fetch(`${baseUrl}/wishlist`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /wishlist returns 401 Unauthorized');

    // 5. POST /wishlist/:productId (Add prod1) -> 200/201
    const addRes1 = await fetch(`${baseUrl}/wishlist/${prod1._id}`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });
    const addData1 = await addRes1.json();
    assert(addRes1.status === 200 || addRes1.status === 201, 'POST /wishlist/:productId returns 200/201');
    assert(addData1.success === true && addData1.message.includes('added'), 'Add product success response');

    // 6. Duplicate add -> 409 Conflict
    const dupRes = await fetch(`${baseUrl}/wishlist/${prod1._id}`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, 'POST duplicate product returns 409 Conflict');
    assert(dupData.success === false, 'Duplicate response success is false');

    // 7. Add invalid productId format -> 400
    const invAddRes = await fetch(`${baseUrl}/wishlist/invalid-objectid`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });
    assert(invAddRes.status === 400, 'POST with invalid productId format returns 400 Bad Request');

    // 8. Add non-existent productId -> 404
    const nonExistId = new mongoose.Types.ObjectId();
    const missingAddRes = await fetch(`${baseUrl}/wishlist/${nonExistId}`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });
    assert(missingAddRes.status === 404, 'POST with non-existent productId returns 404 Not Found');

    // 9. Add prod2 to wishlist
    await fetch(`${baseUrl}/wishlist/${prod2._id}`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });

    // 10. GET /wishlist -> populated products
    const getWishRes = await fetch(`${baseUrl}/wishlist`, {
      headers: { Cookie: authCookie }
    });
    const getWishData = await getWishRes.json();
    assert(getWishRes.status === 200, 'GET /wishlist returns 200 OK after adding');
    assert(getWishData.count === 2, 'GET /wishlist count is 2');
    assert(getWishData.wishlist[0].name && getWishData.wishlist[0].price, 'Wishlist items are populated with product fields');

    // 11. DELETE /wishlist/:productId (Remove prod1) -> 200
    const delRes = await fetch(`${baseUrl}/wishlist/${prod1._id}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie }
    });
    const delData = await delRes.json();
    assert(delRes.status === 200, 'DELETE /wishlist/:productId returns 200 OK');
    assert(delData.success === true && delData.message.includes('removed'), 'Remove product success response');

    // 12. Delete again (product not in wishlist) -> 404
    const delAgainRes = await fetch(`${baseUrl}/wishlist/${prod1._id}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie }
    });
    assert(delAgainRes.status === 404, 'DELETE product not in wishlist returns 404 Not Found');

    // 13. Delete invalid ID format -> 400
    const delInvRes = await fetch(`${baseUrl}/wishlist/invalid-objectid`, {
      method: 'DELETE',
      headers: { Cookie: authCookie }
    });
    assert(delInvRes.status === 400, 'DELETE invalid productId returns 400 Bad Request');

    // 14. Bonus: PATCH /wishlist/:productId/toggle
    // prod1 was removed, toggle should add it (saved: true)
    const toggleAddRes = await fetch(`${baseUrl}/wishlist/${prod1._id}/toggle`, {
      method: 'PATCH',
      headers: { Cookie: authCookie }
    });
    const toggleAddData = await toggleAddRes.json();
    assert(toggleAddRes.status === 200 && toggleAddData.saved === true, 'PATCH toggle adds product (saved: true)');

    // Toggle again should remove it (saved: false)
    const toggleRemRes = await fetch(`${baseUrl}/wishlist/${prod1._id}/toggle`, {
      method: 'PATCH',
      headers: { Cookie: authCookie }
    });
    const toggleRemData = await toggleRemRes.json();
    assert(toggleRemRes.status === 200 && toggleRemData.saved === false, 'PATCH toggle removes product (saved: false)');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await stopTestServer();
  }

  console.log('\n==================================================');
  console.log(`  WISHLIST TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
