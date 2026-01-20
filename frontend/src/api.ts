import axios from 'axios';

export const api = axios.create({
  // Ersetze diese URL später durch deine echte Backend-URL von Render/Railway
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});