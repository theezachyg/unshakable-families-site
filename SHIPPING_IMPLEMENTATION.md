# Shipping Calculation Implementation

## Overview

Implemented intelligent shipping calculation that:
- Automatically offers free shipping for orders $100+
- Charges standard shipping ($5.99) for orders under $100
- Skips shipping entirely for digital-only orders (ebooks)
- Shows delivery estimates in Stripe checkout

## Shipping Rules

### 1. Digital-Only Orders (Ebooks)
- **Shipping:** Not required
- **Behavior:** No shipping address collection
- **Example:** Customer buys only Unshakable Ebook
- **Result:** Goes straight to payment (no shipping form)

### 2. Physical Orders Under $100
- **Shipping:** $5.99 standard shipping
- **Delivery:** 5-7 business days
- **Countries:** US and Canada
- **Example:** Customer buys 1 book ($17.99)
- **Result:** $5.99 shipping added at checkout

### 3. Physical Orders $100+
- **Shipping:** FREE
- **Delivery:** 5-7 business days
- **Countries:** US and Canada
- **Example:** Customer buys Bundle + 4 recommendations ($101)
- **Result:** Free shipping automatically applied

## How It Works

### Frontend (cart.html)

**Calculates:**
1. Cart subtotal
2. 10% discount (if applicable)
3. Final cart total
4. Whether cart has physical products

**Sends to Worker:**
```javascript
{
    lineItems: [...],
    cart: [...],
    hasRecommendation: true/false,
    cartTotal: 43.19,
    hasPhysicalProducts: true/false
}
```

### Backend (cloudflare-worker.js)

**Logic:**
```javascript
const FREE_SHIPPING_THRESHOLD = 100;
const qualifiesForFreeShipping = cartTotal >= 100;

if (hasPhysicalProducts) {
    // Collect shipping address
    if (qualifiesForFreeShipping) {
        // Show only free shipping option
    } else {
        // Show $5.99 standard shipping
    }
} else {
    // Digital only - skip shipping entirely
}
```

## Stripe Checkout Behavior

### Scenario 1: Physical Order Under $100
**Cart:**
- Unshakable Paperback: $17.99

**Stripe Checkout Shows:**
```
Subtotal:           $17.99
Shipping:           $5.99
Total:              $23.98
```

### Scenario 2: Physical Order Over $100
**Cart:**
- Bundle: $30.00
- Prayer Saturated Church: $17.99
- Prayer Saturated Family: $17.99
- Prayer Saturated Kids: $13.99
- Reclaim a Generation: $10.79
- **Subtotal:** $90.76
- **10% Discount:** -$9.08
- **Total:** $81.68

**Oops! After discount, under $100:**
```
Subtotal:           $90.76
Discount:           -$9.08
Shipping:           $5.99
Total:              $87.67
```

### Scenario 3: Physical Order Qualifying for Free Shipping
**Cart:**
- Bundle: $30.00
- 5 Recommendation books: $70.76
- **Subtotal:** $100.76
- **10% Discount:** -$10.08
- **Total After Discount:** $90.68

**Still under $100 after discount:**
```
Subtotal:           $100.76
Discount:           -$10.08
Shipping:           $5.99
Total:              $96.67
```

**To qualify for free shipping with 10% discount:**
- Cart must total $111+ before discount
- After 10% discount = $99.90 → Still need $5.99 shipping
- Need $112+ before discount → $100.80 after → Free shipping

### Scenario 4: Digital Only Order
**Cart:**
- Unshakable Ebook: $9.99
- Fire Ebook: $9.99

**Stripe Checkout Shows:**
```
Total:              $19.98
(No shipping section at all)
```

## Code Changes

### cart.html Line ~1106-1134
```javascript
// Calculate cart details for shipping
const subtotal = cart.reduce((sum, item) => {
    const product = PRODUCT_DETAILS[item.id];
    return sum + (product.price * item.quantity);
}, 0);

const discount = hasRecommendation ? subtotal * 0.10 : 0;
const cartTotal = subtotal - discount;

// Check if cart has physical products
const hasPhysicalProducts = cart.some(item => {
    const product = PRODUCT_DETAILS[item.id];
    return product.type === 'bundle' || product.type === 'paperback';
});

// Send to Worker
body: JSON.stringify({
    lineItems: lineItems,
    cart: cart,
    hasRecommendation: hasRecommendation,
    cartTotal: cartTotal,
    hasPhysicalProducts: hasPhysicalProducts
})
```

### cloudflare-worker.js Line ~136-178
```javascript
// Determine shipping options based on cart
const FREE_SHIPPING_THRESHOLD = 100;
const qualifiesForFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;

// Only collect shipping address if there are physical products
if (hasPhysicalProducts) {
    params.append('shipping_address_collection[allowed_countries][]', 'US');
    params.append('shipping_address_collection[allowed_countries][]', 'CA');

    // Add shipping options
    if (qualifiesForFreeShipping) {
        // Free shipping only
        params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
        params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '0');
        params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
        params.append('shipping_options[0][shipping_rate_data][display_name]', 'Free Shipping');
    } else {
        // Standard shipping rates
        params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
        params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '599'); // $5.99
        params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'usd');
        params.append('shipping_options[0][shipping_rate_data][display_name]', 'Standard Shipping');
        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '5');
        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
        params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '7');
    }
}
```

## Configuration

### Current Settings
- **Free Shipping Threshold:** $100 (after discounts)
- **Standard Shipping Rate:** $5.99
- **Delivery Time:** 5-7 business days
- **Supported Countries:** US, Canada

### To Change Settings

**Change free shipping threshold:**
```javascript
// In cloudflare-worker.js line ~137
const FREE_SHIPPING_THRESHOLD = 150; // New threshold
```

**Change shipping rate:**
```javascript
// In cloudflare-worker.js line ~171
params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '799'); // $7.99
```

**Add express shipping option:**
```javascript
// After standard shipping option
params.append('shipping_options[1][shipping_rate_data][type]', 'fixed_amount');
params.append('shipping_options[1][shipping_rate_data][fixed_amount][amount]', '1299'); // $12.99
params.append('shipping_options[1][shipping_rate_data][fixed_amount][currency]', 'usd');
params.append('shipping_options[1][shipping_rate_data][display_name]', 'Express Shipping (2-3 days)');
params.append('shipping_options[1][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
params.append('shipping_options[1][shipping_rate_data][delivery_estimate][minimum][value]', '2');
params.append('shipping_options[1][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
params.append('shipping_options[1][shipping_rate_data][delivery_estimate][maximum][value]', '3');
```

## Testing

### Test Case 1: Free Shipping Qualification
1. Add items totaling $100+ (after discount)
2. Proceed to checkout
3. **Expected:** Stripe shows "Free Shipping" only

### Test Case 2: Standard Shipping
1. Add single book ($17.99)
2. Proceed to checkout
3. **Expected:** Stripe shows "$5.99 Standard Shipping (5-7 business days)"

### Test Case 3: Digital Only
1. Add only ebooks
2. Proceed to checkout
3. **Expected:** No shipping address form, goes straight to payment

### Test Case 4: Discount Impact on Shipping
1. Add items totaling $105 before discount
2. Add recommendation (applies 10% discount)
3. New total: $94.50 (under $100)
4. **Expected:** $5.99 shipping charged

## Important Notes

### Free Shipping Calculation
- Free shipping is based on **cart total AFTER discounts**
- If 10% discount brings total below $100, shipping is charged
- To guarantee free shipping with discount, cart must be $111+ before discount

### Digital vs Physical
- Shipping is ONLY charged for physical products
- Ebooks never incur shipping
- Mixed carts (physical + digital) still get charged shipping

### International Shipping
- Currently only US and Canada supported
- To add more countries, add to `shipping_address_collection[allowed_countries][]`
- Consider different rates for international shipping

## Deployment

### Cloudflare Worker ✅
- **Version:** 25ca0faf-cbd4-4be1-9582-5ea080c3372f
- **Deployed:** Just now
- **Status:** Live

### Cloudflare Pages ⏳
- **Commit:** 573613d
- **Status:** Deploying (~1-2 minutes)
- **Expected:** Live soon

## Verification

Wait 1-2 minutes for Pages deployment, then:

1. **Test Under $100:**
   - Add 1 book to cart
   - Checkout
   - Verify $5.99 shipping

2. **Test Over $100:**
   - Add $100+ worth of items
   - Checkout
   - Verify free shipping

3. **Test Digital:**
   - Add only ebooks
   - Checkout
   - Verify no shipping form

4. **Check Browser Console:**
   - Should see: "cartTotal: XX.XX, hasPhysicalProducts: true/false"

## Future Enhancements

Potential improvements:
- Different rates for different countries
- Weight-based shipping calculation
- Express/expedited shipping options
- Real-time carrier rates (USPS, UPS, FedEx)
- Flat rate per item vs per order
- Free shipping for specific products only

---

**Implementation Complete!** ✅
Shipping is now calculated dynamically based on cart contents and total.
