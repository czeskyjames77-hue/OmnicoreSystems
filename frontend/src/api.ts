import axios from 'axios';

export const api = axios.create({
  // Nutzt die Umgebungsvariable oder standardmäßig den relativen Pfad /api
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
