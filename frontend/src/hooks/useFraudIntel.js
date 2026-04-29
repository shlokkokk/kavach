import { useCallback, useEffect, useState } from 'react';

const GOOGLE_RSS_BASE = 'https://news.google.com/rss/search';

const FEED_QUERIES = import.meta.env.VITE_FRAUD_INTEL_FEED_URL
  ? [import.meta.env.VITE_FRAUD_INTEL_FEED_URL]
  : [
      'cyber fraud when:1d',
      'deepfake scam when:1d',
      'sim swap fraud when:1d',
      'job scam when:1d',
      'upi fraud when:1d',
    ];

const RSS_TO_JSON_URL =
  import.meta.env.VITE_RSS_TO_JSON_URL || 'https://api.rss2json.com/v1/api.json';

const AUTO_REFRESH_MS = 10 * 60 * 1000;

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getSourceLabel(item) {
  if (item.author) return item.author;
  if (item.source) return item.source;

  try {
    const url = new URL(item.link);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return 'live feed';
  }
}

function normalizeItem(item, index) {
  return {
    id: item.guid || item.link || `${item.title}-${index}`,
    title: item.title || 'Untitled update',
    link: item.link || '#',
    source: getSourceLabel(item),
    summary: stripHtml(item.description || item.contentSnippet || item.content || ''),
    publishedAt: item.pubDate || item.published || item.isoDate || '',
  };
}

function buildFeedUrl(query) {
  if (query.startsWith('http://') || query.startsWith('https://')) {
    return query;
  }

  const params = new URLSearchParams({
    q: `(${query})`,
    hl: 'en-IN',
    gl: 'IN',
    ceid: 'IN:en',
  });

  return `${GOOGLE_RSS_BASE}?${params.toString()}`;
}

async function fetchFeedItems(feedUrl) {
  const url = `${RSS_TO_JSON_URL}?rss_url=${encodeURIComponent(feedUrl)}&cache_bust=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Feed request failed with ${response.status}`);
  }

  const payload = await response.json();

  if (payload.status && payload.status !== 'ok') {
    throw new Error(payload.message || 'Feed service returned an error');
  }

  return payload.items || [];
}

export default function useFraudIntel(limit = 6) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const feedResults = await Promise.allSettled(
        FEED_QUERIES.map((query) => fetchFeedItems(buildFeedUrl(query)))
      );

      if (feedResults.every((result) => result.status === 'rejected')) {
        throw feedResults[0].reason || new Error('Unable to load live fraud intel');
      }

      const merged = feedResults.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
      const deduped = [];
      const seen = new Set();

      merged.forEach((item, index) => {
        const normalized = normalizeItem(item, index);
        const fingerprint = `${normalized.link || ''}::${normalized.title.toLowerCase()}`;

        if (!seen.has(fingerprint)) {
          seen.add(fingerprint);
          deduped.push(normalized);
        }
      });

      deduped.sort((left, right) => new Date(right.publishedAt || 0) - new Date(left.publishedAt || 0));

      const normalized = deduped.slice(0, limit);
      setItems(normalized);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load live fraud intel');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchFeed();
    }, 0);

    const intervalId = window.setInterval(() => {
      fetchFeed(true);
    }, AUTO_REFRESH_MS);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [fetchFeed]);

  return {
    items,
    loading,
    error,
    lastUpdated,
    refresh: fetchFeed,
  };
}
