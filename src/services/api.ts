import axios from 'axios';

// Defaults to relative URL which aligns with the Vite development proxy configuration
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// If the API base URL is explicitly set to localhost:8001, but the frontend is being accessed
// from a remote address (like AI Studio's preview public URL), we MUST use relative pathing
// to leverage the Vite development proxy. Otherwise, the browser will attempt to contact
// localhost:8001 on the user's physical machine and fail with a Network Error.
if (typeof window !== 'undefined') {
  const isRemote = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isRemote && (API_BASE_URL.includes('localhost:8001') || API_BASE_URL.includes('127.0.0.1:8001'))) {
    console.log("NariNexus: Overriding localhost VITE_API_BASE_URL to relative path for remote preview");
    API_BASE_URL = '';
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios response interceptor for transparent retries on network and 503 cold-start errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) {
      return Promise.reject(error);
    }
    
    // Set default retry parameters
    config.retry = config.retry ?? 3;
    config.retryCount = config.retryCount ?? 0;
    
    const isNetworkError = !error.response;
    const is503Error = error.response && error.response.status === 503;
    
    if ((isNetworkError || is503Error) && config.retryCount < config.retry) {
      config.retryCount += 1;
      // Exponential backoff delay (1s, 2s, 3s)
      const delay = 1000 * config.retryCount;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }
    return Promise.reject(error);
  }
);

// Polyfill/wrap global window.fetch to provide transparent retries on network and 503 errors
if (typeof window !== 'undefined' && window.fetch) {
  try {
    const originalFetch = window.fetch;
    const wrappedFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      let attempts = 0;
      const maxAttempts = 3;
      const delay = 1000;

      while (attempts < maxAttempts) {
        try {
          const response = await originalFetch(input, init);
          // If the service is still starting up, wait and retry
          if (response.status === 503 && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, delay * attempts));
            continue;
          }
          return response;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, delay * attempts));
        }
      }
      return originalFetch(input, init);
    };

    // Use Object.defineProperty to bypass read-only getter properties on the Window prototype
    Object.defineProperty(window, 'fetch', {
      value: wrappedFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn("NariNexus warning: Unable to override global fetch in this browser sandbox environment.", err);
  }
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  database: 'connected' | 'failed';
}

export const checkApiHealth = async (): Promise<HealthCheckResponse> => {
  try {
    const response = await api.get<HealthCheckResponse>('/api/health');
    return response.data;
  } catch (error) {
    // Graceful check during initial container cold-starts or dependency installations
    return {
      success: false,
      message: 'Could not connect to the backend server.',
      database: 'failed',
    };
  }
};
