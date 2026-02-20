export function imageUrl(url: string): string {
  if (!url) return '';
  // Images in DB stored as full URLs to Telegram client (rosa-flowers-client.vercel.app)
  // Max WebView blocks cross-domain images, so rewrite to local /bouquets/ path
  // (image files exist in public/bouquets/)
  if (url.includes('/bouquets/')) {
    return '/bouquets/' + url.split('/bouquets/').pop();
  }
  if (url.includes('/uploads/')) {
    return url; // proxied via Vercel rewrites
  }
  if (url.startsWith('http')) return url;
  return url;
}
