declare namespace NodeJS {
  interface ProcessEnv {
    APP_ENV: 'development' | 'production';
    APP_NAME: string;
    BUNDLE_ID: string;
    API_URL: string;
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
  }
}
