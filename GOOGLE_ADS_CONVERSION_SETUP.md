# Google Ads Conversion Tracking Setup Guide

**Campaign**: Book - Unshakable Hal Sacks
**Current Goal**: Traffic
**Target Goal**: Sales
**GTM Container**: GTM-PLXHCM4T

---

## Prerequisites ✅

Before setting up Google Ads conversions, ensure:

1. ✅ **GTM is installed** on all pages (already done)
2. ✅ **GA4 is connected** to GTM (already done)
3. ✅ **Purchase event is tracking** in GA4 (already implemented in success.html)
4. ✅ **Enhanced ecommerce events** are firing (view_item, add_to_cart, view_cart, begin_checkout, purchase)

---

## Step 1: Link Google Ads to Google Analytics 4

### 1.1 In Google Analytics 4:

1. Go to **Admin** (bottom left gear icon)
2. In the **Property** column, click **Google Ads Links**
3. Click **Link**
4. Select your Google Ads account: **2315720446** (or manager account **6101758647**)
5. Enable these settings:
   - ✅ Personalized advertising
   - ✅ Auto-tagging
6. Click **Submit**

### 1.2 Verify the Link:

1. Go back to **Google Ads Links**
2. Confirm status shows **"Linked"**

---

## Step 2: Import GA4 Conversions into Google Ads

### 2.1 In Google Ads (https://ads.google.com):

1. Click **Goals** in the left menu
2. Click **Conversions**
3. Click the blue **+ New conversion action** button
4. Select **Import**
5. Choose **Google Analytics 4 properties**
6. Click **Continue**

### 2.2 Select Events to Import:

Select these events from GA4:

**Primary Conversion (Required)**:
- ✅ **purchase** - When customer completes checkout

**Secondary Conversions (Highly Recommended)**:
- ✅ **generate_lead** - When someone submits chapter preview or contact form (for remarketing & lead gen campaigns)

**Tertiary Conversions (Optional)**:
- ✅ **begin_checkout** - When customer starts checkout process
- ✅ **add_to_cart** - When customer adds item to cart
- ✅ **view_item** - When customer views product page

7. Click **Import and Continue**

### 2.3 Configure Conversion Settings:

For the **purchase** conversion:

- **Goal**: Sales
- **Value**: Use transaction-specific value (from purchase event)
- **Count**: One (each conversion)
- **Conversion window**: 30 days
- **View-through conversion window**: 1 day
- **Attribution model**: Data-driven (recommended) or Last click

For the **generate_lead** conversion:

- **Goal**: Lead (Submit lead form)
- **Value**: Set a fixed value (e.g., $5.00 - estimated value of a lead)
- **Count**: One (each conversion)
- **Conversion window**: 30 days
- **View-through conversion window**: 1 day
- **Attribution model**: Data-driven (recommended) or Last click
- **Primary action for bidding**: Off (purchase is primary)

8. Click **Done**

---

## Step 3: Set Up Purchase Conversion as Primary Goal

### 3.1 Make Purchase the Primary Conversion:

1. In Google Ads, go to **Goals** > **Conversions**
2. Find the **purchase** conversion
3. Click the checkbox next to it
4. Click **Edit**
5. Set **Primary action for bidding** to **On**
6. All other conversions should be **Off** for primary action
7. Click **Save**

---

## Step 4: Change Campaign Goal from Traffic to Sales

### 4.1 Access Campaign Settings:

1. Go to **Campaigns** in left menu
2. Find campaign: **"Book - Unshakable Hal Sacks"**
3. Click on the campaign name

### 4.2 Change Goal:

1. Click **Settings** tab
2. Find **Goals** section
3. Click **Edit** next to Goals
4. Change from **Website traffic** to **Sales**
5. Select **Purchase** as the conversion action
6. Click **Save**

### 4.3 Update Bid Strategy (Important!):

Since you're changing to Sales goal, you should also update your bidding strategy:

**Option A - Maximize Conversions (Recommended for Start)**:
1. Go to **Settings** > **Bidding**
2. Click **Edit**
3. Select **Maximize conversions**
4. Set a **Target CPA** if you have a target cost per purchase (e.g., $20)
5. Click **Save**

**Option B - Target ROAS (After Collecting Data)**:
- Wait until you have at least 15-30 conversions in 30 days
- Then switch to **Target ROAS** (Return on Ad Spend)
- Set target like 300% (meaning $3 revenue for every $1 spent)

---

## Step 5: Verify Tracking is Working

### 5.1 Test Purchase Event:

1. Make a test purchase on your site
2. Wait 15-30 minutes
3. Go to Google Analytics 4:
   - **Reports** > **Realtime**
   - Look for **purchase** event
4. Go to Google Ads:
   - **Goals** > **Conversions**
   - Check if conversion appears (may take 3-6 hours)

### 5.2 Use GTM Preview Mode:

1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. Click on container **GTM-PLXHCM4T**
3. Click **Preview** button (top right)
4. Enter your site URL and click **Connect**
5. Complete a test purchase
6. In GTM Preview, verify these events fire:
   - `view_item` (on product page)
   - `add_to_cart` (when adding to cart)
   - `view_cart` (on cart page)
   - `begin_checkout` (when clicking checkout)
   - `purchase` (on success page)

---

## Step 6: Monitor & Optimize

### 6.1 Check Conversion Data Daily:

1. Go to **Campaigns** > **Book - Unshakable Hal Sacks**
2. Click **Columns** dropdown
3. Select **Modify columns**
4. Add these columns:
   - Conversions
   - Conv. value
   - Cost per conv.
   - Conv. rate
5. Monitor daily for first week

### 6.2 Optimization Tips:

**After 7 Days**:
- Review which keywords/ads drive purchases
- Pause low-performing keywords
- Increase budget for high-performers

**After 30 Days**:
- Check conversion rate (aim for 2-5%)
- Review cost per acquisition (should be profitable)
- Consider switching to Target ROAS bidding
- A/B test ad copy focused on benefits

**Ongoing**:
- Add negative keywords weekly
- Test new ad variations monthly
- Review search terms report weekly
- Adjust bids based on performance

---

## Troubleshooting

### Issue: Conversions Not Showing in Google Ads

**Solutions**:
1. Wait 3-6 hours (Google Ads updates with delay)
2. Check GA4 to confirm purchase events are firing
3. Verify Google Ads is linked to GA4 (Step 1)
4. Check conversion action is set to "Primary" (Step 3)

### Issue: Purchase Event Not Firing

**Solutions**:
1. Use GTM Preview mode to debug (Step 5.2)
2. Check browser console for JavaScript errors
3. Verify success.html includes GTM container
4. Check Cloudflare Worker is sending proper data

### Issue: Wrong Conversion Value

**Solutions**:
1. Check success.html purchase event includes correct `value` field
2. Verify currency is set to "USD"
3. Check Cloudflare Worker is calculating total correctly

---

## Additional Tracking Events Available

Beyond purchase, you now have tracking for:

**Ecommerce Funnel**:
- view_item, add_to_cart, view_cart, remove_from_cart, begin_checkout, add_shipping_info, purchase

**Engagement**:
- modal_open (contact, chapter_preview, free_chapter)
- chapter_page_turn, view_chapter
- **generate_lead** (chapter preview forms + contact forms on all product pages)
- share (facebook, twitter, email)
- scroll_depth, video_play, button_click

**Errors**:
- checkout_error, shipping_error

**Attribution**:
- utm_capture, page_view (with UTM data)

These can all be imported as secondary conversions to better understand your funnel!

---

## 💡 BONUS: Using generate_lead for Remarketing

The `generate_lead` conversion is incredibly powerful for building remarketing audiences:

### Create Remarketing Lists:

1. Go to **Tools & Settings** > **Audience Manager**
2. Click **+ Audience** > **Custom Audience**
3. Create these audience segments:

**Warm Leads Who Didn't Purchase**:
- Users who: `generate_lead` = true AND `purchase` = false
- Membership duration: 30 days
- **Use case**: Show them testimonials and urgency-based ads

**Chapter Readers**:
- Users who: `generate_lead` = true AND lead_source = "chapter_preview"
- Membership duration: 60 days
- **Use case**: Run campaigns specifically for people who engaged with content

**Contact Form Leads**:
- Users who: `generate_lead` = true AND lead_source = "contact_modal"
- Membership duration: 90 days
- **Use case**: High-intent leads - show them special offers

### Remarketing Campaign Strategy:

1. Create separate campaigns for each audience
2. Use lower bids (these are warm traffic)
3. Show social proof and testimonials
4. Add urgency (limited time offers)
5. Use brand messaging ("You showed interest in...")

**Expected Results**:
- 3-5x higher conversion rate vs cold traffic
- 50-70% lower cost per acquisition
- 20-30% of total revenue from remarketing

---

## Quick Reference

**Google Ads Account**: 2315720446
**Manager Account**: 6101758647
**GTM Container**: GTM-PLXHCM4T
**GA4 Property**: (Check in GA4 Admin > Property Settings)

**Campaign**: Book - Unshakable Hal Sacks
**Primary Conversion**: purchase
**Secondary Conversion**: generate_lead (for remarketing)
**Goal**: Sales

---

## Success Criteria

✅ **Week 1**: Purchase conversions showing in Google Ads
✅ **Week 2**: Cost per conversion is profitable
✅ **Week 4**: Conversion rate improves to 3%+
✅ **Month 2**: Switch to Target ROAS bidding
✅ **Month 3**: Scale budget while maintaining profitability

---

## Need Help?

- Google Ads Help: https://support.google.com/google-ads
- GTM Documentation: https://support.google.com/tagmanager
- GA4 Documentation: https://support.google.com/analytics

**Your setup is now complete! 🎉**
