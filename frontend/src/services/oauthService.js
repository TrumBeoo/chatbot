// frontend/src/services/oauthService.js
import environment from '../config/environment';

class OAuthService {
  constructor() {
    this.googleInitialized = false;
    this.facebookInitialized = false;
    this.initializationPromises = {};
  }

  // Google OAuth Service
  async initializeGoogle() {
    if (this.googleInitialized) return Promise.resolve();
    
    if (this.initializationPromises.google) {
      return this.initializationPromises.google;
    }

    this.initializationPromises.google = new Promise((resolve, reject) => {
      if (!environment.GOOGLE_CLIENT_ID) {
        return reject(new Error('Google Client ID not configured'));
      }

      if (window.google?.accounts?.id) {
        this.googleInitialized = true;
        return resolve();
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.google?.accounts?.id) {
          this.googleInitialized = true;
          resolve();
        } else {
          reject(new Error('Failed to load Google Identity Services'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google OAuth script'));
      };

      document.head.appendChild(script);
    });

    return this.initializationPromises.google;
  }

  // Facebook OAuth Service
  async initializeFacebook() {
    if (this.facebookInitialized) return Promise.resolve();
    
    if (this.initializationPromises.facebook) {
      return this.initializationPromises.facebook;
    }

    this.initializationPromises.facebook = new Promise((resolve, reject) => {
      if (!environment.FACEBOOK_APP_ID) {
        return reject(new Error('Facebook App ID not configured'));
      }

      if (window.FB) {
        this.facebookInitialized = true;
        return resolve();
      }

      // Remove existing script if any
      const existingScript = document.getElementById('facebook-jssdk');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = `https://connect.facebook.net/${this.getLocale()}/sdk.js`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        window.FB.init({
          appId: environment.FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: 'v19.0'
        });

        this.facebookInitialized = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Facebook SDK'));
      };

      document.body.appendChild(script);
    });

    return this.initializationPromises.facebook;
  }

  getLocale() {
    const language = navigator.language || 'en_US';
    return language.replace('-', '_');
  }

  // Facebook Login
  async loginWithFacebook() {
    await this.initializeFacebook();

    return new Promise((resolve, reject) => {
      window.FB.login((response) => {
        if (response.authResponse) {
          // Get user info
          window.FB.api('/me', { fields: 'name,email,picture.type(large)' }, (userInfo) => {
            if (userInfo.error) {
              reject(new Error(userInfo.error.message));
            } else {
              resolve({
                accessToken: response.authResponse.accessToken,
                userID: response.authResponse.userID,
                userInfo
              });
            }
          });
        } else {
          reject(new Error('Facebook login was cancelled or failed'));
        }
      }, {
        scope: 'email,public_profile',
        return_scopes: true
      });
    });
  }

  // Check login status
  async checkFacebookLoginStatus() {
    await this.initializeFacebook();

    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        resolve(response);
      });
    });
  }

  // Logout from Facebook
  async logoutFromFacebook() {
    if (!this.facebookInitialized) return;

    return new Promise((resolve) => {
      window.FB.logout((response) => {
        resolve(response);
      });
    });
  }

  // Cleanup
  cleanup() {
    // Remove Facebook script
    const fbScript = document.getElementById('facebook-jssdk');
    if (fbScript) {
      fbScript.remove();
    }

    // Reset initialization status
    this.googleInitialized = false;
    this.facebookInitialized = false;
    this.initializationPromises = {};
  }
}

export default new OAuthService();