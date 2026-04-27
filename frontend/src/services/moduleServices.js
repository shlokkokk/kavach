import api from './api';
import { API_BASE_URL } from '../utils/constants';

export const audioService = {
  analyze: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/audio/scan`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

export const jobService = {
  scanText: async (text) => {
    return api.post('/job/scan', { text });
  },
  scanPDF: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/job/scan`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

export const simService = {
  register: async (phoneNumber) => {
    return api.post('/sim/register', { phoneNumber });
  },
  getStatus: async (phoneNumber) => {
    return api.get(`/sim/status/${phoneNumber}`);
  },
  freeze: async (phoneNumber) => {
    return api.post('/sim/freeze', { phoneNumber });
  },
  markSafe: async (phoneNumber) => {
    return api.post('/sim/mark-safe', { phoneNumber });
  },
};
