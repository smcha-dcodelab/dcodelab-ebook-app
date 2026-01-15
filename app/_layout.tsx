import queryClient from "@/api/queryClient";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { initializeKakaoSDK } from "@react-native-kakao/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

// 카카오 SDK 초기화 (앱 시작 시 한 번만 실행)
// .env 파일에서 EXPO_PUBLIC_ 접두사가 붙은 환경 변수는 런타임에서 바로 접근 가능
const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;

if (Platform.OS !== "web" && kakaoNativeAppKey) {
  initializeKakaoSDK(kakaoNativeAppKey);

  // Android 키 해시 출력 (개발 중에만 사용, Kakao Developers Console에 등록 필요)
  // if (Platform.OS === "android" && __DEV__) {
  //   getKeyHashAndroid().then((keyHash) => {
  //     console.log("🔑 Android KeyHash:", keyHash);
  //   });
  // }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "Pretendard-Regular": require("../assets/fonts/pretendard/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/pretendard/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/pretendard/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../assets/fonts/pretendard/Pretendard-Bold.otf"),
    "NotoSans-SemiBoldItalic": require("../assets/fonts/notosans/NotoSans-SemiBoldItalic.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ActionSheetProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <Toast />
      </QueryClientProvider>
    </ActionSheetProvider>
  );
}

function RootNavigator() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
