import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * API Base URL configuration
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch with authentication
 */
export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook for fetching data
 */
export const useFetchAPI = <T,>(endpoint: string, key: string[]) => {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => fetchAPI(endpoint),
  });
};

/**
 * Hook for mutating data
 */
export const useMutateAPI = (endpoint: string, method: string = 'POST') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) =>
      fetchAPI(endpoint, {
        method,
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export default { fetchAPI, useFetchAPI, useMutateAPI };
