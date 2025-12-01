import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for API data fetching with loading and error states
 * @param {Function} apiFunction - API function to call
 * @param {Array} dependencies - Dependencies for re-fetching
 */
export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Custom hook for API mutations (POST, PUT, DELETE)
 * @param {Function} apiFunction - API function to call
 */
export const useMutation = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      return { success: true, data: result };
    } catch (err) {
      setError(err.message || 'An error occurred');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};
