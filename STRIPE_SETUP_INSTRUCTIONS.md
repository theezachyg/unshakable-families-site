# Stripe Checkout Setup Instructions

## Current Status

✅ **Completed:**
- All Stripe Price IDs configured in cart.html
- Cloudflare Worker deployed to: `https://unshakable-families-checkout.bridgebuilders.workers.dev`
- Worker configured to use environment variables
- Cart page updated to use Worker endpoint
- Product mappings configured for all bundles, books, and recommendations
- ShipStation and Mailchimp integrations configured

⚠️ **Requires Manual Setup:**

## 1. Add Mailchimp List ID (Optional)

If you want to use Mailchimp for bonus delivery automation, add one more environment variable:

**Steps:**
1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com/)
2. Navigate to: Workers & Pages → unshakable-families-checkout → Settings → Variables
3. Add environment variable:
   - **Name:** `MAILCHIMP_LIST_ID`
   - **Value:** Your Mailchimp Audience/List ID (found in Mailchimp → Audience → Settings → Audience name and defaults)
   - **Type:** Secret (encrypted)

## 2. Set Up Stripe Webhook (Required)

Configure Stripe to send events to your Worker when orders are completed.

**Steps:**
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. **Endpoint URL:** `https://unshakable-families-checkout.bridgebuilders.workers.dev/api/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add this to Cloudflare Worker environment variables:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Your webhook signing secret
   - **Type:** Secret (encrypted)

## 3. Optional: Configure Order Fulfillment (Later)

If you want to integrate with ShipStation for physical order fulfillment:

**Environment Variables to Add:**
- `SHIPSTATION_API_KEY`
- `SHIPSTATION_API_SECRET`

If you want to automate bonus delivery via Mailchimp:

**Environment Variables to Add:**
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_SERVER_PREFIX` (e.g., 'us1', 'us2', etc.)
- `MAILCHIMP_LIST_ID`

## 3. Test the Checkout

Once the Stripe webhook is configured, you're ready to test!

**Test Steps:**
1. Visit: https://unshakable-families-site.pages.dev
2. Add a product to cart (try the Bundle for full testing)
3. Go to cart and click "Proceed to Checkout"
4. Fill in shipping details
5. Use a real card for live testing OR use [Stripe test mode](https://stripe.com/docs/testing)
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

**What happens after successful payment:**
- Customer receives Stripe payment confirmation
- Order is created in ShipStation (if configured)
- Customer is added to Mailchimp with tags for bonus delivery (if configured)
- Customer tags trigger Mailchimp automation to send bonus guides

## URLs

- **Live Site:** https://unshakable-families-site.pages.dev
- **Checkout Worker:** https://unshakable-families-checkout.bridgebuilders.workers.dev
- **GitHub Repo:** https://github.com/theezachyg/unshakable-families-site

## Stripe Products Configured

All 20 products from your Stripe account have been mapped:

**Bundles:**
- Unshakable Families Bundle (English) - $30.00
- Unshakable Families Bundle (Español) - $30.00

**Individual Books:**
- Unshakable Paperback (English/Español) - $17.99
- Fire on the Family Altar Paperback (English/Español) - $17.99
- Unshakable Ebook (Español) - $9.99
- Fire on the Family Altar Ebook (English/Español) - $9.99

**Ebook Bundles:**
- Unshakable Families EBook Bundle (English/Español)

**Recommendation Books:**
- Prayer Saturated Church - $17.99
- Prayer Saturated Family - $17.99
- Prayer Saturated Kids - $13.99
- Reclaim a Generation - $10.79
- Two Nations One Prayer - $10.99

## Support

For questions about Stripe integration, visit: https://stripe.com/docs/payments/checkout
