const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5001/api'; // URL directe pour contourner le proxy

export const API_URL = API_BASE_URL;
