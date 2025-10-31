# Unshakable Families Store - Complete Setup Guide

## 📦 What's Included

### Landing Pages
1. **unshakable_bundle_landing_page_v2.html** - Main bundle offer page
2. **cart.html** - Shopping cart with Stripe integration
3. **success.html** - Order confirmation/thank you page

### Backend
- **cloudflare-worker.js** - Complete backend for payment processing, shipping, and bonus delivery

## 🚀 Quick Start Checklist

- [ ] Create Stripe Price IDs
- [ ] Deploy Cloudflare Worker
- [ ] Configure Stripe Webhooks
- [ ] Set up Mailchimp Automation
- [ ] Connect ShipStation
- [ ] Update domain URLs
- [ ] Test with Stripe test mode
- [ ] Go live!

---

## STEP 1: Stripe Setup

### A. Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Create a product for each SKU:

**Bundle Products:**
- Unshakable Families Bundle (English) - $30.00
- Unshakable Families Bundle (Español) - $30.00

**Individual Book Products:**
- UNSHAKABLE Paperback (English) - $17.99
- UNSHAKABLE Paperback (Español) - $17.99
- UNSHAKABLE Ebook (English) - $9.99
- UNSHAKABLE Ebook (Español) - $9.99
- Fire on the Family Altar Paperback (English) - $17.99
- Fire on the Family Altar Paperback (Español) - $17.99
- Fire on the Family Altar Ebook (English) - $9.99
- Fire on the Family Altar Ebook (Español) - $9.99

### B. Get Price IDs

After creating each product, Stripe assigns a Price ID (format: `price_xxxxxx`).

**Copy these Price IDs - you'll need them in Step 3!**

### C. Enable Payment Methods

1. Dashboard > Settings > Payment methods
2. Enable: Cards, Apple Pay, Google Pay
3. Configure shipping rates (or use free shipping)

---

## STEP 2: Cloudflare Workers Setup

### A. Install Wrangler CLI

```bash
npm install -g wrangler
```

### B. Login to Cloudflare

```bash
wrangler login
```

### C. Create Worker

```bash
wrangler init unshakable-store
cd unshakable-store
```

### D. Copy Worker Code

1. Copy the contents of `cloudflare-worker.js` to `src/index.js`
2. Update `wrangler.toml`:

```toml
name = "unshakable-store"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
SITE_URL = "https://yourdomain.com"
```

### E. Deploy Worker

```bash
wrangler deploy
```

**Your worker URL will be:** `https://unshakable-store.YOUR-SUBDOMAIN.workers.dev`

---

## STEP 3: Update Configuration

### A. Update Worker with Price IDs

In `cloudflare-worker.js`, update the `PRICE_IDS` object with your actual Stripe Price IDs:

```javascript
const PRICE_IDS = {
    'prod_TKMYdi0tJ8PihI': 'price_YOUR_ACTUAL_PRICE_ID',
    'prod_TKMZUqoZ3N0UqW': 'price_YOUR_ACTUAL_PRICE_ID',
    // ... update all of them
};
```

### B. Set Environment Variables

In Cloudflare Dashboard > Workers > unshakable-store > Settings > Variables:

**Add these as ENCRYPTED variables:**

```
STRIPE_SECRET_KEY = sk_live_...
SHIPSTATION_API_KEY = your_key
SHIPSTATION_API_SECRET = your_secret
MAILCHIMP_API_KEY = your_key
MAILCHIMP_SERVER_PREFIX = us1  (or your prefix)
MAILCHIMP_LIST_ID = your_list_id
```

### C. Update Frontend URLs

In all HTML files, replace:
- `https://yourdomain.com` → Your actual domain
- `/api/create-checkout-session` → `https://unshakable-store.YOUR-SUBDOMAIN.workers.dev/api/create-checkout-session`

---

## STEP 4: Stripe Webhook Configuration

### A. Add Webhook Endpoint

1. Stripe Dashboard > Developers > Webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://unshakable-store.YOUR-SUBDOMAIN.workers.dev/api/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
5. Add endpoint

### B. Get Webhook Secret

Copy the webhook signing secret (starts with `whsec_`)

### C. Add to Worker Environment

Add as encrypted variable:
```
STRIPE_WEBHOOK_SECRET = whsec_...
```

---

## STEP 5: Mailchimp Automation Setup

### A. Create Automation for Unshakable Bonus

1. Mailchimp > Automations > Create
2. Trigger: "When tag is added"
3. Tag: `30-Day-Unshakable-Guide`
4. Email: Send with download link to 30-Day Guide PDF
5. Subject: "Your FREE 30-Day Unshakable Action Guide 🎁"

### B. Create Automation for Fire Bonus

1. Create another automation
2. Trigger: Tag `10-Day-Prayer-Guide`
3. Email: Send with download link to 10-Day Prayer Guide PDF
4. Subject: "Your FREE 10-Day Family Prayer Guide 🔥"

### C. Upload Bonus Files

Upload your bonus PDFs to Mailchimp:
- Files > Upload
- Get download links
- Use in automation emails

---

## STEP 6: ShipStation Setup

### A. Get API Credentials

1. ShipStation > Settings > API Settings
2. Generate API Key and Secret
3. Copy to Worker environment variables

### B. Configure Products

1. ShipStation > Products
2. Add each product with matching SKU (product ID from Stripe)

### C. Set Shipping Rules

1. Configure carriers (USPS, FedEx, etc.)
2. Set package dimensions and weights
3. Configure shipping rates

---

## STEP 7: Upload Files to Cloudflare Pages

### A. Create Pages Project

```bash
npx wrangler pages project create unshakable-store-frontend
```

### B. Deploy HTML Files

```bash
npx wrangler pages deploy ./dist \
  --project-name=unshakable-store-frontend
```

**Your site will be:** `https://unshakable-store-frontend.pages.dev`

### C. Add Custom Domain (Optional)

1. Cloudflare Dashboard > Pages > unshakable-store-frontend
2. Custom domains > Set up domain
3. Follow DNS instructions

---

## STEP 8: Testing

### A. Test Mode Testing

1. Use Stripe test keys (starts with `pk_test_` and `sk_test_`)
2. Test card: `4242 4242 4242 4242`
3. Any future expiry, any CVC

### B. Test Checklist

- [ ] Add to cart works
- [ ] Cart displays correctly
- [ ] Checkout redirects to Stripe
- [ ] Payment processes successfully
- [ ] Redirects to success page
- [ ] Order appears in ShipStation
- [ ] Mailchimp automation triggers
- [ ] Bonus emails received

### C. Common Issues

**Issue: "No Price ID found"**
- Check PRICE_IDS mapping in worker
- Verify Price IDs in Stripe Dashboard

**Issue: "Webhook verification failed"**
- Verify webhook secret is correct
- Check webhook is pointing to correct URL

**Issue: "ShipStation order not created"**
- Verify API credentials
- Check order has physical products
- Review worker logs

---

## STEP 9: Analytics Setup

### A. Google Analytics 4

Add to `<head>` of all pages:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### B. Facebook Pixel

```html
<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

### C. TikTok Pixel

```html
<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('YOUR_PIXEL_ID');
  ttq.page();
}(window, document, 'ttq');
</script>
```

---

## STEP 10: Go Live!

### A. Switch to Live Mode

1. Replace all test keys with live keys
2. Update Stripe webhook to use live mode
3. Test one more time with real card (refund immediately)

### B. Launch Checklist

- [ ] All live API keys configured
- [ ] Webhook pointing to production worker
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Analytics tracking verified
- [ ] Mailchimp automations active
- [ ] ShipStation ready to fulfill
- [ ] Test purchase completed successfully

### C. Monitor

- Stripe Dashboard - Monitor payments
- Cloudflare Analytics - Track traffic
- ShipStation - Fulfill orders
- Mailchimp - Monitor automation sends

---

## 📊 Maintenance & Monitoring

### Daily
- Check Stripe for new orders
- Monitor ShipStation for fulfillment
- Verify Mailchimp deliveries

### Weekly
- Review analytics data
- Check conversion rates
- Test cart functionality
- Monitor worker logs

### Monthly
- Review and optimize
- A/B test landing page elements
- Analyze customer feedback
- Update content as needed

---

## 🆘 Support Resources

### Stripe
- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

### Cloudflare
- Dashboard: https://dash.cloudflare.com
- Workers Docs: https://developers.cloudflare.com/workers
- Community: https://community.cloudflare.com

### ShipStation
- Dashboard: https://ship1.shipstation.com
- API Docs: https://www.shipstation.com/docs/api
- Support: https://help.shipstation.com

### Mailchimp
- Dashboard: https://mailchimp.com
- API Docs: https://mailchimp.com/developer
- Support: https://mailchimp.com/contact

---

## 🔒 Security Best Practices

1. **Never commit API keys to Git**
   - Use environment variables only
   - Add `.env` to `.gitignore`

2. **Use encrypted variables in Cloudflare**
   - All secrets should be encrypted
   - Never store in plain text

3. **Verify webhook signatures**
   - Always verify Stripe webhook signatures
   - Reject unverified requests

4. **HTTPS only**
   - Force SSL/TLS
   - No mixed content

5. **Regular updates**
   - Keep dependencies updated
   - Monitor security advisories

---

## 📈 Optimization Tips

### Conversion Rate Optimization
- Test different headline copy
- A/B test CTA button colors
- Optimize countdown timer urgency
- Add more social proof
- Test different price presentations

### Performance
- Optimize images (WebP format)
- Minimize JavaScript
- Use CDN for assets
- Enable Cloudflare caching

### SEO
- Add meta descriptions
- Use semantic HTML
- Optimize page speed
- Add structured data (JSON-LD)

---

## 🎯 Next Steps

After launch, consider adding:

1. **Upsells/Cross-sells**
   - Add related products to cart
   - Post-purchase email sequence

2. **Email Sequences**
   - Welcome series
   - Educational content
   - Re-engagement campaigns

3. **Affiliate Program**
   - Use Stripe for affiliate payments
   - Track with UTM parameters

4. **Customer Reviews**
   - Collect testimonials
   - Display on landing page

5. **Video Content**
   - Replace video placeholders
   - Add customer testimonial videos

---

## Need Help?

This system is ready to go! Just follow the steps above in order.

**Estimated setup time: 2-3 hours**

Most time will be spent:
- Creating Stripe products (30 min)
- Setting up Mailchimp automations (45 min)
- Testing everything (45 min)

Good luck with your launch! 🚀
