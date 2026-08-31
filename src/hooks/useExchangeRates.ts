import { useState, useEffect } from 'react';

// Fallback rates relative to USD in case the API fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EGP: 48.5,
  SAR: 3.75,
  AED: 3.67,
  KWD: 0.31,
  QAR: 3.64,
  BHD: 0.38,
  EUR: 0.92,
  GBP: 0.78,
};

export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates) {
          setRates({ ...FALLBACK_RATES, ...data.rates });
        }
      } catch (e) {
        console.error("Failed to fetch exchange rates, using fallback.", e);
      }
      setLoading(false);
    };
    fetchRates();
  }, []);

  const convert = (amount: number, from: string, to: string) => {
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    // Convert to base (USD), then to target
    return (amount / fromRate) * toRate;
  };

  return { rates, convert, loading };
}
