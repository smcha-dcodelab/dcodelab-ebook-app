import { supabase } from "@/lib/supabase";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 환경 변수에서 Client ID 가져오기
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Google Sign-In 설정
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID, // 필수: Web Client ID
      iosClientId: Platform.OS === "ios" ? IOS_CLIENT_ID : undefined,
      offlineAccess: true, // 서버에서 토큰 갱신 필요시
      scopes: ["profile", "email"],
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // 1. Google Play Services 확인 (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // 2. Google 로그인 수행
      const response = await GoogleSignin.signIn();
      console.log("response : GoogleSignin.signIn() ===>", response);

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;

        if (!idToken) {
          throw new Error("Google 로그인에서 ID Token을 받지 못했습니다.");
        }

        // 3. Supabase에 ID Token으로 로그인
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        console.log("data : supabase.auth.signInWithIdToken() ===>", data);
        console.log("error : supabase.auth.signInWithIdToken() ===>", error);
        if (error) {
          throw error;
        }

        console.log("로그인 성공:", data.user?.email);
      }
    } catch (error: any) {
      handleSignInError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInError = (error: any) => {
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          console.log("사용자가 로그인을 취소했습니다.");
          break;
        case statusCodes.IN_PROGRESS:
          console.log("로그인이 이미 진행 중입니다.");
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          Alert.alert("오류", "Google Play Services를 사용할 수 없습니다.");
          break;
        default:
          Alert.alert("로그인 오류", error.message);
      }
    } else {
      // Supabase 또는 기타 오류
      console.error("로그인 오류:", error);
      Alert.alert(
        "로그인 오류",
        error.message || "(구글 로그인)알 수 없는 오류가 발생했습니다."
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <GoogleIcon />
          <Text style={styles.buttonText}>Google로 계속하기</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Google 아이콘 컴포넌트 (간단한 SVG 또는 이미지 사용 가능)
const GoogleIcon = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>G</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#fff",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "bold",
  },
});
