const windowMs = 15 * 1000; // 15s
const maxRequests = 30;
const ipToHits = new Map();

export function rateLimit(ip) {
  const now = Date.now();
  const entry = ipToHits.get(ip) || [];
  const recent = entry.filter((t) => now - t < windowMs);
  recent.push(now);
  ipToHits.set(ip, recent);
  return recent.length <= maxRequests;
}


