# Checkout Test Plan

## ✅ Setup Complete

All integrations are now configured and ready for testing:

- ✅ Stripe Price IDs configured (20 products)
- ✅ Cloudflare Worker deployed
- ✅ Environment variables configured:
  - `STRIPE_SECRET_KEY`
  - `SHIPSTATION_API_KEY`
  - `SHIPSTATION_API_SECRET`
  - `MAILCHIMP_API_KEY`
  - `MAILCHIMP_SERVER_PREFIX`
  - `MAILCHIMP_LIST_ID`
  - `STRIPE_WEBHOOK_SECRET`
- ✅ Stripe webhook configured

## Test Scenarios

### Test 1: Bundle Purchase (Full Flow)

**Purpose:** Test complete checkout with bonuses, ShipStation order, and Mailchimp automation

**Steps:**
1. Visit: https://unshakable-families-site.pages.dev
2. Click "Get the Bundle" or "Add to Cart" on the bundle
3. Select language: English
4. Select format: Paperback Bundle ($30.00)
5. Go to cart
6. Verify cart shows:
   - Unshakable Family Bundle (English) - $30.00
   - Free bonuses listed (30-Day Prayer Guide + 10-Day Fire Guide)
   - Regular price: $35.98
   - You're saving: $5.98
7. Click "Proceed to Checkout"
8. Fill in shipping details (use real address for ShipStation test)
9. Enter payment details (use test card: `4242 4242 4242 4242`)
10. Complete purchase

**Expected Results:**
- ✅ Checkout session created successfully
- ✅ Redirected to Stripe checkout page
- ✅ Payment processed
- ✅ Redirected to success page
- ✅ Order appears in ShipStation
- ✅ Customer added to Mailchimp with tags:
  - `30-Day-Unshakable-Guide`
  - `10-Day-Prayer-Guide`
  - `Purchased-Customer`
- ✅ Mailchimp automation triggered to send bonus PDFs

### Test 2: Individual Book Purchase

**Purpose:** Test single paperback with specific bonus

**Steps:**
1. Visit: https://unshakable-families-site.pages.dev/unshakable_landing_page.html
2. Add "Unshakable Paperback" to cart
3. Go to cart
4. Verify cart shows:
   - Unshakable Paperback - $17.99
   - Free bonus: 30-Day Unshakable Prayer Guide ($29.95 value)
5. Complete checkout with test card

**Expected Results:**
- ✅ ShipStation order for 1 paperback book
- ✅ Mailchimp tag: `30-Day-Unshakable-Guide` only

### Test 3: Ebook Purchase (Digital Only)

**Purpose:** Test ebook delivery without physical fulfillment

**Steps:**
1. Add an ebook to cart (select "Ebook" format)
2. Complete checkout

**Expected Results:**
- ✅ Payment processed
- ✅ NO ShipStation order (digital only)
- ✅ Mailchimp automation with appropriate bonus tag
- ✅ Customer receives ebook delivery email (if configured in Stripe)

### Test 4: Recommendation Products (10% Discount)

**Purpose:** Test add-on discount logic

**Steps:**
1. Add Unshakable Bundle to cart ($30.00)
2. Scroll down to recommendations
3. Add "Prayer Saturated Church" to cart ($17.99)
4. Check cart

**Expected Results:**
- ✅ Subtotal: $47.99
- ✅ Discount: -$4.80 (10% off)
- ✅ Final total: $43.19 (before shipping)
- ✅ Free shipping message shows (over $100 threshold: NO)

### Test 5: Free Shipping Threshold

**Purpose:** Test $100+ free shipping

**Steps:**
1. Add items totaling over $100
2. Example:
   - Bundle: $30.00
   - Prayer Saturated Church: $17.99
   - Prayer Saturated Family: $17.99
   - Prayer Saturated Kids: $13.99
   - Reclaim a Generation: $10.79
   - Two Nations One Prayer: $10.99
   - **Subtotal:** $101.75
3. With 10% discount: $91.58 (doesn't qualify)
4. Try without discount: Add one more book to hit $100 after discount

**Expected Results:**
- ✅ "FREE SHIPPING" badge shows when subtotal ≥ $100
- ✅ Shipping shows as $0 in Stripe checkout

### Test 6: Spanish Products

**Purpose:** Test language selection and fulfillment

**Steps:**
1. Select Spanish language on bundle page
2. Add to cart
3. Complete checkout

**Expected Results:**
- ✅ Cart shows "Español" language badge
- ✅ Correct Spanish product Price ID used
- ✅ ShipStation order shows correct Spanish SKU

## Monitoring & Debugging

### Check Stripe Dashboard
1. Go to: https://dashboard.stripe.com/payments
2. View recent payment
3. Check metadata includes cart details
4. Verify correct amounts charged

### Check Cloudflare Worker Logs
1. Go to: https://dash.cloudflare.com/
2. Navigate to: Workers & Pages → unshakable-families-checkout
3. Click on "Logs" (Real-time Logs)
4. Trigger a test purchase
5. Watch for:
   - "Order completed: cs_test_..." or "cs_live_..."
   - "ShipStation order created: [orderId]"
   - "Mailchimp automation triggered for: [email]"
   - Any error messages

### Check ShipStation
1. Go to your ShipStation dashboard
2. Navigate to Orders → Awaiting Shipment
3. Verify order details:
   - Customer name and email
   - Shipping address
   - Products (SKUs should match product IDs)
   - Order total

### Check Mailchimp
1. Go to: https://mailchimp.com/
2. Navigate to: Audience → All contacts
3. Search for test email address
4. Verify:
   - Contact was added/updated
   - Tags applied correctly
   - Automation journey triggered

## Troubleshooting

### Issue: Checkout button does nothing
**Cause:** JavaScript error or missing Price ID
**Fix:** Check browser console for errors

### Issue: "Failed to create checkout session"
**Cause:** Worker can't reach Stripe API or invalid Price ID
**Fix:**
- Check Cloudflare Worker logs
- Verify STRIPE_SECRET_KEY is set correctly
- Verify Price IDs exist in Stripe

### Issue: Payment succeeds but no ShipStation order
**Cause:** ShipStation API credentials incorrect or cart metadata missing
**Fix:**
- Check Worker logs for ShipStation errors
- Verify SHIPSTATION_API_KEY and SHIPSTATION_API_SECRET
- Check that cart has physical products (type: 'bundle' or 'paperback')

### Issue: Payment succeeds but no Mailchimp subscriber
**Cause:** Mailchimp API error or missing List ID
**Fix:**
- Check Worker logs for Mailchimp errors
- Verify MAILCHIMP_LIST_ID is correct
- Check Mailchimp API key has proper permissions

### Issue: Webhook not triggering automation
**Cause:** Webhook signature mismatch or event not received
**Fix:**
- Check Stripe Dashboard → Webhooks → [Your webhook] → Recent events
- Verify events are being sent successfully
- Check Worker logs to see if webhook was received

## Success Criteria

Your checkout is working correctly if:

1. ✅ Customer can add products to cart
2. ✅ Cart calculates totals correctly (including discounts and savings)
3. ✅ Checkout session creates successfully
4. ✅ Customer can complete payment in Stripe
5. ✅ Payment appears in Stripe Dashboard
6. ✅ Webhook receives `checkout.session.completed` event
7. ✅ Physical orders appear in ShipStation
8. ✅ Customers are added to Mailchimp with correct tags
9. ✅ No errors in Cloudflare Worker logs

## Next Steps After Testing

Once all tests pass:

1. **Configure Mailchimp Automation:**
   - Create automation journey in Mailchimp
   - Trigger: Tag added (`30-Day-Unshakable-Guide` or `10-Day-Prayer-Guide`)
   - Action: Send email with PDF download links

2. **Set up success page:**
   - Create `success.html` with order confirmation
   - Thank you message
   - Next steps (watch for email with bonuses)
   - Contact information

3. **Update Stripe settings:**
   - Add custom branding
   - Configure email receipts
   - Set up tax collection (if needed)

4. **Production checklist:**
   - Switch from test mode to live mode in Stripe
   - Use real credit card for final test
   - Monitor first few real orders closely

## Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Stripe Docs:** https://stripe.com/docs/payments/checkout
- **Cloudflare Workers:** https://dash.cloudflare.com/
- **ShipStation:** https://ship.shipstation.com/
- **Mailchimp:** https://mailchimp.com/

---

**Live Site:** https://unshakable-families-site.pages.dev
**Checkout Worker:** https://unshakable-families-checkout.bridgebuilders.workers.dev
**Test Card:** 4242 4242 4242 4242 (any future date, any CVC)
