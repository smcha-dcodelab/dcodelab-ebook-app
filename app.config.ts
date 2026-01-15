import * as dotenv from "dotenv";
import { ConfigContext, ExpoConfig } from "expo/config";

// APP_ENV 환경 변수에 따라 적절한 .env 파일을 로드합니다.
// 기본값은 development입니다.
const env = process.env.APP_ENV || "development";

if (env === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.development" });
}

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: process.env.APP_NAME || "dcodelab-ebook-app",
    slug: "dcodelab-ebook-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "dcodelabebookapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: process.env.BUNDLE_ID || "com.dcodelab.ebook",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#E6F4FE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["android.permission.RECORD_AUDIO"],
      package: process.env.BUNDLE_ID || "com.dcodelab.ebook",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      "expo-image-picker",
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.587325555454-rlkfdl0ic2u2kl4skms1t369iqg5gq0f",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: [
              "https://devrepo.kakao.com/nexus/content/groups/public/",
            ],
            newArchEnabled: true,
          },
          ios: {
            newArchEnabled: true,
          },
        },
      ],
      [
        "@react-native-kakao/core",
        {
          nativeAppKey:
            process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ||
            "6f659a1afc41af00a8309d1bec38e903",
          android: {
            authCodeHandlerActivity: true,
          },
          ios: {
            handleKakaoOpenUrl: true,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appEnv: env,
      apiUrl: process.env.API_URL,
      eas: {
        projectId: "your-project-id",
      },
    },
  };
};
