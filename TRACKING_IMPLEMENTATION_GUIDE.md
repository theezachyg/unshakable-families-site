# Comprehensive Tracking Implementation Guide

## 🎯 Universal Tracking Library Created

**File**: `tracking.js` - A comprehensive tracking library that automatically tracks:

### ✅ What It Tracks (Auto-Detected):

1. **Page Views** - Enhanced with UTM data
2. **Scroll Depth** - 25%, 50%, 75%, 100%
3. **Video Interactions**:
   - Play, pause, complete
   - Progress milestones (25%, 50%, 75%)
   - Works with Vimeo iframes

4. **Button Clicks** - All buttons and CTAs with smart name detection
5. **Social Media Clicks** - Facebook, Twitter, Instagram, LinkedIn
6. **Form Submissions** - All form submits
7. **Downloads** - PDF and file downloads
8. **Email Links** - mailto: clicks
9. **Outbound Links** - External site clicks
10. **Format/Language Selections** - Dropdown changes
11. **Time on Page** - 30s, 60s, 120s, 300s thresholds
12. **Element Visibility** - Sections coming into view
13. **External Links** - Tracks clicks to external domains

###Events Automatically Fired:

- `page_view`
- `scroll_depth`
- `video_start`, `video_pause`, `video_complete`, `video_progress`
- `button_click`
- `social_click`
- `form_submit`
- `file_download`
- `email_link_click`
- `outbound_click`
- `selection_change`
- `time_on_page`
- `element_visible`

---

## 📋 Implementation Checklist

### Phase 1: Add GTM + Basic Tracking to All Pages

#### Pages Needing GTM Container:

- [ ] **unshakable_chapter_preview.html** (STARTED - GTM added, needs tracking.js)
- [ ] **fire_chapter_preview.html** (NO GTM yet)
- [ ] **index.html** (NO GTM yet)

#### Pages That Have GTM (Need tracking.js):

- [ ] **unshakable_landing_page.html**
- [ ] **fire_on_family_altar_landing_page.html**
- [ ] **unshakable_bundle_landing_page_v2.html**
- [ ] **cart.html**
- [ ] **success.html**

### Phase 2: Add Page-Specific Ecommerce Events

Each page needs specific ecommerce tracking in addition to the universal library:

#### unshakable_landing_page.html
```javascript
// Add view_item event on page load
window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
        currency: 'USD',
        value: 17.99,
        items: [{
            item_id: document.getElementById('bookFormat').value === 'ebook' ? 'prod_TKMU12ym0FzbZM' : 'prod_TKMUdCfcPzrqrm',
            item_name: 'Unshakable',
            item_category: 'Book',
            price: document.getElementById('bookFormat').value === 'ebook' ? 9.99 : 17.99
        }]
    }
});
```

####  fire_on_family_altar_landing_page.html
```javascript
// Same as above, but for Fire on the Family Altar
window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
        currency: 'USD',
        value: 17.99,
        items: [{
            item_id: 'prod_TKMUdCfcPzrqrm',
            item_name: 'Fire on the Family Altar',
            item_category: 'Book',
            price: 17.99
        }]
    }
});
```

#### unshakable_bundle_landing_page_v2.html
```javascript
// Add view_item for bundle
window.dataLayer.push({
    event: 'view_item',
    ecommerce: {
        currency: 'USD',
        value: 29.99,
        items: [{
            item_id: 'prod_TKMVD62CefwOHo',
            item_name: 'Unshakable Family Bundle',
            item_category: 'Bundle',
            price: 29.99
        }]
    }
});

// Add UTM tracking (currently missing)
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        utm_content: urlParams.get('utm_content'),
        utm_term: urlParams.get('utm_term')
    };

    if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
        localStorage.setItem('utm_params', JSON.stringify(utmParams));
        window.dataLayer.push({
            event: 'utm_capture',
            ...utmParams,
            page_location: window.location.href
        });
    }
})();
```

#### cart.html
```javascript
// Add view_cart event on page load (currently missing)
const cart = JSON.parse(localStorage.getItem('unshakableCart')) || [];
if (cart.length > 0) {
    const total = cart.reduce((sum, item) => {
        const product = PRODUCT_DETAILS[item.id];
        return sum + (product.price * item.quantity);
    }, 0);

    window.dataLayer.push({
        event: 'view_cart',
        ecommerce: {
            currency: 'USD',
            value: total,
            items: cart.map(item => {
                const product = PRODUCT_DETAILS[item.id];
                return {
                    item_id: item.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: item.quantity
                };
            })
        }
    });
}

// Track remove from cart
function removeFromCart(index) {
    const removedItem = cart[index];
    const product = PRODUCT_DETAILS[removedItem.id];

    window.dataLayer.push({
        event: 'remove_from_cart',
        ecommerce: {
            currency: 'USD',
            value: product.price * removedItem.quantity,
            items: [{
                item_id: removedItem.id,
                item_name: product.name,
                price: product.price,
                quantity: removedItem.quantity
            }]
        }
    });

    // ... existing remove logic
}

// Track quantity changes
function updateQuantity(index, newQuantity) {
    const item = cart[index];
    const product = PRODUCT_DETAILS[item.id];
    const quantityDiff = newQuantity - item.quantity;

    if (quantityDiff > 0) {
        window.dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
                currency: 'USD',
                value: product.price * quantityDiff,
                items: [{
                    item_id: item.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: quantityDiff
                }]
            }
        });
    } else if (quantityDiff < 0) {
        window.dataLayer.push({
            event: 'remove_from_cart',
            ecommerce: {
                currency: 'USD',
                value: product.price * Math.abs(quantityDiff),
                items: [{
                    item_id: item.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: Math.abs(quantityDiff)
                }]
            }
        });
    }

    // ... existing quantity update logic
}
```

#### success.html
```javascript
// Track social shares (add to existing functions)
function shareOnFacebook() {
    window.dataLayer.push({
        event: 'share',
        share_method: 'facebook',
        content_type: 'order_confirmation',
        page_location: window.location.href
    });
    // ... existing code
}

function shareOnTwitter() {
    window.dataLayer.push({
        event: 'share',
        share_method: 'twitter',
        content_type: 'order_confirmation',
        page_location: window.location.href
    });
    // ... existing code
}

function shareViaEmail() {
    window.dataLayer.push({
        event: 'share',
        share_method: 'email',
        content_type: 'order_confirmation',
        page_location: window.location.href
    });
    // ... existing code
}
```

#### Chapter Preview Pages (both)
```javascript
// Track chapter view
window.dataLayer.push({
    event: 'view_chapter',
    chapter_number: 1,
    book_name: 'Unshakable', // or 'Fire on the Family Altar'
    page_location: window.location.href
});

// Track form submission (lead capture)
document.querySelector('form').addEventListener('submit', function(e) {
    const formData = new FormData(e.target);

    window.dataLayer.push({
        event: 'generate_lead',
        lead_type: 'chapter_preview',
        book_name: 'Unshakable', // or 'Fire on the Family Altar'
        form_data: {
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            email: formData.get('email'),
            country: formData.get('country')
        }
    });
});

// Track page turns (if using turn.js)
$('#flipbook').bind('turned', function(event, page, view) {
    window.dataLayer.push({
        event: 'chapter_page_turn',
        page_number: page,
        book_name: 'Unshakable',
        page_location: window.location.href
    });
});
```

---

## 🚀 Implementation Steps

### Step 1: Add to All HTML Files

Add before closing `</body>` tag:

```html
<!-- Universal GTM Tracking -->
<script src="tracking.js"></script>
```

### Step 2: Add GTM Container to Missing Pages

For `fire_chapter_preview.html` and `index.html`, add in `<head>`:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PLXHCM4T');</script>
<!-- End Google Tag Manager -->
```

And after opening `<body>` tag:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PLXHCM4T"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

### Step 3: Add Page-Specific Ecommerce Tracking

Add the specific tracking code from Phase 2 above to each page.

### Step 4: Test in GTM Preview Mode

1. Go to Google Tag Manager
2. Click "Preview"
3. Enter your site URL
4. Navigate through the funnel
5. Verify all events are firing

### Step 5: Publish GTM Container

Once tested, publish the container in GTM.

---

## 📊 Expected Tracking After Implementation

### Complete Ecommerce Funnel:

```
1. view_item (Landing Page) ← NEW
   ↓
2. add_to_cart (Add Button) ← HAVE
   ↓
3. view_cart (Cart Page) ← NEW
   ↓
4. begin_checkout (Checkout) ← HAVE
   ↓
5. purchase (Success) ← HAVE
```

**Coverage**: 100% (5 of 5 steps)

### Additional Tracking:

- ✅ UTM Attribution (all pages)
- ✅ Video Engagement (all videos)
- ✅ Button Clicks (all CTAs)
- ✅ Form Submissions (all forms)
- ✅ Social Sharing
- ✅ Scroll Depth
- ✅ Time on Page
- ✅ Format/Language Selection
- ✅ Lead Generation (chapter previews)
- ✅ Cart Modifications
- ✅ Outbound Links
- ✅ Downloads

### Total Events Being Tracked:

**Universal Events**: 13 types
**Ecommerce Events**: 5 types
**Custom Events**: 3 types

**TOTAL**: ~21 different event types across entire funnel

---

## 🎯 Benefits

### For Google Ads:
- Full funnel optimization
- Better audience building
- Smarter bidding (more conversion signals)
- Remarketing at each stage

### For Analytics:
- Complete user journey visibility
- Content engagement metrics
- Conversion funnel analysis
- Attribution modeling

### For Business:
- Understand what works
- Optimize content placement
- Improve conversion rates
- Track ROI accurately

---

## ⚠️ Important Notes

1. **Deploy tracking.js** to your Cloudflare Pages along with HTML files
2. **Test thoroughly** before publishing GTM container
3. **Check console** for tracking confirmation logs
4. **Verify in GA4** that events are coming through
5. **Set up conversions** in Google Ads based on these events

---

## Next Actions

1. Complete adding GTM to all pages
2. Add tracking.js script tag to all pages
3. Add page-specific ecommerce events
4. Test in GTM Preview mode
5. Verify in GA4 Real-Time reports
6. Set up Google Ads conversion tracking
7. Create remarketing audiences
8. Switch campaign to "Sales" goal

This implementation will give you **industry-leading tracking** for a book sales funnel!
