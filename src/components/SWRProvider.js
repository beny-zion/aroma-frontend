'use client';

import { SWRConfig } from 'swr';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function swrFetcher(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05EA\u05E7\u05E9\u05D5\u05E8\u05EA \u05E2\u05DD \u05D4\u05E9\u05E8\u05EA');
  }
  return res.json();
}

export default function SWRProvider({ children }) {
  return (
    <SWRConfig value={{
      fetcher: swrFetcher,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      errorRetryCount: 2,
      keepPreviousData: true,
    }}>
      {children}
    </SWRConfig>
  );
}
