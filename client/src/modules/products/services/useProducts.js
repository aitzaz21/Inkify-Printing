import { useState, useEffect, useCallback } from 'react';
import { productAPI } from './product.service';

export function useProducts(filters = {}) {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const key = JSON.stringify(filters);

  useEffect(() => {
    productAPI.getCategories()
      .then(r => setCategories(r.data.categories || ['All']))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productAPI.getAll(filters)
      .then(r => setProducts(r.data.products || []))
      .catch(e => setError(e.response?.data?.message || 'Failed to load products.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { products, categories, loading, error };
}
