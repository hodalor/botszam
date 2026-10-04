/**
 * End-to-end check of the main shopping and admin flow against a running API.
 * Creates real orders, so only run it against a development database (after `npm run seed`).
 *
 *   npm run smoke                       # uses http://localhost:$PORT/api
 *   API_URL=http://host/api npm run smoke -- --force
 */
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const API_URL = (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`).replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(API_URL) && !process.argv.includes('--force')) {
  console.error(`Refusing to run against ${API_URL}: it creates orders. Pass --force to override.`);
  process.exit(1);
}

type Json = any;

let passed = 0;
function check(condition: unknown, label: string, detail?: unknown): asserts condition {
  if (!condition) {
    console.error(`  FAIL ${label}`, detail === undefined ? '' : JSON.stringify(detail, null, 2));
    throw new Error(`Check failed: ${label}`);
  }
  passed++;
  console.log(`  ok   ${label}`);
}

async function api(method: string, path: string, options: { body?: unknown; token?: string } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(options.token && { Authorization: `Bearer ${options.token}` }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : null) as Json, headers: res.headers };
}

const randomPhone = (prefix = '097') => `${prefix}${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
const randomRef = () => `TX${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1e4)}`;

async function variantStock(adminToken: string, productId: string, sku: string): Promise<number> {
  const { body } = await api('GET', `/admin/products/${productId}`, { token: adminToken });
  return body.product.variants.find((v: Json) => v.sku === sku).stock;
}

async function main() {
  console.log(`Smoke testing ${API_URL}\n`);

  console.log('Public catalogue');
  const health = await api('GET', '/health');
  check(health.status === 200 && health.body.database === 'connected', 'health check');

  const zones = await api('GET', '/delivery-zones');
  check(zones.status === 200 && zones.body.items.length > 0, 'delivery zones listed');
  const zone = zones.body.items[0];

  const list = await api('GET', '/products?sort=price_asc&limit=50');
  check(list.status === 200 && list.body.items.length > 0, 'products listed');
  const prices = list.body.items.map((p: Json) => p.minPriceNgwee);
  check(prices.every((p: number, i: number) => i === 0 || prices[i - 1] <= p), 'price_asc sort is ordered');
  check(list.body.items[0].variants[0].stock === undefined, 'public products hide exact stock');

  const bath = await api('GET', '/products?category=bath&colour=cloud%20white&maxPrice=30000');
  check(
    bath.status === 200 &&
      bath.body.items.every((p: Json) => p.category === 'bath') &&
      bath.body.items.every((p: Json) => p.variants.some((v: Json) => v.colour === 'Cloud White' && v.priceNgwee <= 30000)),
    'category + colour + maxPrice filters',
  );
  const search = await api('GET', '/products?search=robe');
  check(search.body.items.length >= 1 && search.body.items.every((p: Json) => /robe/i.test(p.name + p.description)), 'search filter');

  const featured = await api('GET', '/products/featured');
  check(featured.status === 200 && featured.body.items.every((p: Json) => p.featured), 'featured products');

  const product = list.body.items.find((p: Json) => p.variants.some((v: Json) => v.inStock));
  const bySlug = await api('GET', `/products/${product.slug}`);
  check(bySlug.status === 200 && bySlug.body.product.id === product.id, 'product by slug');
  check((await api('GET', '/products/does-not-exist')).status === 404, 'unknown slug is 404');

  const settings = await api('GET', '/settings/public');
  check(settings.status === 200 && settings.body.settings.mobileMoneyAccounts.length > 0, 'public settings');

  console.log('\nAuth');
  const adminLogin = await api('POST', '/auth/login', { body: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  check(adminLogin.status === 200 && adminLogin.body.token, 'admin login by email', adminLogin.body);
  check(/httponly/i.test(adminLogin.headers.get('set-cookie') ?? ''), 'login sets an httpOnly cookie');
  const adminToken: string = adminLogin.body.token;

  const customerPhone = randomPhone();
  const register = await api('POST', '/auth/register', {
    body: { name: 'Test Customer', phone: customerPhone, email: `test${Date.now()}@example.com`, password: 'Sup3rSecret!' },
  });
  check(register.status === 201 && register.body.user.phone.startsWith('+260'), 'register normalises phone', register.body);
  check(register.body.user.passwordHash === undefined, 'passwordHash never returned');
  check(register.body.user.role === 'customer', 'new accounts are customers');
  const dup = await api('POST', '/auth/register', { body: { name: 'Dup', phone: customerPhone, password: 'Sup3rSecret!' } });
  check(dup.status === 409, 'duplicate phone rejected');

  const phoneLogin = await api('POST', '/auth/login', {
    body: { identifier: `+26${customerPhone}`, password: 'Sup3rSecret!' },
  });
  check(phoneLogin.status === 200, 'login by phone in another format');
  const badLogin = await api('POST', '/auth/login', { body: { identifier: customerPhone, password: 'wrong-password' } });
  // 429 is acceptable when a previous smoke run tripped the auth rate limiter.
  check(badLogin.status === 401 || badLogin.status === 429, 'wrong password rejected', badLogin.body);
  const customerToken: string = phoneLogin.body.token;

  const me = await api('GET', '/auth/me', { token: customerToken });
  check(me.status === 200 && me.body.user.phone === register.body.user.phone, 'GET /auth/me');
  const patched = await api('PATCH', '/auth/me', {
    token: customerToken,
    body: { name: 'Test Customer Updated', addresses: [{ zone: zone.id, area: 'Kabulonga', street: '12 Test Road' }] },
  });
  check(
    patched.status === 200 && patched.body.user.addresses[0].isDefault === true && patched.body.user.name === 'Test Customer Updated',
    'PATCH /auth/me saves addresses',
    patched.body,
  );
  check((await api('GET', '/admin/stats', { token: customerToken })).status === 403, 'customer blocked from admin');
  check((await api('GET', '/admin/stats')).status === 401, 'anonymous blocked from admin');

  console.log('\nMobile money order (guest)');
  // Prefer a variant with enough stock for qty 2; restock if the catalogue is depleted from prior runs.
  let orderProduct = product;
  let variant = product.variants.find((v: Json) => v.inStock);
  let stockBefore = await variantStock(adminToken, orderProduct.id, variant.sku);
  if (stockBefore < 2) {
    const adj = await api('POST', '/admin/inventory/adjust', {
      token: adminToken,
      body: {
        productId: orderProduct.id,
        variantSku: variant.sku,
        change: 20 - stockBefore,
        reason: 'restock',
        note: 'smoke test ensure stock',
      },
    });
    check(adj.status === 200 && adj.body.stock >= 2, 'restocked low variant for smoke orders', adj.body);
    stockBefore = adj.body.stock;
  }
  const guestPhone = randomPhone('076');
  const orderBody = {
    items: [{ productId: product.id, variantSku: variant.sku, quantity: 2, unitPriceNgwee: 1 }],
    customer: { name: 'Guest Buyer', phone: guestPhone },
    deliveryAddress: { zoneId: zone.id, area: 'Woodlands', street: '5 Chindo Road', landmark: 'Near the market' },
    paymentMethod: 'mobile_money',
    totalNgwee: 1,
    deliveryFeeNgwee: 0,
  };
  const created = await api('POST', '/orders', { body: orderBody });
  check(created.status === 201, 'order created', created.body);
  const order = created.body.order;
  check(/^[A-Z]{2,5}-\d{6}-\d{4}$/.test(order.orderNumber), `order number format (${order.orderNumber})`);
  check(order.status === 'awaiting_payment', 'mobile money starts at awaiting_payment');
  check(
    order.subtotalNgwee === variant.priceNgwee * 2 &&
      order.deliveryFeeNgwee === zone.feeNgwee &&
      order.totalNgwee === variant.priceNgwee * 2 + zone.feeNgwee,
    'server recalculated prices, ignoring client totals',
    order,
  );
  check(created.body.paymentInstructions.accounts.length > 0, 'payment instructions returned');
  check((await variantStock(adminToken, product.id, variant.sku)) === stockBefore - 2, 'stock decremented');

  const wrongTrack = await api('GET', `/orders/track?orderNumber=${order.orderNumber}&phone=${randomPhone()}`);
  check(wrongTrack.status === 404, 'tracking with the wrong phone is 404');
  const track = await api('GET', `/orders/track?orderNumber=${order.orderNumber}&phone=${guestPhone}`);
  check(track.status === 200 && track.body.order.orderNumber === order.orderNumber, 'guest tracking');

  const ref = randomRef();
  const wrongProof = await api('POST', `/orders/${order.orderNumber}/payment-proof`, {
    body: { phone: randomPhone(), network: 'MTN', payerPhone: guestPhone, transactionRef: ref },
  });
  check(wrongProof.status === 404, 'payment proof with the wrong phone is 404');
  const proof = await api('POST', `/orders/${order.orderNumber}/payment-proof`, {
    body: { phone: guestPhone, network: 'MTN', payerPhone: '0961234567', transactionRef: ref },
  });
  check(proof.status === 200 && proof.body.order.status === 'payment_submitted', 'payment proof submitted', proof.body);
  const again = await api('POST', `/orders/${order.orderNumber}/payment-proof`, {
    body: { phone: guestPhone, network: 'MTN', payerPhone: '0961234567', transactionRef: randomRef() },
  });
  check(again.status === 409, 'cannot resubmit after submission');

  const statsBefore = await api('GET', '/admin/stats', { token: adminToken });
  check(statsBefore.body.pendingPaymentVerifications >= 1, 'stats count pending verifications');

  console.log('\nAdmin order handling');
  const search1 = await api('GET', `/admin/orders?search=${guestPhone}`, { token: adminToken });
  check(search1.body.items.some((o: Json) => o.orderNumber === order.orderNumber), 'admin search by phone');
  const search2 = await api('GET', `/admin/orders?search=${order.orderNumber.slice(0, 10)}&status=payment_submitted`, { token: adminToken });
  check(search2.body.items.some((o: Json) => o.orderNumber === order.orderNumber), 'admin search by order number + status');

  const skip = await api('PATCH', `/admin/orders/${order.orderNumber}/status`, { token: adminToken, body: { status: 'processing' } });
  check(skip.status === 409, 'cannot skip payment verification');
  const verified = await api('POST', `/admin/orders/${order.orderNumber}/verify-payment`, { token: adminToken, body: {} });
  check(verified.status === 200 && verified.body.order.status === 'paid', 'admin verified payment', verified.body);
  for (const status of ['processing', 'out_for_delivery', 'delivered']) {
    const r = await api('PATCH', `/admin/orders/${order.orderNumber}/status`, { token: adminToken, body: { status } });
    check(r.status === 200 && r.body.order.status === status, `status -> ${status}`, r.body);
  }
  const backwards = await api('PATCH', `/admin/orders/${order.orderNumber}/status`, { token: adminToken, body: { status: 'processing' } });
  check(backwards.status === 409, 'invalid transition rejected');
  const late = await api('POST', `/orders/${order.orderNumber}/cancel`, { body: { phone: guestPhone } });
  check(late.status === 409, 'customer cannot cancel a delivered order');

  const detail = await api('GET', `/admin/orders/${order.orderNumber}`, { token: adminToken });
  check(
    detail.body.order.statusHistory.map((h: Json) => h.status).join(',') ===
      'awaiting_payment,payment_submitted,paid,processing,out_for_delivery,delivered',
    'statusHistory records every change',
  );

  console.log('\nRejected payment restores stock');
  const s2 = await variantStock(adminToken, product.id, variant.sku);
  const order2 = (await api('POST', '/orders', { body: { ...orderBody, items: [{ productId: product.id, variantSku: variant.sku, quantity: 1 }] } })).body.order;
  check((await variantStock(adminToken, product.id, variant.sku)) === s2 - 1, 'stock decremented for second order');
  const reusedRef = await api('POST', `/orders/${order2.orderNumber}/payment-proof`, {
    body: { phone: guestPhone, network: 'MTN', payerPhone: guestPhone, transactionRef: ref },
  });
  check(reusedRef.status === 409, 'a transaction reference cannot be reused');
  await api('POST', `/orders/${order2.orderNumber}/payment-proof`, {
    body: { phone: guestPhone, network: 'Airtel', payerPhone: guestPhone, transactionRef: randomRef() },
  });
  const rejected = await api('POST', `/admin/orders/${order2.orderNumber}/reject-payment`, {
    token: adminToken,
    body: { reason: 'No matching transaction found' },
  });
  check(rejected.status === 200 && rejected.body.order.status === 'payment_rejected', 'payment rejected', rejected.body);
  check((await variantStock(adminToken, product.id, variant.sku)) === s2, 'stock restored after rejection');
  const rejectedView = await api('GET', `/orders/track?orderNumber=${order2.orderNumber}&phone=${guestPhone}`);
  check(
    rejectedView.body.order.payment.rejectionReason === 'No matching transaction found' &&
      rejectedView.body.paymentInstructions?.accounts?.length > 0,
    'rejected order shows the reason and payment instructions',
    rejectedView.body,
  );
  const resubmitted = await api('POST', `/orders/${order2.orderNumber}/payment-proof`, {
    body: { phone: guestPhone, network: 'MTN', payerPhone: guestPhone, transactionRef: randomRef() },
  });
  check(
    resubmitted.status === 200 &&
      resubmitted.body.order.status === 'payment_submitted' &&
      resubmitted.body.order.payment.rejectionReason === null,
    'customer can resubmit after a rejection',
    resubmitted.body,
  );
  check((await variantStock(adminToken, product.id, variant.sku)) === s2 - 1, 'resubmission re-reserves stock');
  await api('POST', `/admin/orders/${order2.orderNumber}/reject-payment`, {
    token: adminToken,
    body: { reason: 'Still no matching transaction' },
  });
  check((await variantStock(adminToken, product.id, variant.sku)) === s2, 'second rejection releases stock again');

  console.log('\nPay on delivery (logged in) + customer cancel');
  const s3 = await variantStock(adminToken, product.id, variant.sku);
  const pod = await api('POST', '/orders', {
    token: customerToken,
    body: { ...orderBody, customer: { name: 'Test Customer', phone: customerPhone }, paymentMethod: 'pay_on_delivery' },
  });
  check(pod.status === 201 && pod.body.order.status === 'pending_confirmation', 'pay on delivery starts at pending_confirmation');
  const mine = await api('GET', '/orders/mine', { token: customerToken });
  check(mine.body.items.some((o: Json) => o.orderNumber === pod.body.order.orderNumber), 'order appears in /orders/mine');
  const strangerCancel = await api('POST', `/orders/${pod.body.order.orderNumber}/cancel`, { body: {} });
  check(strangerCancel.status === 404, 'anonymous cancel without phone is refused');
  const cancelled = await api('POST', `/orders/${pod.body.order.orderNumber}/cancel`, { token: customerToken, body: {} });
  check(cancelled.status === 200 && cancelled.body.order.status === 'cancelled', 'owner cancelled order');
  check((await variantStock(adminToken, product.id, variant.sku)) === s3, 'stock restored after cancel');
  const cancelTwice = await api('POST', `/orders/${pod.body.order.orderNumber}/cancel`, { token: customerToken, body: {} });
  check(cancelTwice.status === 409, 'cannot cancel twice');

  console.log('\nConcurrency: stock can never go negative');
  const current = await variantStock(adminToken, product.id, variant.sku);
  const target = 3;
  if (current !== target) {
    const adj = await api('POST', '/admin/inventory/adjust', {
      token: adminToken,
      body: { productId: product.id, variantSku: variant.sku, change: target - current, reason: 'adjustment', note: 'smoke test' },
    });
    check(adj.status === 200 && adj.body.stock === target, `inventory adjusted to ${target}`, adj.body);
  }
  const tooMuch = await api('POST', '/admin/inventory/adjust', {
    token: adminToken,
    body: { productId: product.id, variantSku: variant.sku, change: -(target + 1), reason: 'adjustment' },
  });
  check(tooMuch.status === 409, 'adjustment below zero rejected');

  const racers = await Promise.all(
    Array.from({ length: 6 }, () =>
      api('POST', '/orders', { body: { ...orderBody, items: [{ productId: product.id, variantSku: variant.sku, quantity: 1 }] } }),
    ),
  );
  const ok = racers.filter((r) => r.status === 201);
  const soldOut = racers.filter((r) => r.status === 409 && r.body.error.code === 'OUT_OF_STOCK');
  check(ok.length === target && soldOut.length === 6 - target, `6 parallel orders: ${ok.length} placed, ${soldOut.length} out of stock`, racers.map((r) => r.body));
  check((await variantStock(adminToken, product.id, variant.sku)) === 0, 'stock is exactly 0');

  for (const r of ok) {
    await api('POST', `/orders/${r.body.order.orderNumber}/cancel`, { body: { phone: guestPhone } });
  }
  check((await variantStock(adminToken, product.id, variant.sku)) === target, 'cancelling restores all stock');

  console.log('\nInventory + stats');
  const logs = await api('GET', `/admin/inventory/logs?orderNumber=${order2.orderNumber}`, { token: adminToken });
  check(
    logs.body.items.map((l: Json) => l.reason).sort().join(',') === 'order,order,payment_rejected,payment_rejected',
    'inventory logs for an order (order, rejection, re-reserve, rejection)',
    logs.body.items,
  );
  const lowStock = await api('GET', '/admin/inventory/low-stock', { token: adminToken });
  check(lowStock.status === 200 && lowStock.body.items.some((i: Json) => i.sku === variant.sku), 'low-stock list includes the variant');
  const stats = await api('GET', '/admin/stats', { token: adminToken });
  check(stats.body.revenue.today.totalNgwee >= order.totalNgwee, 'delivered order counted in today\'s revenue', stats.body);
  check(stats.body.ordersByStatus.payment_rejected >= 1 && stats.body.lowStockVariants >= 1, 'stats counts by status and low stock');

  console.log(`\nAll ${passed} checks passed.`);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
