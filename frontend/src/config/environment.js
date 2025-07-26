const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com',
    DEBUG: false,
  },
  staging: {
    API_BASE_URL: 'https://your-staging-api.com',
    DEBUG: true,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];