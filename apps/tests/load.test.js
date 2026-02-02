// loadtest/prediction-market-load-test.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const orderPlacementTime = new Trend("order_placement_duration");
const accountCreationTime = new Trend("account_creation_duration");
const orderCounter = new Counter("orders_placed");
const failedOrderCounter = new Counter("orders_failed");

export const options = {
  setupTimeout: "5m",
  stages: [
    { duration: "1m", target: 20 }, // Warm up: ramp to 20 users
    { duration: "2m", target: 20 }, // Stay at 20 users
    { duration: "1m", target: 50 }, // Ramp to 50 users
    { duration: "3m", target: 50 }, // Stay at 50 users
    { duration: "1m", target: 100 }, // Ramp to 100 users
    { duration: "2m", target: 100 }, // Stay at 100 users
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // 95% under 1s, 99% under 2s
    errors: ["rate<0.05"], // Error rate under 5%
    order_placement_duration: ["p(95)<800"], // Order placement under 800ms
    http_req_failed: ["rate<0.1"], // Less than 10% failed requests
  },
};

const BASE_URL = "http://localhost:3000/api";

// Market data from your response

const OUTCOMES = [
  "a168347e-afd4-4bbd-bb84-5bc6038419bf",
  "07d5b297-41b6-4629-9b53-0520eb334ca5",
  "dde31e32-a747-48b6-bac4-b2fa6b4d4fcd",
  "311dc54a-22e8-4c71-ac0f-997323abf7e8",
];

// Setup: Create test users
export function setup() {
  console.log("🚀 Setting up test users...");
  const users = [];
  const NUM_USERS = 150; // Create more users than max VUs for variety

  for (let i = 0; i < NUM_USERS; i++) {
    const email = `loadtest${Date.now()}_${i}@test.com`;
    const password = "testpass123";
    const name = `Load Test User ${i}`;

    // 1. Signup
    const signupRes = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (signupRes.status !== 200 && signupRes.status !== 201) {
      console.error(`❌ Failed to create user ${i}: ${signupRes.status}`);
      continue;
    }

    // 2. Login
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: email,
        password: password,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.error(`❌ Failed to login user ${i}: ${loginRes.status}`);
      continue;
    }

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token || loginData.access_token; // Adjust based on your response

    // 3. Create trading account
    const startAccountTime = Date.now();
    const accountRes = http.post(`${BASE_URL}/accounts`, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    accountCreationTime.add(Date.now() - startAccountTime);

    if (accountRes.status !== 200 && accountRes.status !== 201) {
      console.error(
        `❌ Failed to create account for user ${i}: ${accountRes.status}`,
      );
      continue;
    }

    const accountData = JSON.parse(accountRes.body);

    users.push({
      email: email,
      token: accountData.token,
      accountId: accountData.id || accountData.accountId,
      balance: 10000, // $100 in cents
    });

    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1} users...`);
    }
  }

  console.log(`✅ Setup complete! Created ${users.length} users`);
  return { users };
}

// Main test function
export default function (data) {
  if (!data.users || data.users.length === 0) {
    console.error("No users available for testing");
    return;
  }

  // Pick a random user
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };

  // Weighted random scenarios
  const rand = Math.random();

  // Scenario 1: Place BUY LIMIT order (50% of traffic)
  if (rand < 0.5) {
    const outcome = OUTCOMES[Math.floor(Math.random() * 4)];
    const price = (Math.random() * 0.6 + 0.2).toFixed(2); // 0.20 - 0.80
    const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 shares

    const orderPayload = {
      outcomeId: outcome,
      side: "Buy",
      orderType: "LIMIT",
      price: parseFloat(price),
      quantity: quantity,
      timeInForce: "GTC",
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/order`, JSON.stringify(orderPayload), {
      headers,
    });
    const duration = Date.now() - startTime;

    orderPlacementTime.add(duration);

    const success = check(res, {
      "buy limit order placed": (r) => r.status === 200 || r.status === 201,
      "response time OK": (r) => r.timings.duration < 1000,
    });

    if (success) {
      orderCounter.add(1);
    } else {
      errorRate.add(1);
      failedOrderCounter.add(1);
      console.log(`❌ Buy order failed: ${res.status} - ${res.body}`);
    }

    sleep(Math.random() * 2 + 0.5); // 0.5-2.5s
    return;
  }

  // Scenario 2: Place SELL LIMIT order (20% of traffic)
  if (rand < 0.7) {
    const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
    const price = (Math.random() * 0.4 + 0.4).toFixed(2); // 0.40 - 0.80
    const quantity = Math.floor(Math.random() * 30) + 5; // 5-35 shares

    const orderPayload = {
      outcomeId: outcome,
      side: "Sell",
      orderType: "LIMIT",
      price: parseFloat(price),
      quantity: quantity,
      timeInForce: "GTC",
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/order`, JSON.stringify(orderPayload), {
      headers,
    });
    const duration = Date.now() - startTime;

    orderPlacementTime.add(duration);

    const success = check(res, {
      "sell limit order placed or rejected": (r) =>
        r.status === 200 || r.status === 201 || r.status === 400,
      // 400 is OK for sell (might not have shares)
    });

    if (res.status === 200 || res.status === 201) {
      orderCounter.add(1);
    } else if (res.status !== 400) {
      errorRate.add(1);
      failedOrderCounter.add(1);
    }

    sleep(Math.random() * 2 + 0.5);
    return;
  }

  // Scenario 3: Place MARKET BUY order (15% of traffic)
  if (rand < 0.85) {
    const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
    const quantity = Math.floor(Math.random() * 40) + 10; // 10-50 shares

    const orderPayload = {
      outcomeId: outcome,
      side: "Buy",
      orderType: "MARKET",
      quantity: quantity,
    };

    const startTime = Date.now();
    const res = http.post(`${BASE_URL}/order`, JSON.stringify(orderPayload), {
      headers,
    });
    const duration = Date.now() - startTime;

    orderPlacementTime.add(duration);

    const success = check(res, {
      "market buy order placed": (r) => r.status === 200 || r.status === 201,
    });

    if (success) {
      orderCounter.add(1);
    } else {
      errorRate.add(1);
      failedOrderCounter.add(1);
      console.log(`❌ Market buy failed: ${res.status} - ${res.body}`);
    }

    sleep(Math.random() * 1.5 + 0.3);
    return;
  }

  // Scenario 4: Place BUY order with IOC (10% of traffic)
  const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)];
  const price = (Math.random() * 0.5 + 0.3).toFixed(2);
  const quantity = Math.floor(Math.random() * 30) + 5;

  const orderPayload = {
    outcomeId: outcome,
    side: "Buy",
    orderType: "LIMIT",
    price: parseFloat(price),
    quantity: quantity,
    timeInForce: "IOC",
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/order`, JSON.stringify(orderPayload), {
    headers,
  });
  const duration = Date.now() - startTime;

  orderPlacementTime.add(duration);

  const success = check(res, {
    "ioc order placed": (r) => r.status === 200 || r.status === 201,
  });

  if (success) {
    orderCounter.add(1);
  } else {
    errorRate.add(1);
    failedOrderCounter.add(1);
  }

  sleep(Math.random() * 2 + 0.5);
}

// Teardown: Print summary
export function teardown(data) {
  console.log("");
  console.log("========================================");
  console.log("📊 Load Test Summary");
  console.log("========================================");
  console.log(`Total users created: ${data.users.length}`);
  console.log("Test completed!");
  console.log("========================================");
}
