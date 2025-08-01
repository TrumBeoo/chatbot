const config = {
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL ,
    DEBUG: true,
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL ,
    DEBUG: true,
  },
  staging: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    DEBUG: true,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];