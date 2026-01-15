import { GlobalStyles } from "@/constants";
import { supabase } from "@/lib/supabase";
import { KakaoLoginToken, login } from "@react-native-kakao/user";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function KakaoLoginButton({
  label,
  backgroundColor,
  textColor,
  iconSource,
  onPress,
  showLogo = false,
}: SnsLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleKakaoLogin = async () => {
    setIsLoading(true);

    try {
      // 1. 카카오 네이티브 SDK로 로그인 (@react-native-kakao/user 사용)
      // Kakao Developers Console에서 OpenID Connect 활성화 시 idToken 자동 반환
      const token: KakaoLoginToken = await login();

      console.log("카카오 로그인 성공:", token);

      // 2. idToken 확인 (OpenID Connect 활성화 필요)
      if (!token.idToken) {
        throw new Error(
          "ID Token이 없습니다. Kakao Developers에서 OpenID Connect를 활성화했는지 확인하세요."
        );
      }

      // 3. Supabase에 ID Token으로 로그인
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "kakao",
        token: token.idToken,
      });

      if (error) {
        throw error;
      }

      console.log("Supabase 로그인 성공:", data);
      console.log("Supabase 로그인 성공:", data.user?.email);

      // 로그인 성공 후 네비게이션 처리
      // showLogo가 true면 이전 스택으로 이동, false면 /my로 이동
      if (showLogo) {
        // 이전 스택으로 이동
        router.back();
      } else {
        // /my로 이동
        router.replace("/my");
      }
    } catch (error: any) {
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (error: any) => {
    const errorMessage = error?.message || String(error);

    // 사용자 취소 (먼저 체크하여 에러 로그 방지)
    // - Android: "cancelled", "cancel", "E_CANCELLED"
    // - iOS: "SdkError error 0" (KakaoSDKCommon.SdkError)
    if (
      errorMessage.includes("cancelled") ||
      errorMessage.includes("cancel") ||
      errorMessage.includes("error 0") ||
      error.code === "E_CANCELLED"
    ) {
      console.log("사용자가 로그인을 취소했습니다.");
      return;
    }

    // 취소가 아닌 경우에만 에러 로그 출력
    console.error("로그인 오류:", error);

    // Key Hash 오류
    if (errorMessage.includes("android_key_hash")) {
      Alert.alert(
        "설정 오류",
        "Android 키 해시가 Kakao Developers에 등록되지 않았습니다."
      );
      return;
    }

    // Bundle ID 오류
    if (errorMessage.includes("ios_bundle_id")) {
      Alert.alert(
        "설정 오류",
        "iOS Bundle ID가 Kakao Developers에 등록되지 않았습니다."
      );
      return;
    }

    // 기타 오류
    Alert.alert(
      "로그인 오류",
      errorMessage || "알 수 없는 오류가 발생했습니다."
    );
  };

  return (
    <Pressable
      style={[styles.loginButton, { backgroundColor }]}
      onPress={handleKakaoLogin}
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
