// Lightweight market price fetcher with caching and fallbacks
// Returns USD price for ETH as a number (e.g., 4331.42)

type CacheEntry = {
  value: number | null;
  timestampMs: number;
};

const cache: { ethUsd?: CacheEntry } = {};
const CACHE_TTL_MS = 30_000; // 30s cache to avoid rate limits

async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
    const response = await fetch(url, {
      headers: {
        // Some environments require a header; safe to omit if not needed
        'Accept': 'application/json',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const price = data?.ethereum?.usd;
    return typeof price === 'number' ? price : null;
  } catch {
    return null;
  }
}

async function fetchFromCoinbase(): Promise<number | null> {
  try {
    const url = 'https://api.coinbase.com/v2/prices/ETH-USD/spot';
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) return null;
    const data = await response.json();
    const amount = data?.data?.amount;
    const price = amount != null ? Number(amount) : NaN;
    return Number.isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

export async function getMarketEthUsdPrice(forceRefresh: boolean = false): Promise<number | null> {
  const now = Date.now();
  const cached = cache.ethUsd;
  if (!forceRefresh && cached && now - cached.timestampMs < CACHE_TTL_MS) {
    return cached.value ?? null;
  }

  // Try primary, then fallback
  const primary = await fetchFromCoinGecko();
  const value = primary ?? (await fetchFromCoinbase());

  cache.ethUsd = { value: value ?? null, timestampMs: now };
  return value ?? null;
}


