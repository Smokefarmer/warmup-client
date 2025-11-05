import { useState, useEffect } from 'react';
import axios from 'axios';

export interface CexBalance {
  cexName: string;
  bnb: {
    available: number;
    locked: number;
    total: number;
    error?: string;
  };
  sol: {
    available: number;
    locked: number;
    total: number;
    error?: string;
  };
}

export const useCexBalances = () => {
  const [balances, setBalances] = useState<CexBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/funding/cex/balances');
      if (response.data.success) {
        setBalances(response.data.data);
      } else {
        setError('Failed to fetch balances');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch CEX balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { balances, loading, error, refetch: fetchBalances };
};

