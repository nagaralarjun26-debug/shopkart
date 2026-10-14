const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');
dotenv.config();

process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let mongoServer;
let server;

// Helper to extract cookie from set-cookie header
const parseCookie = (setCookieHeader) => {
  if (!setCookieHeader) return null;
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return cookieStr.split(';')[0];
};

async function runTests() {
  console.log('\n==================================================');
  console.log('  STARTING SHOPKART AUTHENTICATION SERVICE TESTS');
  console.log('==================================================\n');

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.4' } });
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;

  // Connect mongoose
  await mongoose.connect(mongoUri);

  // Require Express app after setting MONGODB_URI
  const app = require('../index');

  // Start HTTP server on test port
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
      resolve();
    });
  });

  const Customer = require('../models/customer.model');
  await Customer.deleteMany({});

  let authCookie = '';
  let passedCount = 0;
  let totalCount = 0;

  async function assertCase(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`✅ PASS [Case ${totalCount}]: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAIL [Case ${totalCount}]: ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  // Case 1: Register - Missing fields (400)
  await assertCase('Register fails when fields are missing (400)', async () => {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'John Doe', email: 'testjohn@gmail.com' })
    });
    const data = await res.json();
    if (res.status !== 400 || data.success !== false) {
      throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Case 2: Register - Password too short (400)
  await assertCase('Register fails when password is < 6 characters (400)', async () => {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Doe',
        email: 'testjohn@gmail.com',
        password: '123',
        phone: '9876543210'
      })
    });
    const data = await res.json();
    if (res.status !== 400 || data.success !== false) {
      throw new Error(`Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Case 3: Register - Successful registration (201)
  await assertCase('Register successfully creates customer & hides password (201)', async () => {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Doe',
        email: 'testjohn@gmail.com',
        password: 'johnpassword123',
        phone: '9876543210'
      })
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success || !data.customer || data.customer.password) {
      throw new Error(`Registration failed or returned password: ${JSON.stringify(data)}`);
    }
    if (data.customer.fullName !== 'John Doe' || data.customer.email !== 'testjohn@gmail.com') {
      throw new Error(`Customer data mismatch: ${JSON.stringify(data)}`);
    }
  });

  // Case 4: Register - Duplicate email (409)
  await assertCase('Register rejects duplicate email (409)', async () => {
    const res = await fetch(`${BASE_URL}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Doe Duplicate',
        email: 'testjohn@gmail.com',
        password: 'johnpassword123',
        phone: '9876543210'
      })
    });
    const data = await res.json();
    if (res.status !== 409 || data.success !== false) {
      throw new Error(`Expected 409, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Case 5: Login - Invalid password (401)
  await assertCase('Login fails with invalid credentials (401)', async () => {
    const res = await fetch(`${BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testjohn@gmail.com',
        password: 'wrongpassword'
      })
    });
    const data = await res.json();
    if (res.status !== 401 || data.message !== 'Invalid credentials') {
      throw new Error(`Expected 401 with generic message, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Case 6: Login - Success (200 + sets HttpOnly cookie)
  await assertCase('Login successful & sets HttpOnly cookie (200)', async () => {
    const res = await fetch(`${BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testjohn@gmail.com',
        password: 'johnpassword123'
      })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    authCookie = parseCookie(setCookie);

    if (res.status !== 200 || !data.success || !authCookie || !authCookie.startsWith('token=')) {
      throw new Error(`Login failed or cookie missing: ${JSON.stringify(data)}, cookie: ${setCookie}`);
    }
  });

  // Case 7: Protected profile - Success with cookie (200)
  await assertCase('GET /customers/me returns user profile with valid cookie (200)', async () => {
    const res = await fetch(`${BASE_URL}/customers/me`, {
      method: 'GET',
      headers: { Cookie: authCookie }
    });
    const data = await res.json();
    if (res.status !== 200 || !data._id || data.email !== 'testjohn@gmail.com' || data.password) {
      throw new Error(`Failed to fetch profile or password exposed: ${JSON.stringify(data)}`);
    }
  });

  // Case 8: Protected profile - Fails without cookie (401)
  await assertCase('GET /customers/me fails without authentication cookie (401)', async () => {
    const res = await fetch(`${BASE_URL}/customers/me`, {
      method: 'GET'
    });
    const data = await res.json();
    if (res.status !== 401 || data.success !== false) {
      throw new Error(`Expected 401, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // Case 9: Bonus Challenge - Change Password (200)
  await assertCase('PATCH /customers/change-password changes password successfully (200)', async () => {
    const res = await fetch(`${BASE_URL}/customers/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({
        oldPassword: 'johnpassword123',
        newPassword: 'newjohnpassword456'
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) {
      throw new Error(`Password change failed: ${JSON.stringify(data)}`);
    }
  });

  // Case 10: Login with new password (200)
  await assertCase('Login succeeds with newly updated password (200)', async () => {
    const res = await fetch(`${BASE_URL}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testjohn@gmail.com',
        password: 'newjohnpassword456'
      })
    });
    const data = await res.json();
    const setCookie = res.headers.get('set-cookie');
    authCookie = parseCookie(setCookie);
    if (res.status !== 200 || !data.success) {
      throw new Error(`Login with new password failed: ${JSON.stringify(data)}`);
    }
  });

  // Case 11: Logout - Clears cookie (200)
  await assertCase('POST /customers/logout clears authentication cookie (200)', async () => {
    const res = await fetch(`${BASE_URL}/customers/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });
    const data = await res.json();

    if (res.status !== 200 || !data.success) {
      throw new Error(`Logout failed: ${JSON.stringify(data)}`);
    }
  });

  // Case 12: GET /customers/me after logout (401)
  await assertCase('GET /customers/me rejected after logout (401)', async () => {
    const res = await fetch(`${BASE_URL}/customers/me`, {
      method: 'GET'
    });
    const data = await res.json();
    if (res.status !== 401) {
      throw new Error(`Expected 401 after logout, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  console.log('\n==================================================');
  console.log(`  TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
  console.log('==================================================\n');

  // Close connections
  server.close();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch(async (err) => {
  console.error('Fatal error during test run:', err);
  if (server) server.close();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
  process.exit(1);
});
