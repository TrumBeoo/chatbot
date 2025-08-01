const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    DEBUG: import.meta.env.DEV,
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    DEBUG: import.meta.env.DEV,
  },
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL ||'http://localhost:5000',
    DEBUG: import.meta.env.DEV,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];