import axios from 'axios';

export const api = axios.create({
  // Wir lassen die baseURL leer oder setzen sie auf '/', 
  // damit der Pfad '/api/search' direkt an die Vercel-Domain geht.
  baseURL: import.meta.env.VITE_API_URL || '', 
});
