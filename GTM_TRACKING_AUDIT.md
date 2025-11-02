# Google Tag Manager Tracking Audit

**GTM Container**: GTM-PLXHCM4T
**Audit Date**: 2025-10-31

---

## ✅ What We're Currently Tracking

### 1. **unshakable_landing_page.html**
- ✅ GTM Container installed
- ✅ `add_to_cart` event (with ecommerce data)
- ✅ `utm_capture` event (UTM parameters)
- ✅ `page_view` event (with UTM data)

### 2. **fire_on_family_altar_landing_page.html**
- ✅ GTM Container installed
- ✅ `add_to_cart` event (with ecommerce data)
- ✅ `utm_capture` event (UTM parameters)
- ✅ `page_view` event (with UTM data)

### 3. **unshakable_bundle_landing_page_v2.html**
- ✅ GTM Container installed
- ✅ `add_to_cart` event for "Just Unshakable" (with ecommerce data)
- ✅ `add_to_cart` event for "Full Bundle" (with ecommerce data)

### 4. **cart.html**
- ✅ GTM Container installed
- ✅ `begin_checkout` event (with ecommerce data)

### 5. **success.html**
- ✅ GTM Container installed
- ✅ `purchase` event (with full ecommerce data, transaction ID, value, items)

---

## ❌ What We're NOT Tracking (Missing Events)

### Landing Pages (All)
- ❌ **View Item** - When page loads (view_item event)
- ❌ **Scroll Depth** - 25%, 50%, 75%, 100% scroll
- ❌ **Video Plays** - When users play intro videos
- ❌ **Chapter Preview Clicks** - "Read First Chapter" button clicks
- ❌ **Bulk Order Inquiry** - Email clicks for bulk orders
- ❌ **Author Contact** - "Contact Cheryl" / "Book Cheryl to Speak" clicks
- ❌ **Social Media Clicks** - Facebook, Instagram, Twitter, LinkedIn
- ❌ **Testimonial Interaction** - Could track which testimonials users see
- ❌ **Format Changes** - When users switch between Paperback/Ebook
- ❌ **Language Changes** - When users switch between English/Spanish
- ❌ **Bundle Upgrade Clicks** - "View Bundle Offer" / "Save with Bundle"

### unshakable_bundle_landing_page_v2.html
- ❌ **UTM Tracking** - No UTM capture like other landing pages
- ❌ **Page View Event** - No enhanced page view tracking

### cart.html
- ❌ **View Cart** - Page load event
- ❌ **Remove from Cart** - When items removed
- ❌ **Quantity Changes** - When quantities updated
- ❌ **Apply Coupon** - If you add coupon functionality
- ❌ **Shipping Method Selection** - Which shipping speed chosen
- ❌ **Continue Shopping** - Back button clicks
- ❌ **Cart Abandonment Timer** - Time spent on cart page

### success.html
- ❌ **Social Shares** - Facebook, Twitter, Email share buttons
- ❌ **Email Bonus Link Clicks** - Future: if you add direct download links
- ❌ **Back to Home** - Navigation clicks

### Chapter Preview Pages (fire_chapter_preview.html, unshakable_chapter_preview.html)
- ❌ **NO GTM AT ALL** - These pages have no tracking whatsoever
- ❌ Form submissions (lead capture)
- ❌ Page views
- ❌ Download button clicks
- ❌ Read time

### index.html
- ❌ **NO GTM AT ALL** - No tracking

---

## 🎯 Priority Tracking to Add

### **HIGH PRIORITY** (Add These First)

1. **view_item** on all product landing pages
   - Tracks product impressions
   - Helps understand which products get most attention
   - Required for full ecommerce funnel in GA4

2. **Chapter Preview Pages** - Add GTM container + events
   - Page view
   - Form submission (lead capture)
   - These are lead generation tools, critical to track

3. **Bundle Page UTM Tracking**
   - Add same UTM capture as other landing pages
   - Critical for ad attribution

4. **Video Play Tracking**
   - Track when users engage with video content
   - Shows content effectiveness

5. **Format/Language Selection**
   - Understand customer preferences
   - Optimize inventory/production

### **MEDIUM PRIORITY**

6. **Button Click Tracking**
   - "Read Chapter", "Contact Author", "Book to Speak"
   - Shows user intent and engagement

7. **Cart Actions**
   - Remove from cart
   - Quantity changes
   - Helps understand cart optimization opportunities

8. **Social Share Tracking** (success page)
   - Measures word-of-mouth marketing
   - Tracks organic reach

9. **Scroll Depth**
   - Understand how far users read
   - Optimize content placement

### **LOW PRIORITY**

10. **Social Media Outbound Clicks**
    - Track which social platforms drive engagement

11. **Bulk Order Inquiries**
    - Measure B2B interest

---

## 📊 Recommended Enhanced Ecommerce Flow

For complete Google Ads conversion optimization, implement this flow:

```
1. view_item (Product Page Load)
   ↓
2. add_to_cart (Add to Cart Click)
   ↓
3. view_cart (Cart Page Load) ← Missing
   ↓
4. begin_checkout (Proceed to Checkout) ← Have this
   ↓
5. add_payment_info (Stripe Form) ← Hard to track, optional
   ↓
6. purchase (Success Page) ← Have this
```

Currently have: **3 of 6 steps** (50%)
Adding view_item + view_cart would give us: **5 of 6 steps** (83%)

---

## 🔧 Implementation Recommendations

### Phase 1: Critical Fixes (Do Now)
1. Add GTM to chapter preview pages
2. Add UTM tracking to bundle page
3. Add view_item events to all product pages
4. Add view_cart event to cart page

### Phase 2: Enhanced Tracking (Next Week)
5. Add video play tracking
6. Add format/language selection tracking
7. Add chapter preview click tracking
8. Add cart modification tracking

### Phase 3: Optimization (Later)
9. Add scroll depth tracking
10. Add social share tracking
11. Add button click tracking for all CTAs

---

## 📋 Technical Implementation Notes

### For view_item Event
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
        currency: 'USD',
        value: 17.99, // or dynamic based on selection
        items: [{
            item_id: 'prod_xxx',
            item_name: 'Unshakable Paperback (English)',
            item_category: 'Paperback',
            item_category2: 'English',
            price: 17.99,
            quantity: 1
        }]
    }
});
```

### For Button Clicks
```javascript
window.dataLayer.push({
    event: 'button_click',
    button_name: 'read_chapter',
    button_location: 'hero_section',
    product_name: 'Unshakable'
});
```

### For Video Plays
```javascript
window.dataLayer.push({
    event: 'video_play',
    video_title: 'Cheryl Sacks Message',
    video_url: 'vimeo.com/xxxxx',
    page_location: window.location.href
});
```

---

## 🎯 Expected Impact

### With Current Tracking:
- Can track: Purchases, add to cart
- **Can't optimize for**: Product views, cart abandonment, lead generation

### With Recommended Tracking:
- Full ecommerce funnel visibility
- Better Google Ads optimization (more conversion signals)
- Lead generation tracking
- Content engagement metrics
- Ability to create remarketing audiences at each funnel stage

---

## Next Steps

1. Review this audit
2. Prioritize which events to add first
3. Implement Phase 1 (critical fixes)
4. Test in GTM Preview mode
5. Verify data flowing to GA4
6. Set up Google Ads conversion tracking based on these events
