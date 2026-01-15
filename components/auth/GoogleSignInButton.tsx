import { GlobalStyles } from "@/constants";
import { supabase } from "@/lib/supabase";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

interface SnsLoginButtonProps {
  /** 버튼 텍스트 */
  label: string;
  /** 버튼 배경색 */
  backgroundColor: string;
  /** 텍스트 색상 */
  textColor: string;
  /** 아이콘 이미지 소스 */
  iconSource: any;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 로고 표시 여부 (true면 로그인 후 이전 스택으로, false면 /my로 이동) */
  showLogo?: boolean;
}

// 환경 변수에서 Client ID 가져오기
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export default function GoogleSignInButton({
  label,
  backgroundColor,
  textColor,
  iconSource,
  onPress,
  showLogo = false,
}: SnsLoginButtonProps) {
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

        // 로그인 성공 후 네비게이션 처리
        // showLogo가 true면 이전 스택으로 이동, false면 /my로 이동
        if (showLogo) {
          // 이전 스택으로 이동
          router.back();
        } else {
          // /my로 이동
          router.replace("/my");
        }
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
    <Pressable
      style={[styles.loginButton, { backgroundColor }]}
      onPress={handleGoogleSignIn}
    >
      {isLoading ? (
        <ActivityIndicator color={GlobalStyles.bg.bgColor2} />
      ) : (
        <>
          <Text style={[styles.loginButtonText, { color: textColor }]}>
            {label}
          </Text>
          {iconSource && (
            <Image
              source={iconSource}
              style={styles.loginIcon}
              resizeMode="cover"
            />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loginButton: {
    gap: 10,
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 100,
    height: 50,
    alignItems: "center",
    alignSelf: "stretch",
    position: "relative",
  },
  loginButtonText: {
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 17,
    letterSpacing: -0.3,
    fontSize: 14,
    fontFamily: GlobalStyles.pretendard.semiBold,
  },
  loginIcon: {
    width: 30,
    height: 30,
    position: "absolute",
    left: 13,
  },
});
