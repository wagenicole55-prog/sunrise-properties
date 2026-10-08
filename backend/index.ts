import { router, json, error, secrets, requireAuth, requireAdminEmailAllowlist, db, ai } from '@appdeploy/sdk';

const ADMIN_EMAILS = ['wagenicole55@gmail.com'];
const PRODUCTS_TABLE = 'store_products';
const ORDERS_TABLE = 'store_orders';
const SETTINGS_TABLE = 'store_settings';
const PROPERTIES_TABLE = 'sunrise_properties';
const ENQUIRIES_TABLE = 'sunrise_enquiries';

const DEFAULT_PROPERTIES = [
  { title: 'Modern Lakeside Tiny Home', type: 'Tiny Home', location: 'Austin, Texas', country: 'USA', priceLabel: '$89,500', beds: 2, baths: 1, size: '520 sq ft', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85', tag: 'Featured', featured: true, active: true },
  { title: 'Modern Desert Tiny Home', type: 'Tiny Home', location: 'Phoenix, Arizona', country: 'USA', priceLabel: '$76,000', beds: 2, baths: 1, size: '420 sq ft', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85', tag: 'New', featured: false, active: true },
  { title: 'Residential Land Parcel', type: 'Land', location: 'Dallas, Texas', country: 'USA', priceLabel: '$98,000', size: '1.2 acres', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85', tag: 'Hot Land', featured: false, active: true },
  { title: 'Contemporary Family Home', type: 'Home Rental', location: 'Atlanta, Georgia', country: 'USA', priceLabel: '$3,200 / month', beds: 4, baths: 3, size: '2,300 sq ft', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', tag: 'Available', featured: false, active: true },
  { title: 'Forest Edge Tiny Retreat', type: 'Tiny Home', location: 'Asheville, North Carolina', country: 'USA', priceLabel: '$112,000', beds: 1, baths: 1, size: '480 sq ft', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', featured: false, active: true },
  { title: 'Ocean View Land', type: 'Land', location: 'Tampa, Florida', country: 'USA', priceLabel: '$145,000', size: '1.1 acres', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85', featured: false, active: true },
  { title: 'City Apartment Rental', type: 'Home Rental', location: 'Chicago, Illinois', country: 'USA', priceLabel: '$2,900 / month', beds: 2, baths: 2, size: '1,050 sq ft', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85', tag: 'Available', featured: false, active: true },
  { title: 'Mountain Modern Tiny Home', type: 'Tiny Home', location: 'Denver, Colorado', country: 'USA', priceLabel: '$129,000', beds: 2, baths: 1, size: '560 sq ft', image: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=1200&q=85', featured: false, active: true },
];

async function ensurePropertiesSeeded() {
  const page = await db.list(PROPERTIES_TABLE, { limit: 1 });
  if (page.items.length === 0) await db.add(PROPERTIES_TABLE, DEFAULT_PROPERTIES);
}

const PAYMEGATE_BASE = 'https://api.paymegate.com';
const PAYOUT_EVM_WALLET = '0x76943c68B1Ef1F737BB7253162094623A9fAffC0';

async function paymegateRequest(path: string, options: RequestInit = {}) {
  const apiKey = await secrets.readSecret('PAYMEGATE_API_KEY');
  const response = await fetch(PAYMEGATE_BASE + path, {
    ...options,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Paymegate request failed'
    );
  }
  return data;
}

export const handler = router({
  'GET /api/properties': [async () => {
    await ensurePropertiesSeeded();
    const page = await db.list(PROPERTIES_TABLE, { limit: 100 });
    return json({ properties: page.items.filter((item: any) => item.active !== false) });
  }],
  'POST /api/enquiries': [async ({ body }) => {
    const p = (body || {}) as Record<string, unknown>;
    if (!p.propertyId || !p.name || !p.contact) return error('Property, name and contact are required.', 400);
    const [id] = await db.add(ENQUIRIES_TABLE, [{ propertyId: String(p.propertyId), propertyTitle: String(p.propertyTitle || ''), propertyLocation: String(p.propertyLocation || ''), customerName: String(p.name), customerContact: String(p.contact), message: String(p.message || ''), status: 'NEW', createdAt: new Date().toISOString() }]);
    return id ? json({ id }, 201) : error('Unable to save enquiry.', 500);
  }],
  'GET /api/admin/enquiries': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => {
    const page = await db.list(ENQUIRIES_TABLE, { limit: 200 });
    return json({ enquiries: page.items });
  }],
  'PUT /api/admin/enquiries/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params, body }) => {
    const [existing] = await db.get(ENQUIRIES_TABLE, [params.id]);
    if (!existing) return error('Enquiry not found.', 404);
    const p = (body || {}) as Record<string, unknown>;
    const ok = await db.update(ENQUIRIES_TABLE, [{ id: params.id, record: { ...existing, status: String(p.status || existing.status) } }]);
    return ok[0] ? json({ ok: true }) : error('Unable to update enquiry.', 500);
  }],
  'GET /api/admin/properties': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => {
    await ensurePropertiesSeeded();
    const page = await db.list(PROPERTIES_TABLE, { limit: 100 });
    return json({ properties: page.items });
  }],
  'POST /api/admin/properties': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body }) => {
    const p = (body || {}) as Record<string, unknown>;
    if (!p.title || !p.location || !p.priceLabel || !p.size || !p.image) return error('Title, location, price, size and image are required.', 400);
    const record = { title: String(p.title), type: String(p.type || 'Tiny Home'), location: String(p.location), country: 'USA', priceLabel: String(p.priceLabel), beds: p.beds == null ? undefined : Number(p.beds), baths: p.baths == null ? undefined : Number(p.baths), size: String(p.size), image: String(p.image), tag: p.tag ? String(p.tag) : undefined, featured: p.featured === true, active: p.active !== false };
    const [id] = await db.add(PROPERTIES_TABLE, [record]);
    return id ? json({ id }, 201) : error('Unable to create property.', 500);
  }],
  'PUT /api/admin/properties/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params, body }) => {
    const [existing] = await db.get(PROPERTIES_TABLE, [params.id]);
    if (!existing) return error('Property not found.', 404);
    const p = (body || {}) as Record<string, unknown>;
    const record = { ...existing, title: String(p.title ?? existing.title), type: String(p.type ?? existing.type), location: String(p.location ?? existing.location), country: 'USA', priceLabel: String(p.priceLabel ?? existing.priceLabel), beds: p.beds == null ? existing.beds : Number(p.beds), baths: p.baths == null ? existing.baths : Number(p.baths), size: String(p.size ?? existing.size), image: String(p.image ?? existing.image), tag: p.tag == null ? existing.tag : String(p.tag), featured: p.featured ?? existing.featured, active: p.active ?? existing.active };
    const ok = await db.update(PROPERTIES_TABLE, [{ id: params.id, record }]);
    return ok[0] ? json({ ok: true }) : error('Unable to update property.', 500);
  }],
  'DELETE /api/admin/properties/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params }) => {
    const ok = await db.delete(PROPERTIES_TABLE, [params.id]);
    return ok[0] ? json({ ok: true }) : error('Unable to delete property.', 500);
  }],
  'GET /api/admin/summary': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async () => {
    const productsPage = await db.list(PRODUCTS_TABLE, { limit: 100 });
    const ordersPage = await db.list(ORDERS_TABLE, { limit: 100 });
    const settingsPage = await db.list(SETTINGS_TABLE, { limit: 20 });
    const paidOrders = ordersPage.items.filter((o: any) => o.status === 'PAID');
    const revenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    return json({ products: productsPage.items, orders: ordersPage.items, settings: settingsPage.items, stats: { productCount: productsPage.items.length, orderCount: ordersPage.items.length, paidOrders: paidOrders.length, revenue } });
  }],
  'POST /api/admin/products': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body }) => {
    const p = (body || {}) as Record<string, unknown>;
    if (!p.name || !p.cat || !Number.isFinite(Number(p.price))) return error('Name, category and valid price are required.', 400);
    const [id] = await db.add(PRODUCTS_TABLE, [{ name: String(p.name), cat: String(p.cat), price: Number(p.price), emoji: String(p.emoji || '🛍️'), active: p.active !== false }]);
    return json({ id }, 201);
  }],
  'PUT /api/admin/products/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params, body }) => {
    const [existing] = await db.get(PRODUCTS_TABLE, [params.id]);
    if (!existing) return error('Product not found.', 404);
    const p = (body || {}) as Record<string, unknown>;
    const ok = await db.update(PRODUCTS_TABLE, [{ id: params.id, record: { ...existing, name: String(p.name ?? existing.name), cat: String(p.cat ?? existing.cat), price: Number(p.price ?? existing.price), emoji: String(p.emoji ?? existing.emoji), active: p.active ?? existing.active } }]);
    return ok[0] ? json({ ok: true }) : error('Unable to update product.', 500);
  }],
  'DELETE /api/admin/products/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params }) => {
    const ok = await db.delete(PRODUCTS_TABLE, [params.id]);
    return ok[0] ? json({ ok: true }) : error('Unable to delete product.', 500);
  }],
  'PUT /api/admin/orders/:id': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ params, body }) => {
    const [existing] = await db.get(ORDERS_TABLE, [params.id]);
    if (!existing) return error('Order not found.', 404);
    const p = (body || {}) as Record<string, unknown>;
    const ok = await db.update(ORDERS_TABLE, [{ id: params.id, record: { ...existing, status: String(p.status || existing.status) } }]);
    return ok[0] ? json({ ok: true }) : error('Unable to update order.', 500);
  }],
  'PUT /api/admin/settings': [requireAuth(), requireAdminEmailAllowlist(ADMIN_EMAILS), async ({ body }) => {
    const page = await db.list(SETTINGS_TABLE, { limit: 1 });
    const record = (body || {}) as Record<string, unknown>;
    if (page.items[0]) { const ok = await db.update(SETTINGS_TABLE, [{ id: page.items[0].id, record }]); return ok[0] ? json({ ok: true }) : error('Unable to save settings.', 500); }
    const [id] = await db.add(SETTINGS_TABLE, [record]);
    return json({ id }, 201);
  }],
  'POST /api/ai/property-post': [async ({ body }) => { try { const p = (body || {}) as Record<string, unknown>; if (!p.title || !p.location) return error('Property title and location are required.', 400); const result = await ai.generate({ system: 'You are Sunrise Properties AI marketing assistant. Write accurate, premium U.S. real-estate marketing copy. Never invent legal status, amenities, measurements, availability, or guarantees.', prompt: 'Create one social-media-ready property post with a strong hook, polished short description, price if provided, call to action, and 6-10 hashtags. Tone: ' + String(p.tone || 'Luxury & premium') + '. Property: ' + String(p.title) + '. Type: ' + String(p.type || 'Property') + '. Location: ' + String(p.location) + '. Price: ' + String(p.price || 'Not provided') + '. Features: ' + String(p.features || 'Not provided') }); return json({ post: result.text }); } catch (err) { console.error('AI post generation error', err); return error('Unable to generate the AI post right now.', 502); } }],
  'POST /api/ai/property-image': [async ({ body }) => { try { const p = (body || {}) as Record<string, unknown>; if (!p.title || !p.location) return error('Property title and location are required.', 400); const result = await ai.imageGen({ prompt: 'Create a polished editorial real-estate marketing concept image for Sunrise Properties. Show a beautiful ' + String(p.type || 'property') + ' in ' + String(p.location) + ', premium architectural photography, realistic materials, natural lighting, tasteful landscaping, clean composition, no text, no logos, no people. Property name: ' + String(p.title) + '. Features to emphasize only when appropriate: ' + String(p.features || 'modern design') }); return json({ image: result.image }); } catch (err) { console.error('AI property image error', err); return error('Unable to generate the AI visual right now.', 502); } }],
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'POST /api/payments/paymegate/create': [
    async ({ body }) => {
      try {
        const input = (body || {}) as {
          amount?: number;
          currency?: string;
          items?: Array<{ id: number; name: string; price: number }>;
        };
        const amount = Number(input.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return error('A valid order amount is required.', 400);
        }

        // Keep crypto enabled and route supported EVM settlements to the
        // merchant's self-custodial wallet. The API key remains server-side.
        await paymegateRequest('/v1/wallet', {
          method: 'PUT',
          body: JSON.stringify({
            includeCrypto: true,
            cryptoWallets: {
              evm: PAYOUT_EVM_WALLET,
            },
          }),
        });

        const externalId = 'sunrise_' + Date.now().toString(36);
        const payload = {
          externalId,
          amount: amount.toFixed(2),
          currency: input.currency || 'USD',
          paymentMethodsKeys: ['*'],
          backUrl:
            'https://sunrise-store-llc-qnih7n.v2.appdeploy.ai/?payment=return&orderId=' +
            encodeURIComponent(externalId),
          metadata: {
            store: 'Sunrise Store LLC',
            itemCount: String(input.items?.length || 0),
            itemIds: (input.items || []).map(item => String(item.id)).join(','),
          },
        };

        const result = await paymegateRequest('/v1/orders', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const data = result?.data || result;
        if (!data?.checkoutUrl) {
          return error('Paymegate did not return a checkout URL.', 502);
        }

        return json({
          checkoutUrl: data.checkoutUrl,
          externalId,
          status: data.status || 'UNPAID',
        });
      } catch (err) {
        console.error('Paymegate create order error', err);
        return error('Unable to start checkout right now.', 502);
      }
    },
  ],
  'GET /api/payments/paymegate/status': [
    async ({ query }) => {
      try {
        const externalId = query.externalId;
        if (!externalId) {
          return error('externalId is required.', 400);
        }
        const result = await paymegateRequest(
          '/v1/orders/by-external-id/' + encodeURIComponent(externalId)
        );
        const data = result?.data || result;
        return json({
          externalId,
          status: data?.status || 'UNKNOWN',
          orderUUID: data?.orderUUID || null,
        });
      } catch (err) {
        console.error('Paymegate status error', err);
        return error('Unable to verify payment status right now.', 502);
      }
    },
  ],
});
