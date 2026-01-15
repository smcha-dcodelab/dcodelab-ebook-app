declare namespace NodeJS {
  interface ProcessEnv {
    APP_ENV: "development" | "production";
    APP_NAME: string;
    BUNDLE_ID: string;
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
    EXPO_PUBLIC_KAKAO_REST_API_KEY: string;
    EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY: string;
  }
}
