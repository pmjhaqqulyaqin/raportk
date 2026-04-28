import axios from 'axios';

const isDev = import.meta.env.DEV;

const apiClient = axios.create({
  baseURL: isDev ? 'http://localhost:3000/api' : '/api',
  withCredentials: true, // Important for better-auth cookies
});

export default apiClient;

