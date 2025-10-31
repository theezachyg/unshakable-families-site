# Cloudflare Pages Deployment Guide

## Step 1: Connect GitHub Repository to Cloudflare Pages

1. Log in to your Cloudflare dashboard: https://dash.cloudflare.com
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create application**
4. Select the **Pages** tab
5. Click **Connect to Git**
6. Select **GitHub** and authorize Cloudflare if needed
7. Select the repository: **theezachyg/unshakable-families**

## Step 2: Configure Build Settings

Use these settings:

- **Production branch**: `main`
- **Build command**: Leave blank (this is a static site)
- **Build output directory**: `/`
- **Root directory**: Leave as `/`

## Step 3: Environment Variables (Optional for Now)

You can skip environment variables for now. You'll need to add these later for Stripe integration:

- `STRIPE_SECRET_KEY` (for the Cloudflare Worker)
- Any other API keys needed

## Step 4: Deploy

1. Click **Save and Deploy**
2. Wait for the deployment to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://unshakable-families.pages.dev`

## Step 5: Upload Video Files

The large video files were excluded from git to keep the repository size manageable. You need to upload them directly:

### Videos to Upload:

These files are in your local `Assets/Videos/` and `Assets/` directories:

1. `Assets/Videos/Cheryl-Sacks-ItsSupernatural-Broadband High.mp4` (285MB)
2. `Assets/Videos/Hal-Sacks-ItsSupernaturalKK-Broadband High.mp4` (310MB)
3. `Assets/hero-background-bundle-Broadband High.mp4` (28MB)
4. `Assets/hero-background-fire-Broadband High.mp4` (28MB)
5. `Assets/hero-background-shaking Broadband High.mp4` (17MB)

### Upload Options:

**Option A: Use Cloudflare R2 (Recommended)**
1. Go to **R2** in your Cloudflare dashboard
2. Create a bucket called `unshakable-videos`
3. Upload the video files
4. Make the bucket public
5. Update the video URLs in your HTML files to point to R2

**Option B: Use Wrangler CLI to upload directly**
```bash
# Install Wrangler if you haven't
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Upload files (you'll need to set up a Pages project)
wrangler pages deployment create unshakable-families --project-name=unshakable-families
```

**Option C: Manual workaround**
1. Commit the videos to a separate branch
2. In Cloudflare Pages settings, temporarily switch to that branch
3. After deployment, switch back to main

## Step 6: Custom Domain (Optional)

1. In Cloudflare Pages project settings, go to **Custom domains**
2. Add your domain (e.g., `unshakablefamilies.com`)
3. Cloudflare will automatically configure DNS

## Step 7: Deploy Cloudflare Worker for Stripe

The `cloudflare-worker.js` file needs to be deployed separately:

```bash
# Create wrangler.toml configuration
cat > wrangler.toml <<EOF
name = "unshakable-families-checkout"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
route = "unshakable-families.pages.dev/api/*"
zone_id = "YOUR_ZONE_ID"

[env.production]
vars = { }
EOF

# Deploy the worker
wrangler publish cloudflare-worker.js
```

## Next Steps

1. Test all pages on the deployed site
2. Verify video playback works
3. Add Stripe Price IDs to the cart and landing pages
4. Test the checkout flow
5. Set up SSL certificate (automatic with Cloudflare)

## Troubleshooting

- **Videos not loading**: Check CORS settings and file paths
- **Checkout not working**: Verify Stripe API keys in Worker environment
- **Build fails**: Check build logs in Cloudflare dashboard
