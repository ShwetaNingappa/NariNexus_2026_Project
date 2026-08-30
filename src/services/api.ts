import axios from 'axios';

// Defaults to relative URL which aligns with the Vite development proxy configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    console.error('NariNexus API Health Check failed:', error);
    return {
      success: false,
      message: 'Could not connect to the backend server.',
      database: 'failed',
    };
  }
};
