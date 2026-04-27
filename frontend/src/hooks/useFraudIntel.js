import { useCallback, useEffect, useState } from 'react';

const DEFAULT_FEED_URL =
  import.meta.env.VITE_FRAUD_INTEL_FEED_URL ||
  'https://news.google.com/rss/search?q=(cyber%20fraud%20OR%20deepfake%20scam%20OR%20sim%20swap%20OR%20job%20scam)%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen';

const RSS_TO_JSON_URL =
  import.meta.env.VITE_RSS_TO_JSON_URL || 'https://api.rss2json.com/v1/api.json';

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

export default function useFraudIntel(limit = 6) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const url = `${RSS_TO_JSON_URL}?rss_url=${encodeURIComponent(DEFAULT_FEED_URL)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Feed request failed with ${response.status}`);
      }

      const payload = await response.json();

      if (payload.status && payload.status !== 'ok') {
        throw new Error(payload.message || 'Feed service returned an error');
      }

      const normalized = (payload.items || []).slice(0, limit).map(normalizeItem);
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

    return () => window.clearTimeout(timeoutId);
  }, [fetchFeed]);

  return {
    items,
    loading,
    error,
    lastUpdated,
    refresh: fetchFeed,
  };
}
