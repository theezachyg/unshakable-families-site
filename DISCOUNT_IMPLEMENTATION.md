# 10% Discount Implementation

## Overview

Implemented automatic 10% discount in Stripe checkout when customers add recommendation items to their cart.

## How It Works

### Frontend (cart.html)
1. Cart detects if any recommendation items are present
2. Calculates and displays 10% discount in cart summary
3. Passes `hasRecommendation: true` flag to Worker API

### Backend (cloudflare-worker.js)
1. Worker receives `hasRecommendation` flag from cart
2. If `true`, calls `ensureCoupon()` function
3. `ensureCoupon()` checks if coupon `addon_discount_10` exists in Stripe
4. If coupon doesn't exist, creates it (10% off, one-time use)
5. Applies coupon to Stripe checkout session via `discounts[0][coupon]` parameter

## Stripe Coupon Details

- **ID:** `addon_discount_10`
- **Discount:** 10% off
- **Duration:** Once (applies to single transaction)
- **Name:** "10% Add-On Discount"
- **Created:** Automatically on first use

## Code Changes

### cart.html Line ~1104
```javascript
// Check if cart has recommendations for 10% discount
const hasRecommendation = cart.some(item => PRODUCT_DETAILS[item.id].isRecommendation);

// Pass to Worker
body: JSON.stringify({
    lineItems: lineItems,
    cart: cart,
    hasRecommendation: hasRecommendation
})
```

### cloudflare-worker.js Line ~87-91
```javascript
// Create or get 10% discount coupon if needed
let couponId = null;
if (hasRecommendation) {
    couponId = await ensureCoupon(env);
}
```

### cloudflare-worker.js Line ~120-122
```javascript
// Apply 10% discount coupon if customer added recommendation items
if (couponId) {
    params.append('discounts[0][coupon]', couponId);
}
```

### cloudflare-worker.js Line ~76-117
```javascript
// New function to ensure coupon exists
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
        return couponId;
    }

    // Create coupon if it doesn't exist
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

    if (!createCoupon.ok) {
        console.error('Failed to create coupon');
        return null; // Checkout proceeds without discount
    }

    return couponId;
}
```

## Testing

### Test Scenario 1: Cart with Recommendation
1. Add any main product (Bundle, Unshakable, or Fire)
2. Add any recommendation book
3. Verify 10% discount shows in cart
4. Click "Proceed to Checkout"
5. **Expected:** Stripe checkout shows 10% discount applied

### Test Scenario 2: Cart without Recommendation
1. Add only main products (no recommendations)
2. Verify no discount shown in cart
3. Click "Proceed to Checkout"
4. **Expected:** Stripe checkout shows regular prices (no discount)

### Test Scenario 3: Multiple Recommendations
1. Add Bundle + multiple recommendation books
2. Verify 10% discount calculated on entire cart
3. **Expected:** 10% off total (including all items)

## Deployment

### Cloudflare Worker ✅
- **Version:** f67a55d4-595d-4f4a-b1e8-8e289efa2cbe
- **Deployed:** Just now
- **Status:** Live

### Cloudflare Pages ⏳
- **Commit:** 7c47001
- **Status:** Deploying (wait ~1-2 minutes)
- **Action:** Automatic deployment triggered by git push

## Verification

Once Pages deployment completes (~1-2 minutes):

1. **Refresh site:** https://unshakable-families-site.pages.dev
2. **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Add items to cart:**
   - Bundle ($30.00)
   - Prayer Saturated Church ($17.99)
   - **Cart Total:** $47.99
   - **10% Discount:** -$4.80
   - **Final Total:** $43.19

4. **Checkout:**
   - Click "Proceed to Checkout"
   - Verify Stripe shows: Subtotal $47.99, Discount -$4.80, Total $43.19

5. **Browser Console:**
   - Open F12 console
   - Should see: "hasRecommendation: true"
   - Worker will create coupon on first use (one-time setup)

## Stripe Dashboard

After first checkout with discount:
1. Go to: https://dashboard.stripe.com/coupons
2. Find coupon: `addon_discount_10`
3. Verify: 10% off, duration: once
4. Check usage count (increments with each use)

## Troubleshooting

### Discount not showing in Stripe checkout
- **Check:** Browser console for "hasRecommendation: true"
- **Check:** Worker logs for "ensureCoupon" calls
- **Check:** Stripe Dashboard → Coupons for `addon_discount_10`

### Coupon creation fails
- **Issue:** Worker logs show coupon creation error
- **Fix:** Check Stripe secret key has permissions
- **Fallback:** Checkout continues without discount (customer not blocked)

### Discount amount incorrect
- **Check:** Cart calculation in cart.html line ~898-900
- **Formula:** `discount = subtotal * 0.10`
- **Verify:** All item prices are correct

## Benefits

1. **Automatic:** No manual coupon codes needed
2. **Seamless:** Discount shown in cart and Stripe checkout
3. **Flexible:** Works with any combination of recommendation items
4. **Error-tolerant:** If coupon fails, checkout still works (just without discount)
5. **Reusable:** Coupon created once, used for all future orders

## Future Enhancements

Potential improvements:
- Different discount tiers (15% for 2+ recommendations)
- Time-limited discounts
- Customer-specific discounts
- Bundle-specific promotions
- Seasonal sale logic

---

**Implementation Complete!** ✅
Wait 1-2 minutes for deployment, then test the checkout flow with recommendation items.
