// Cloudflare Worker for Unshakable Families Store
// This handles Stripe checkout, ShipStation orders, and Mailchimp bonus delivery

// ===== CONFIGURATION =====
// Environment variables are configured in Cloudflare Workers dashboard:
// - STRIPE_SECRET_KEY (required)
// - SHIPSTATION_API_KEY (optional)
// - SHIPSTATION_API_SECRET (optional)
// - MAILCHIMP_API_KEY (optional)
// - MAILCHIMP_SERVER_PREFIX (optional)
// - MAILCHIMP_LIST_ID (optional)

// Your website URL
const SITE_URL = 'https://unshakable-families-site.pages.dev';

// Product Price IDs from Stripe
const PRICE_IDS = {
    // Bundle Products
    'prod_TKMYdi0tJ8PihI': 'price_1SNhpqENTZGZDoIEfi6rFMQN', // Bundle English
    'prod_TKMZUqoZ3N0UqW': 'price_1SNhqTENTZGZDoIEeEG3CazL', // Bundle Spanish

    // Unshakable Products
    'prod_TKMQIIUotITNZo': 'price_1SNhhNENTZGZDoIEJ1qhRhFI', // Unshakable Paperback English
    'prod_TKMSsIjIYBf5Ev': 'price_1SNhj9ENTZGZDoIEade9RdRT', // Unshakable Paperback Spanish
    'prod_TKMTKRgsWddE83': 'price_1SNhkLENTZGZDoIELjfoA8tY', // Unshakable Ebook English
    'prod_TKMTfrTuMRr7c3': 'price_1SNhkZENTZGZDoIEjl4bfDHk', // Unshakable Ebook Spanish

    // Fire on the Family Altar Products
    'prod_TKMUdCfcPzrqrm': 'price_1SNhl7ENTZGZDoIEdv8igmrL', // Fire Paperback English
    'prod_TKMUV9sItr20yy': 'price_1SNhlTENTZGZDoIETaFD5Pap', // Fire Paperback Spanish
    'prod_TKMU12ym0FzbZM': 'price_1SNhlmENTZGZDoIEH9KmZcwY', // Fire Ebook English
    'prod_TKMVhWKaAW2sZf': 'price_1SNhm4ENTZGZDoIEbQtJY67i', // Fire Ebook Spanish

    // Ebook Bundles
    'prod_TKnXjt9xf5qOze': 'price_1SO7wbENTZGZDoIELabzVT7m', // Ebook Bundle English
    'prod_TKnW58ssyIRVGf': 'price_1SO7vnENTZGZDoIE6y5VEqUq', // Ebook Bundle Spanish

    // Recommendation Products (English)
    'rec_prayer_saturated_church': 'price_1SO7xQENTZGZDoIEwuTNlQh4', // Prayer Saturated Church
    'rec_prayer_saturated_family': 'price_1SO80EENTZGZDoIEzA7pWAe4', // Prayer Saturated Family
    'rec_prayer_saturated_kids': 'price_1SO81oENTZGZDoIE4LcprMsj', // Prayer Saturated Kids
    'rec_reclaim_generation': 'price_1SO83OENTZGZDoIELTB7Ea3k', // Reclaim a Generation
    'rec_two_nations': 'price_1SO84GENTZGZDoIEgLiDJL3a' // Two Nations One Prayer
};

// ===== MAIN HANDLER =====
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Enable CORS
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Route handlers
        if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
            return handleCreateCheckout(request, env, corsHeaders);
        }

        if (url.pathname === '/api/webhook' && request.method === 'POST') {
            return handleStripeWebhook(request, env);
        }

        return new Response('Not Found', { status: 404 });
    }
};

// ===== ENSURE 10% DISCOUNT COUPON EXISTS =====
async function ensureCoupon(env) {
    const couponId = 'addon_discount_10';

    // Try to retrieve existing coupon
    const getCoupon = await fetch(`https://api.stripe.com/v1/coupons/${couponId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        }
    });

    if (getCoupon.ok) {
        // Coupon exists, return its ID
        return couponId;
    }

    // Coupon doesn't exist, create it
    const createCoupon = await fetch('https://api.stripe.com/v1/coupons', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'id': couponId,
            'percent_off': '10',
            'duration': 'once',
            'name': '10% Add-On Discount'
        })
    });

    const couponData = await createCoupon.json();

    if (!createCoupon.ok) {
        console.error('Failed to create coupon:', couponData);
        // Return null if coupon creation fails - checkout will proceed without discount
        return null;
    }

    return couponId;
}

// ===== CREATE CHECKOUT SESSION =====
async function handleCreateCheckout(request, env, corsHeaders) {
    try {
        const { lineItems, cart, hasRecommendation } = await request.json();

        // Prepare line items for Stripe
        const stripeLineItems = cart.map(item => ({
            price: PRICE_IDS[item.id],
            quantity: item.quantity
        }));

        // Create or get 10% discount coupon if needed
        let couponId = null;
        if (hasRecommendation) {
            couponId = await ensureCoupon(env);
        }

        // Create Stripe Checkout Session
        const session = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: (() => {
                const params = new URLSearchParams();
                params.append('success_url', `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`);
                params.append('cancel_url', `${SITE_URL}/cart.html`);
                params.append('mode', 'payment');
                params.append('shipping_address_collection[allowed_countries][]', 'US');
                params.append('shipping_address_collection[allowed_countries][]', 'CA');
                params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
                params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
                params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
                params.append('shipping_options[0][shipping_rate_data][display_name]', 'Free Shipping');
                params.append('phone_number_collection[enabled]', 'true');
                params.append('metadata[cart]', JSON.stringify(cart));

                stripeLineItems.forEach((item, index) => {
                    params.append(`line_items[${index}][price]`, item.price);
                    params.append(`line_items[${index}][quantity]`, item.quantity.toString());
                });

                // Apply 10% discount coupon if customer added recommendation items
                if (couponId) {
                    params.append('discounts[0][coupon]', couponId);
                }

                return params;
            })()
        });

        const sessionData = await session.json();

        if (!session.ok) {
            throw new Error(sessionData.error?.message || 'Failed to create checkout session');
        }

        return new Response(JSON.stringify({ sessionId: sessionData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ===== STRIPE WEBHOOK HANDLER =====
async function handleStripeWebhook(request, env) {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    // Verify webhook signature (in production, implement proper verification)
    // const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    try {
        const event = JSON.parse(body);

        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Get customer details
            const customerEmail = session.customer_details?.email;
            const customerName = session.customer_details?.name;
            const shippingAddress = session.shipping_details?.address;
            const cart = JSON.parse(session.metadata?.cart || '[]');

            // 1. Create ShipStation order (for physical products)
            await createShipStationOrder(session, cart, shippingAddress, env);

            // 2. Send bonuses via Mailchimp
            await sendBonusesViaMailchimp(customerEmail, customerName, cart, env);

            // 3. Track conversion (add to analytics if needed)
            console.log('Order completed:', session.id);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// ===== SHIPSTATION INTEGRATION =====
async function createShipStationOrder(session, cart, shippingAddress, env) {
    // Only create order if cart contains physical products
    const hasPhysicalProducts = cart.some(item =>
        item.type === 'bundle' || item.type === 'paperback'
    );

    if (!hasPhysicalProducts) {
        console.log('No physical products, skipping ShipStation');
        return;
    }

    // Skip if ShipStation is not configured
    if (!env.SHIPSTATION_API_KEY || !env.SHIPSTATION_API_SECRET) {
        console.log('ShipStation not configured, skipping');
        return;
    }

    const orderItems = cart
        .filter(item => item.type === 'bundle' || item.type === 'paperback')
        .map(item => ({
            name: item.name,
            sku: item.id,
            quantity: item.quantity,
            unitPrice: item.price
        }));

    const orderData = {
        orderNumber: session.id,
        orderDate: new Date().toISOString(),
        orderStatus: 'awaiting_shipment',
        customerEmail: session.customer_details?.email,
        customerUsername: session.customer_details?.name,
        billTo: {
            name: session.customer_details?.name,
            email: session.customer_details?.email
        },
        shipTo: {
            name: shippingAddress?.name || session.customer_details?.name,
            street1: shippingAddress?.line1,
            street2: shippingAddress?.line2,
            city: shippingAddress?.city,
            state: shippingAddress?.state,
            postalCode: shippingAddress?.postal_code,
            country: shippingAddress?.country,
            phone: session.customer_details?.phone
        },
        items: orderItems,
        amountPaid: session.amount_total / 100,
        shippingAmount: 0,
        taxAmount: 0
    };

    try {
        const auth = btoa(`${env.SHIPSTATION_API_KEY}:${env.SHIPSTATION_API_SECRET}`);
        
        const response = await fetch('https://ssapi.shipstation.com/orders/createorder', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`ShipStation error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('ShipStation order created:', result.orderId);
        return result;

    } catch (error) {
        console.error('ShipStation error:', error);
        // Don't fail the webhook if ShipStation fails
        // Log error and handle manually if needed
    }
}

// ===== MAILCHIMP INTEGRATION =====
async function sendBonusesViaMailchimp(email, name, cart, env) {
    // Skip if Mailchimp is not configured
    if (!env.MAILCHIMP_API_KEY || !env.MAILCHIMP_SERVER_PREFIX || !env.MAILCHIMP_LIST_ID) {
        console.log('Mailchimp not configured, skipping');
        return;
    }

    try {
        // Determine which bonuses to send based on products in cart
        const hasBundleOrUnshakable = cart.some(item =>
            item.id.includes('TKMYdi0tJ8PihI') || // Bundle English
            item.id.includes('TKMZ') || // Bundle Spanish
            item.id.includes('TKMQ') || // Unshakable PB English
            item.id.includes('TKMS')    // Unshakable PB Spanish
        );

        const hasFireOrBundle = cart.some(item =>
            item.id.includes('TKMY') || // Bundle
            item.id.includes('TKMZ') || // Bundle Spanish
            item.id.includes('TKMU')    // Fire books
        );

        // Add subscriber to Mailchimp
        const subscriberData = {
            email_address: email,
            status: 'subscribed',
            merge_fields: {
                FNAME: name?.split(' ')[0] || '',
                LNAME: name?.split(' ').slice(1).join(' ') || ''
            },
            tags: []
        };

        // Add tags based on purchase
        if (hasBundleOrUnshakable) {
            subscriberData.tags.push('30-Day-Unshakable-Guide');
        }
        if (hasFireOrBundle) {
            subscriberData.tags.push('10-Day-Prayer-Guide');
        }
        subscriberData.tags.push('Purchased-Customer');

        const response = await fetch(
            `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_LIST_ID}/members`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.MAILCHIMP_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriberData)
            }
        );

        if (!response.ok && response.status !== 400) { // 400 means already exists
            throw new Error(`Mailchimp error: ${response.statusText}`);
        }

        console.log('Mailchimp automation triggered for:', email);

        // Trigger automation (your Mailchimp automation should send the bonus guides)
        // This is done via tags - setup your automation in Mailchimp to trigger on these tags

    } catch (error) {
        console.error('Mailchimp error:', error);
        // Don't fail if Mailchimp fails, log for manual follow-up
    }
}

// ===== HELPER FUNCTIONS =====

// Generate order confirmation email content
function generateOrderConfirmation(session, cart) {
    const itemsList = cart.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px; background: #f7fafc; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #e63946; color: white; }
                .bonus-box { background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .cta-button { background: #e63946; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; display: inline-block; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Order Confirmed!</h1>
                    <p>Thank you for your purchase</p>
                </div>
                <div class="content">
                    <h2>Order #${session.id}</h2>
                    <p>Hi ${session.customer_details?.name},</p>
                    <p>Your order has been confirmed and is being prepared for shipment.</p>
                    
                    <h3>Order Details:</h3>
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                        </tr>
                        ${itemsList}
                    </table>
                    
                    <div class="bonus-box">
                        <h3>🎁 Your FREE Bonuses</h3>
                        <p><strong>Check your email!</strong> You'll receive instant access to:</p>
                        <ul>
                            <li>30-Day Unshakable Action Guide</li>
                            <li>10-Day Family Prayer Guide</li>
                        </ul>
                        <p><em>Look for an email from us with download links.</em></p>
                    </div>
                    
                    <p>You'll receive a shipping confirmation email with tracking information once your order ships (typically within 1-2 business days).</p>
                    
                    <p>Questions? Contact us at support@bridgebuilders.net</p>
                    
                    <p>Blessings,<br>The BridgeBuilders Team</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

/* 
SETUP INSTRUCTIONS:

1. CREATE STRIPE PRICE IDs:
   - Go to Stripe Dashboard > Products
   - Create a Price for each product
   - Update the PRICE_IDS object above with real Price IDs (price_xxx format)

2. DEPLOY TO CLOUDFLARE:
   - Install Wrangler CLI: npm install -g wrangler
   - Login: wrangler login
   - Create worker: wrangler init unshakable-store
   - Copy this code to src/index.js
   - Deploy: wrangler deploy

3. SET ENVIRONMENT VARIABLES:
   - In Cloudflare Dashboard > Workers > Your Worker > Settings > Variables
   - Add all the secret keys as encrypted variables

4. CONFIGURE WEBHOOKS:
   - Stripe: Dashboard > Developers > Webhooks
   - Add endpoint: https://your-worker.workers.dev/api/webhook
   - Select events: checkout.session.completed
   - Copy webhook secret and add to env variables

5. MAILCHIMP SETUP:
   - Create automation that triggers on tags:
     * "30-Day-Unshakable-Guide" → Send Unshakable bonus
     * "10-Day-Prayer-Guide" → Send Fire bonus
     * "Purchased-Customer" → Add to customer segment

6. SHIPSTATION SETUP:
   - Get API credentials from ShipStation
   - Configure store settings
   - Set up product mappings using the product IDs

7. UPDATE FRONTEND:
   - Replace all instances of YOUR_DOMAIN with actual domain
   - Update API endpoint URLs to point to your Worker
   - Test with Stripe test mode first

8. TESTING:
   - Use Stripe test cards: 4242 4242 4242 4242
   - Check Stripe Dashboard for test payments
   - Verify webhook events are received
   - Confirm Mailchimp automation triggers
   - Test ShipStation order creation
*/
