process.env.NODE_ENV = 'test';
process.env.PORT = '5095';
const dotenv = require('dotenv');
dotenv.config();
process.env.NODE_ENV = 'test';

const http = require('http');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { key_secret } = require('../config/razorpay');

let server;
const port = 5095;
let cookie1 = '';
let cookie2 = '';
let user1Id = '';
let user2Id = '';
let testProduct1Id = '';
let testProduct2Id = '';

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const waitForMongoose = async () => {
  while (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

const runOrderTests = async () => {
  console.log('🧪 Starting Lab 06 Order & Checkout Verification Tests...\n');
  let passed = 0;
  let total = 0;

  const assert = (testName, condition, details = '') => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
    }
  };

  try {
    await waitForMongoose();

    // Start local test server
    await new Promise((resolve) => {
      server = app.listen(port, resolve);
    });

    // 1. Setup two test users
    const email1 = `buyer_${Date.now()}@shopkart.test`;
    const resReg1 = await request(
      { path: '/customers/register', method: 'POST' },
      { fullName: 'Test Buyer One', email: email1, password: 'Password123!', phone: '9876543210' }
    );
    user1Id = resReg1.body.customer?._id || resReg1.body.user?._id;

    const resLogin1 = await request(
      { path: '/customers/login', method: 'POST' },
      { email: email1, password: 'Password123!' }
    );
    if (resLogin1.headers['set-cookie']) {
      cookie1 = resLogin1.headers['set-cookie'][0].split(';')[0];
    }

    const email2 = `buyer2_${Date.now()}@shopkart.test`;
    const resReg2 = await request(
      { path: '/customers/register', method: 'POST' },
      { fullName: 'Test Buyer Two', email: email2, password: 'Password123!', phone: '9876543211' }
    );
    user2Id = resReg2.body.customer?._id || resReg2.body.user?._id;

    const resLogin2 = await request(
      { path: '/customers/login', method: 'POST' },
      { email: email2, password: 'Password123!' }
    );
    if (resLogin2.headers['set-cookie']) {
      cookie2 = resLogin2.headers['set-cookie'][0].split(';')[0];
    }

    // 2. Setup test products in MongoDB
    const p1 = await Product.create({
      name: 'Wireless Mechanical Keyboard',
      description: 'RGB Backlit mechanical keyboard with hot-swappable switches',
      price: 2999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      stock: 5
    });
    testProduct1Id = p1._id.toString();

    const p2 = await Product.create({
      name: 'Ergonomic Gaming Mouse',
      description: 'Precision gaming mouse with 16000 DPI sensor',
      price: 1499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
      stock: 2
    });
    testProduct2Id = p2._id.toString();

    // -------------------------------------------------------------
    // Test 1: Empty cart -> Reject order
    // -------------------------------------------------------------
    const resEmptyCart = await request(
      { path: '/orders/create-payment-order', method: 'POST', headers: { Cookie: cookie1 } },
      {
        shippingAddress: {
          fullName: 'Test Buyer',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        }
      }
    );
    assert('Test 1: Empty cart rejected with 400', resEmptyCart.statusCode === 400, JSON.stringify(resEmptyCart.body));

    // -------------------------------------------------------------
    // Test 9: Unauthenticated request rejected
    // -------------------------------------------------------------
    const resUnauth = await request(
      { path: '/orders/create-payment-order', method: 'POST' },
      { shippingAddress: { fullName: 'No Auth', phone: '9876543210', addressLine1: 'Road', city: 'City', state: 'ST', pincode: '560001' } }
    );
    assert('Test 9: Unauthenticated checkout rejected with 401', resUnauth.statusCode === 401);

    // -------------------------------------------------------------
    // Add items to user1's cart
    // -------------------------------------------------------------
    await request({ path: `/cart/${testProduct1Id}`, method: 'POST', headers: { Cookie: cookie1 } });
    await request({ path: `/cart/${testProduct1Id}`, method: 'POST', headers: { Cookie: cookie1 } }); // qty = 2
    await request({ path: `/cart/${testProduct2Id}`, method: 'POST', headers: { Cookie: cookie1 } }); // qty = 1
    // Total should be: 2999 * 2 + 1499 * 1 = 5998 + 1499 = 7497

    // -------------------------------------------------------------
    // Test 2 & Test 8: Create payment order & ignore fake client total
    // -------------------------------------------------------------
    const resCreateOrder = await request(
      { path: '/orders/create-payment-order', method: 'POST', headers: { Cookie: cookie1 } },
      {
        shippingAddress: {
          fullName: 'Aarav Sharma',
          phone: '9876543210',
          addressLine1: '22 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        },
        totalAmount: 1 // Fake total sent by client!
      }
    );

    assert(
      'Test 2: Create payment order returns success & Razorpay IDs',
      resCreateOrder.statusCode === 201 && resCreateOrder.body.success === true && !!resCreateOrder.body.razorpayOrderId
    );

    const createdShopKartOrderId = resCreateOrder.body.shopKartOrderId;
    const razorpayOrderId = resCreateOrder.body.razorpayOrderId;
    const orderAmount = resCreateOrder.body.amount;

    assert(
      'Test 8: Server calculated true total in paise (749700) ignoring client fake total',
      orderAmount === 749700,
      `Received amount: ${orderAmount}`
    );

    // -------------------------------------------------------------
    // Test 3: Cart before payment verification remains populated
    // -------------------------------------------------------------
    const resCartBeforeVerify = await request(
      { path: '/cart', method: 'GET', headers: { Cookie: cookie1 } }
    );
    assert(
      'Test 3: Cart still contains items before payment is verified',
      resCartBeforeVerify.body.cart && resCartBeforeVerify.body.cart.length === 2
    );

    // -------------------------------------------------------------
    // Test 4: Payment with invalid signature is rejected & cart untouched
    // -------------------------------------------------------------
    const resInvalidSig = await request(
      { path: '/orders/verify-payment', method: 'POST', headers: { Cookie: cookie1 } },
      {
        shopKartOrderId: createdShopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_invalid_123',
        razorpay_signature: 'fake_tampered_signature_hex'
      }
    );
    assert(
      'Test 4: Invalid signature returns 400 Bad Request',
      resInvalidSig.statusCode === 400 && resInvalidSig.body.success === false
    );

    // Verify cart is NOT cleared after signature failure
    const resCartAfterFail = await request(
      { path: '/cart', method: 'GET', headers: { Cookie: cookie1 } }
    );
    assert('Test 4b: Cart is NOT cleared after invalid signature failure', resCartAfterFail.body.cart.length === 2);

    // -------------------------------------------------------------
    // Test 5: Payment with valid HMAC signature succeeds & clears cart
    // -------------------------------------------------------------
    const validPaymentId = 'pay_test_' + Date.now();
    const signatureBody = `${razorpayOrderId}|${validPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', key_secret)
      .update(signatureBody)
      .digest('hex');

    const resValidSig = await request(
      { path: '/orders/verify-payment', method: 'POST', headers: { Cookie: cookie1 } },
      {
        shopKartOrderId: createdShopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: validPaymentId,
        razorpay_signature: validSignature
      }
    );

    assert(
      'Test 5: Valid signature marks order PAID and PLACED',
      resValidSig.statusCode === 200 &&
      resValidSig.body.order?.paymentStatus === 'PAID' &&
      resValidSig.body.order?.status === 'PLACED'
    );

    // Verify cart is now cleared
    const resCartCleared = await request(
      { path: '/cart', method: 'GET', headers: { Cookie: cookie1 } }
    );
    assert('Test 5b: Cart is cleared in DB after successful payment', resCartCleared.body.cart.length === 0);

    // Verify product stock was decremented (p1 was 5, bought 2 -> 3; p2 was 2, bought 1 -> 1)
    const updatedP1 = await Product.findById(testProduct1Id);
    assert('Test 5c: Inventory stock was decremented correctly', updatedP1.stock === 3, `Stock: ${updatedP1.stock}`);

    // -------------------------------------------------------------
    // Test 6: Get Orders returns user's order
    // -------------------------------------------------------------
    const resGetOrders = await request(
      { path: '/orders', method: 'GET', headers: { Cookie: cookie1 } }
    );
    assert(
      'Test 6: GET /orders returns user order list',
      resGetOrders.statusCode === 200 &&
      resGetOrders.body.orders.length >= 1 &&
      resGetOrders.body.orders[0]._id.toString() === createdShopKartOrderId
    );

    // -------------------------------------------------------------
    // Test 10: Access another user's order is forbidden (403 Forbidden)
    // -------------------------------------------------------------
    const resUser2Access = await request(
      { path: `/orders/${createdShopKartOrderId}`, method: 'GET', headers: { Cookie: cookie2 } }
    );
    assert(
      "Test 10: User 2 cannot access User 1's order (enforces 403 Forbidden)",
      resUser2Access.statusCode === 403
    );

    // -------------------------------------------------------------
    // Test 7: Insufficient stock rejected
    // -------------------------------------------------------------
    // Add product 2 (stock now 1) to user 2's cart with quantity 1
    await request({ path: `/cart/${testProduct2Id}`, method: 'POST', headers: { Cookie: cookie2 } });
    // Artificially deplete stock in DB to 0
    await Product.findByIdAndUpdate(testProduct2Id, { stock: 0 });

    const resOutStock = await request(
      { path: '/orders/create-payment-order', method: 'POST', headers: { Cookie: cookie2 } },
      {
        shippingAddress: {
          fullName: 'Buyer Two',
          phone: '9876543211',
          addressLine1: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001'
        }
      }
    );
    assert(
      'Test 7: Insufficient stock rejected with 400',
      resOutStock.statusCode === 400 && resOutStock.body.message.includes('stock')
    );

    // -------------------------------------------------------------
    // Bonus: Update Order Status Progression
    // -------------------------------------------------------------
    const resBonusStatus = await request(
      { path: `/orders/${createdShopKartOrderId}/status`, method: 'PATCH', headers: { Cookie: cookie1 } },
      { status: 'SHIPPED' }
    );
    assert(
      'Bonus Test: PATCH /orders/:id/status updates progression to SHIPPED',
      resBonusStatus.statusCode === 200 && resBonusStatus.body.order.status === 'SHIPPED'
    );

    console.log(`\n========================================`);
    console.log(`🎯 Test Results: ${passed} / ${total} Passed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(passed === total ? 0 : 1);
  }
};

runOrderTests();
