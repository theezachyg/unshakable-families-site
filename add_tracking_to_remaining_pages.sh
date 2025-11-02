#!/bin/bash

# Script to add tracking.js to remaining pages
# This adds the universal tracking library before </body> tag

PAGES=(
    "unshakable_landing_page.html"
    "fire_on_family_altar_landing_page.html"
    "unshakable_bundle_landing_page_v2.html"
    "cart.html"
    "success.html"
)

TRACKING_SCRIPT='
    <!-- Universal GTM Tracking Library -->
    <script src="tracking.js"></script>
</body>'

for PAGE in "${PAGES[@]}"; do
    echo "Processing $PAGE..."

    # Check if tracking.js is already added
    if grep -q "tracking.js" "$PAGE"; then
        echo "  ✓ tracking.js already present in $PAGE"
    else
        # Add tracking.js before </body>
        sed -i.bak 's|</body>|'"$TRACKING_SCRIPT"'|' "$PAGE"
        echo "  ✓ Added tracking.js to $PAGE"
    fi
done

echo ""
echo "✅ Universal tracking library added to all pages!"
echo "📝 Next: Add page-specific ecommerce events (see TRACKING_IMPLEMENTATION_GUIDE.md)"
