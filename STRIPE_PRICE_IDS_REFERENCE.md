# Stripe Price IDs - Quick Reference

## Instructions

1. Go to https://dashboard.stripe.com/products
2. Click "Add product" for each item below
3. Copy the Price ID (starts with `price_`) 
4. Update the `PRICE_IDS` object in cloudflare-worker.js

## Products to Create

### Bundle Products

**Product Name:** Unshakable Families Bundle (English)
- **Price:** $30.00
- **Product ID in system:** prod_TKMYdi0tJ8PihI
- **Description:** Both paperback books + FREE 30-Day Guide + FREE 10-Day Prayer Guide
- **Stripe Price ID:** ________________

**Product Name:** Unshakable Families Bundle (Español)
- **Price:** $30.00
- **Product ID in system:** prod_TKMZUqoZ3N0UqW
- **Description:** Ambos libros en edición física + Guías GRATIS
- **Stripe Price ID:** ________________

### UNSHAKABLE Products

**Product Name:** UNSHAKABLE Paperback (English)
- **Price:** $17.99
- **Product ID in system:** prod_TKMQIIUotITNZo
- **Description:** Physical book - English edition
- **Stripe Price ID:** ________________

**Product Name:** UNSHAKABLE Paperback (Español)
- **Price:** $17.99
- **Product ID in system:** prod_TKMSsIjIYBf5Ev
- **Description:** Libro físico - Edición en español
- **Stripe Price ID:** ________________

**Product Name:** UNSHAKABLE Ebook (English)
- **Price:** $9.99
- **Product ID in system:** prod_TKMTKRgsWddE83
- **Description:** Digital download - English edition
- **Stripe Price ID:** ________________

**Product Name:** UNSHAKABLE Ebook (Español)
- **Price:** $9.99
- **Product ID in system:** prod_TKMTfrTuMRr7c3
- **Description:** Descarga digital - Edición en español
- **Stripe Price ID:** ________________

### Fire on the Family Altar Products

**Product Name:** Fire on the Family Altar Paperback (English)
- **Price:** $17.99
- **Product ID in system:** prod_TKMUdCfcPzrqrm
- **Description:** Physical book - English edition
- **Stripe Price ID:** ________________

**Product Name:** Fire on the Family Altar Paperback (Español)
- **Price:** $17.99
- **Product ID in system:** prod_TKMUV9sItr20yy
- **Description:** Libro físico - Edición en español
- **Stripe Price ID:** ________________

**Product Name:** Fire on the Family Altar Ebook (English)
- **Price:** $9.99
- **Product ID in system:** prod_TKMU12ym0FzbZM
- **Description:** Digital download - English edition
- **Stripe Price ID:** ________________

**Product Name:** Fire on the Family Altar Ebook (Español)
- **Price:** $9.99
- **Product ID in system:** prod_TKMVhWKaAW2sZf
- **Description:** Descarga digital - Edición en español
- **Stripe Price ID:** ________________

## After Creating All Products

Update cloudflare-worker.js with your actual Price IDs:

```javascript
const PRICE_IDS = {
    'prod_TKMYdi0tJ8PihI': 'price_YOUR_ID_HERE',  // Bundle English
    'prod_TKMZUqoZ3N0UqW': 'price_YOUR_ID_HERE',  // Bundle Spanish
    'prod_TKMQIIUotITNZo': 'price_YOUR_ID_HERE',  // Unshakable PB EN
    'prod_TKMSsIjIYBf5Ev': 'price_YOUR_ID_HERE',  // Unshakable PB ES
    'prod_TKMTKRgsWddE83': 'price_YOUR_ID_HERE',  // Unshakable EB EN
    'prod_TKMTfrTuMRr7c3': 'price_YOUR_ID_HERE',  // Unshakable EB ES
    'prod_TKMUdCfcPzrqrm': 'price_YOUR_ID_HERE',  // Fire PB EN
    'prod_TKMUV9sItr20yy': 'price_YOUR_ID_HERE',  // Fire PB ES
    'prod_TKMU12ym0FzbZM': 'price_YOUR_ID_HERE',  // Fire EB EN
    'prod_TKMVhWKaAW2sZf': 'price_YOUR_ID_HERE'   // Fire EB ES
};
```

Also update in cart.html in the `PRODUCT_DETAILS` object - replace all `stripePriceId: 'price_XXXXX'` with your actual Price IDs.

## Pro Tips

1. **Use Test Mode First**
   - Create test products first
   - Test entire flow
   - Then create live products

2. **Product Metadata**
   - Add metadata tags in Stripe for easier tracking
   - Example: `type: bundle`, `language: english`

3. **Recurring vs One-time**
   - All prices should be "One-time" not "Recurring"

4. **Tax Settings**
   - Enable automatic tax calculation in Stripe if needed
   - Configure tax rates for your jurisdictions
