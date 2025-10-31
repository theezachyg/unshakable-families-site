// Subdomain routing middleware for Cloudflare Pages
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const hostname = url.hostname;

  // Subdomain routing map
  const subdomainRoutes = {
    'unshakablefamily.bridgebuilders.net': '/unshakable_bundle_landing_page_v2.html',
    'unshakable.bridgebuilders.net': '/unshakable_landing_page.html',
    'fireonthefamilyaltar.bridgebuilders.net': '/fire_on_family_altar_landing_page.html',
    'cart.bridgebuilders.net': '/cart.html'
  };

  // Check if this is a root request (no path or just /)
  if (url.pathname === '/' || url.pathname === '') {
    const targetPath = subdomainRoutes[hostname];

    if (targetPath) {
      // Rewrite the URL to the target page
      url.pathname = targetPath;
      return fetch(new Request(url, request));
    }
  }

  // For all other requests, continue normally
  return next();
}
