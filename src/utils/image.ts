export function imageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // Images proxied through Vercel rewrites — same domain, no CORS issues
  return url;
}
