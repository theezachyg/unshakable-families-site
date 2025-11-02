# Google Ads Campaign Setup Guide
## Unshakable Families - Complete Implementation Guide

---

## Table of Contents
1. [Google Ads Account Setup](#google-ads-account-setup)
2. [Getting Your Tracking IDs](#getting-your-tracking-ids)
3. [Updating Website Code](#updating-website-code)
4. [Campaign Structure](#campaign-structure)
5. [Ad Copy & Keywords](#ad-copy--keywords)
6. [Budget Recommendations](#budget-recommendations)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Google Ads Account Setup

### Step 1: Create Google Ads Account
1. Go to https://ads.google.com
2. Click "Start Now"
3. Sign in with your Google account
4. Follow the setup wizard:
   - Select "Sales" as your campaign goal
   - Enter your business information
   - Set up billing

### Step 2: Create Conversion Action
**This is CRITICAL for tracking purchases!**

1. In Google Ads, click **Tools & Settings** (wrench icon)
2. Under "Measurement", click **Conversions**
3. Click the **+ (Plus) button** to create new conversion action
4. Select **Website**
5. For Conversion name, enter: \`Purchase\`
6. For Category, select: \`Purchase\`
7. For Value, select: \`Use different values for each conversion\` (we'll pass the order total)
8. For Count, select: \`Every\` (count all purchases)
9. For Conversion window, leave default: \`30 days\`
10. For Attribution model, select: \`Data-driven\` or \`Last click\`
11. Click **Create and Continue**
12. On the "Set up the tag yourself" page, you'll see:
    - **Conversion ID** (looks like \`AW-123456789\`)
    - **Conversion Label** (looks like \`AbC-DEfGHijKLMno\`)
13. **COPY BOTH OF THESE** - you'll need them in the next section

---

## Getting Your Tracking IDs

You need TWO pieces of information from Google Ads:

### 1. Google Ads Conversion ID
- Format: \`AW-XXXXXXXXXX\` (where X is digits)
- Location: Google Ads > Tools > Conversions > Your conversion action
- Example: \`AW-123456789\`

### 2. Conversion Label
- Format: A string like \`AbC-DEfGHijKLMno\`
- Location: Same place as Conversion ID
- This is unique to your Purchase conversion action

---

## Updating Website Code

### Files to Update

You need to replace \`AW-XXXXXXXXXX\` in the following 8 files:

**Landing Pages:**
1. \`unshakable_landing_page.html\`
2. \`fire_on_family_altar_landing_page.html\`
3. \`unshakable_bundle_landing_page_v2.html\`

**Chapter Previews:**
4. \`unshakable_chapter_preview.html\`
5. \`fire_chapter_preview.html\`

**Cart & Success:**
6. \`cart.html\`
7. \`success.html\`
8. \`index.html\`

### Search & Replace Instructions

**Find:** \`AW-XXXXXXXXXX\`
**Replace with:** Your actual Conversion ID (e.g., \`AW-123456789\`)
**In:** All 8 HTML files listed above

**Then in success.html ONLY, also find:**
\`AW-XXXXXXXXXX/YYYYYYYYYYYYYY\`

**Replace with:**
\`AW-123456789/AbC-DEfGHijKLMno\` (your actual Conversion ID/Label)

---

## Campaign Structure

### Campaign 1: UNSHAKABLE - Search

**Settings:**
- Name: UNSHAKABLE Book - Search
- Type: Search Network
- Goal: Sales
- Budget: $20-30/day
- Bidding: Maximize Conversions
- Location: United States
- Language: English

**Ad Headlines (add all 15):**
1. UNSHAKABLE by Dr. Hal Sacks
2. Build Firm Family Foundations
3. Christian Family Strength Book
4. Faith-Based Parenting Guide
5. Stand Firm In Uncertain Times
6. $17.99 Paperback | $9.99 Ebook
7. Prophetic Guide For Families
8. Strengthen Your Marriage & Family
9. Biblical Foundations Book
10. Free Chapter Preview Available
11. Order Today | Fast Shipping
12. By Dr. Hal H. Sacks
13. Build What Cannot Be Moved
14. Faith Foundations For Families
15. Christian Marriage Book

**Ad Descriptions (add all 4):**
1. Build unshakable foundations when everything around you falls apart. Dr. Hal Sacks' prophetic guide for uncertain times. Order now!
2. Discover biblical principles to strengthen your family. Available in paperback ($17.99) and ebook ($9.99). Read free chapter today!
3. Stand firm on faith foundations. Practical wisdom for Christian families facing modern challenges. Ships fast!
4. Strengthen marriage, parenting & faith with proven biblical strategies. Order UNSHAKABLE today and transform your family.

**Final URL:**
\`https://unshakablefamily.bridgebuilders.net/unshakable_landing_page.html\`

**Keywords (Phrase Match):**
- "christian family books"
- "faith based parenting books"
- "christian marriage books"
- "biblical parenting guide"
- "strengthen family faith"
- "christian family foundation"
- "faith books for families"
- "christian parenting advice"
- "building strong christian family"
- "marriage and family christian books"

---

### Campaign 2: Fire on the Family Altar - Search

**Settings:**
- Name: Fire Family Altar - Search
- Same settings as Campaign 1
- Budget: $20-30/day

**Ad Headlines:**
1. Fire on the Family Altar
2. By Cheryl Sacks
3. Ignite Prayer In Your Home
4. Family Altar Revival Guide
5. $17.99 Paperback | $9.99 Ebook
6. Restore Family Prayer Life
7. Christian Prayer Book
8. Transform Your Home With Prayer
9. Spiritual Revival For Families
10. Free Chapter Preview
11. Order Today | Ships Fast
12. Build A Praying Family
13. Family Devotional Guide
14. Powerful Family Prayer
15. Altar Of Prayer At Home

**Ad Descriptions:**
1. Ignite spiritual fire in your home! Cheryl Sacks shows you how to build a family altar that transforms lives. Order now!
2. Restore the lost art of family prayer. Available in paperback ($17.99) and ebook ($9.99). Read free chapter preview!
3. Practical guide to building a powerful prayer life at home. Create a family altar that brings revival. Ships fast!
4. Transform your home through prayer. Proven strategies for family devotions and spiritual breakthrough. Order today!

**Final URL:**
\`https://unshakablefamily.bridgebuilders.net/fire_on_family_altar_landing_page.html\`

**Keywords:**
- "family altar book"
- "christian prayer books"
- "family prayer guide"
- "family devotional books"
- "prayer life christian book"
- "spiritual revival books"
- "family worship guide"
- "christian devotional for families"
- "prayer books for families"
- "building family altar"

---

### Campaign 3: Bundle Special - Search

**Settings:**
- Name: Unshakable Bundle - Search
- Type: Search Network
- Budget: $30-40/day

**Ad Headlines:**
1. Unshakable Family Bundle
2. 2 Books - Special Price $30
3. UNSHAKABLE + Fire Bundle
4. Save On Christian Family Books
5. Complete Family Foundation Set
6. By Dr. Hal & Cheryl Sacks
7. Build Faith & Prayer Together
8. Limited Bundle Offer
9. Family Transformation Package
10. $35.98 Value - Now $30
11. Free Shipping On Bundle
12. Transform Your Family Today
13. Prayer + Foundation Books
14. Complete Christian Family Guide
15. Order Bundle & Save

**Ad Descriptions:**
1. Get both bestselling books: UNSHAKABLE and Fire on the Family Altar for just $30. Complete family transformation package!
2. Build firm foundations and ignite prayer in your home. Bundle includes both books. Save $5.98 today!
3. Dr. Hal and Cheryl Sacks' complete guide to family strength. 2 powerful books, 1 special price. Order now!
4. Transform your family with biblical foundations and powerful prayer. Bundle special - limited time. Ships fast!

**Final URL:**
\`https://unshakablefamily.bridgebuilders.net/unshakable_bundle_landing_page_v2.html\`

**Keywords:**
- "christian family books bundle"
- "christian book sets"
- "family faith books package"
- "christian marriage and prayer books"
- "family devotional book set"

---

## Budget Recommendations

**Starting Budget (Month 1):**
- Total Daily: $70-100
- Campaign 1: $20-30/day
- Campaign 2: $20-30/day
- Campaign 3: $30-40/day
- Monthly Total: $2,100-$3,000

**Target Metrics:**
- ROAS: 3x or higher
- CPA: Under $15
- CTR: 3-5%
- Conversion Rate: 2-5%

---

## Testing Checklist

**Before Launch:**
- [ ] Replace all \`AW-XXXXXXXXXX\` placeholders with your Conversion ID
- [ ] Replace \`AW-XXXXXXXXXX/YYYYYYYYYYYYYY\` in success.html
- [ ] Deploy updated files
- [ ] Clear CDN cache

**Test Tracking:**
1. Install Google Tag Assistant Chrome extension
2. Visit landing pages - verify tags detected
3. Complete test purchase
4. Check browser console for "Google Ads conversion tracked" message
5. Wait 24-48 hours for Google to verify conversions

---

## Troubleshooting

**No Conversions Showing:**
- Verify you replaced the placeholder IDs
- Check browser console for errors
- Ensure conversion tag is on success page

**High CPA:**
- Use phrase match keywords
- Add negative keywords
- Improve landing page speed
- Refine ad targeting

**Low CTR (target 3-5%+):**
- Add prices to headlines
- Use stronger CTAs
- Test different combinations
- Add ad extensions

---

## Quick Start Steps

1. Create Google Ads account at ads.google.com
2. Set up Purchase conversion (get ID and Label)
3. Replace \`AW-XXXXXXXXXX\` in 8 HTML files
4. Replace \`AW-XXXXXXXXXX/YYYYYYYYYYYYYY\` in success.html
5. Deploy and test
6. Create 3 campaigns using ad copy above
7. Monitor daily for first week
8. Optimize based on data

---

**Updated:** November 2025
