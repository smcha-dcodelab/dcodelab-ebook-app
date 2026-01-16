/**
 * NaverLoginButton 컴포넌트
 *
 * 네이버 네이티브 SDK를 사용하여 로그인을 처리하고,
 * Supabase Edge Function을 통해 세션을 생성합니다.
 *
 * @description
 * 네이버는 Supabase의 공식 OAuth provider가 아니므로,
 * Edge Function을 통해 커스텀 인증 플로우를 구현합니다.
 *
 * 플로우:
 * 1. 네이버 SDK로 로그인하여 access token 획득
 * 2. Edge Function에 access token 전송
 * 3. Edge Function에서 네이버 사용자 정보 조회 및 Supabase 사용자 생성/조회
 * 4. 반환된 세션으로 Supabase 클라이언트 세션 설정
 */

import { GlobalStyles } from "@/constants";
import { supabase } from "@/lib/supabase";
import NaverLogin, {
  NaverLoginInitParams,
  NaverLoginResponse,
} from "@react-native-seoul/naver-login";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Image,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

// Props 타입 정의
interface NaverLoginButtonProps {
  /** 버튼 텍스트 */
  label: string;
  /** 버튼 배경색 */
  backgroundColor: string;
  /** 텍스트 색상 */
  textColor: string;
  /** 아이콘 이미지 소스 */
  iconSource: any;
  /** 클릭 핸들러 (선택적) */
  onPress?: () => void;
  /** 로고 표시 여부 (true면 로그인 후 이전 스택으로, false면 /my로 이동) */
  showLogo?: boolean;
}

// 환경 변수에서 네이버 Client 정보 가져오기
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || "";
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET || "";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";

/**
 * 네이버 로그인 버튼 컴포넌트
 */
export default function NaverLoginButton({
  label,
  backgroundColor,
  textColor,
  iconSource,
  onPress,
  showLogo = false,
}: NaverLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // 로그인 진행 중 여부를 추적 (AppState 리스너용)
  const isLoginInProgress = useRef(false);

  /**
   * 컴포넌트 마운트 시 네이버 SDK 초기화 및 AppState 리스너 등록
   */
  useEffect(() => {
    initializeNaverLogin();

    // AppState 리스너: 앱이 foreground로 돌아왔을 때 로딩 상태 해제
    // 네이버 로그인 창에서 오류/취소 후 앱으로 돌아왔을 때 대응
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isLoginInProgress.current) {
        // 앱이 foreground로 돌아왔는데 아직 로그인 처리 중이면
        // 일정 시간 후에도 완료되지 않으면 로딩 해제
        setTimeout(() => {
          if (isLoginInProgress.current) {
            console.log("네이버 로그인 타임아웃 - 로딩 해제");
            isLoginInProgress.current = false;
            setIsLoading(false);
          }
        }, 2000); // 2초 대기 후 해제
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * 네이버 SDK 초기화
   * iOS에서는 serviceUrlScheme이 필요합니다.
   */
  const initializeNaverLogin = () => {
    try {
      const initParams: NaverLoginInitParams = {
        appName: "dcodelab-ebook-app",
        consumerKey: NAVER_CLIENT_ID,
        consumerSecret: NAVER_CLIENT_SECRET,
        // iOS에서 네이버 앱으로 이동 후 돌아올 때 사용하는 URL Scheme
        serviceUrlSchemeIOS: `naver${NAVER_CLIENT_ID}`,
        // 네이버 앱이 없을 때 웹 로그인 사용 (선택적)
        disableNaverAppAuthIOS: false,
      };

      NaverLogin.initialize(initParams);
      setIsInitialized(true);
      console.log("네이버 SDK 초기화 완료");
    } catch (error) {
      console.error("네이버 SDK 초기화 실패:", error);
    }
  };

  /**
   * 네이버 로그인 처리
   */
  const handleNaverLogin = async () => {
    // SDK가 초기화되지 않았으면 재시도
    if (!isInitialized) {
      initializeNaverLogin();
    }

    setIsLoading(true);
    isLoginInProgress.current = true;

    try {
      // 1. 네이버 SDK 로그인 수행
      const loginResult: NaverLoginResponse = await NaverLogin.login();

      console.log("네이버 로그인 응답:", loginResult);

      // 로그인 실패 처리
      if (!loginResult.isSuccess) {
        // 사용자 취소인 경우
        if (loginResult.failureResponse?.isCancel) {
          console.log("사용자가 로그인을 취소했습니다.");
          return;
        }

        // 기타 오류
        throw new Error(
          loginResult.failureResponse?.message || "네이버 로그인 실패"
        );
      }

      // 성공 응답 확인
      if (!loginResult.successResponse) {
        throw new Error("네이버 로그인 응답이 없습니다.");
      }

      const { accessToken, refreshToken, expiresAtUnixSecondString } =
        loginResult.successResponse;

      // 토큰 만료 시간 계산 (네이버 기본: 1시간 = 3600초)
      // expiresAtUnixSecondString은 Unix timestamp 초 단위 (문자열)
      let expiresIn = 3600; // 기본값
      if (expiresAtUnixSecondString) {
        const expiresAtSec = parseInt(expiresAtUnixSecondString, 10);
        if (!isNaN(expiresAtSec)) {
          // 초 단위이므로 현재 시간도 초 단위로 계산
          const nowSec = Math.floor(Date.now() / 1000);
          expiresIn = Math.max(0, expiresAtSec - nowSec);
        }
      }

      // 2. Edge Function 호출하여 Supabase 세션 생성
      const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/naver-auth`;

      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          refreshToken,
          expiresIn, // 토큰 만료 시간 전달
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "세션 생성 실패");
      }

      console.log("Edge Function 응답:", data);

      // 3. Supabase 세션 설정
      // Edge Function에서 유효한 JWT 세션을 반환해야 함
      if (data.session?.access_token && data.session.access_token.length > 0) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || "",
        });

        if (sessionError) {
          // 세션 설정 실패 시 상세 로그
          console.error("세션 설정 실패:", sessionError.message);

          // JWT 형식 오류인 경우 사용자에게 안내
          if (
            sessionError.message.includes("JWT") ||
            sessionError.message.includes("token")
          ) {
            throw new Error(
              "인증 세션 생성에 실패했습니다. 다시 시도해주세요."
            );
          }
        } else {
          console.log("Supabase 세션 설정 완료");
        }
      } else {
        // 세션이 비어있는 경우 (Edge Function에서 세션 생성 실패)
        console.warn("Edge Function에서 유효한 세션을 받지 못했습니다.");
        // 사용자 정보만 있으면 일단 진행 (앱 재시작 시 다시 로그인 필요할 수 있음)
        if (!data.user) {
          throw new Error("로그인 처리 중 오류가 발생했습니다.");
        }
      }

      console.log(
        "네이버 로그인 성공:",
        data.user?.email || data.user?.nickname
      );
      if (data.user?.is_new_user) {
        console.log("신규 사용자 가입 완료");
      }

      // 4. 로그인 성공 후 네비게이션
      if (showLogo) {
        router.back();
      } else {
        router.replace("/my");
      }
    } catch (error: any) {
      handleLoginError(error);
    } finally {
      isLoginInProgress.current = false;
      setIsLoading(false);
    }
  };

  /**
   * 로그인 오류 처리
   */
  const handleLoginError = (error: any) => {
    const errorMessage = error?.message || String(error);

    console.error("네이버 로그인 오류:", error);

    // 네트워크 오류
    if (
      errorMessage.includes("Network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("Failed to fetch")
    ) {
      Alert.alert("네트워크 오류", "인터넷 연결을 확인하고 다시 시도해주세요.");
      return;
    }

    // SDK 초기화 오류
    if (errorMessage.includes("initialize") || errorMessage.includes("SDK")) {
      Alert.alert(
        "초기화 오류",
        "네이버 로그인 서비스를 초기화하는 중 오류가 발생했습니다."
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
      onPress={handleNaverLogin}
      disabled={isLoading}
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
