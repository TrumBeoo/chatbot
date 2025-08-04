// frontend/src/config/environment.js
const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    DEBUG: true,
    HTTPS_MODE: false,
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.yourapp.com',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    DEBUG: false,
    HTTPS_MODE: true,
  },
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://staging-api.yourapp.com',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    DEBUG: true,
    HTTPS_MODE: true,
  }
};

const environment = import.meta.env.MODE || 'development';

export default config[environment];