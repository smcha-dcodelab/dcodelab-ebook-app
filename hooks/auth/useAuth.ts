import { supabase } from "@/lib/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  logout as kakaoLogout,
  unlink as kakaoUnlink,
} from "@react-native-kakao/user";
import { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    // AppState 리스너: 앱이 포그라운드로 올 때 토큰 갱신 로직 활성화
    const handleAppStateChange = (state: string) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const appStateListener = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // 초기 세션 확인
    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Refresh Token 오류 시 로컬 세션 정리
        if (error) {
          if (
            error.message.includes("Refresh Token Not Found") ||
            error.message.includes("Invalid Refresh Token")
          ) {
            console.log("세션이 만료되었습니다. (유효하지 않은 토큰)");
          } else {
            console.log("세션 복원 실패:", error.message);
          }

          // 로컬 저장소의 세션 정리
          await supabase.auth.signOut({ scope: "local" });
          setAuthState({
            session: null,
            user: null,
            isLoading: false,
          });
          return;
        }

        setAuthState({
          session,
          user: session?.user ?? null,
          isLoading: false,
        });
      } catch (error) {
        console.error("세션 확인 오류:", error);
        setAuthState({
          session: null,
          user: null,
          isLoading: false,
        });
      }
    };

    initSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      // TOKEN_REFRESHED 실패 시 처리
      if (event === "TOKEN_REFRESHED" && !session) {
        console.log("토큰 갱신 실패, 로그아웃 상태로 전환");
        setAuthState({
          session: null,
          user: null,
          isLoading: false,
        });
        return;
      }

      setAuthState({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
      appStateListener.remove();
    };
  }, []);

  // 로그아웃 함수
  const signOut = async () => {
    try {
      // 현재 세션에서 프로바이더 정보 확인
      const provider = authState.session?.user?.app_metadata?.provider;
      console.log("로그아웃 프로바이더:", provider);

      // 프로바이더별 로그아웃 처리
      if (provider === "google") {
        // Google 로그아웃
        try {
          const currentUser = GoogleSignin.getCurrentUser();
          if (currentUser) {
            await GoogleSignin.signOut();
            console.log("구글 로그아웃 완료");
          }
        } catch (googleError) {
          // 구글 로그아웃 실패해도 Supabase 로그아웃 진행
          console.log("구글 로그아웃 스킵:", googleError);
        }
      } else if (provider === "kakao") {
        // 카카오 로그아웃
        try {
          await kakaoLogout();
          console.log("카카오 로그아웃 완료");
        } catch (kakaoError) {
          // 카카오 로그아웃 실패해도 Supabase 로그아웃 진행
          console.log("카카오 로그아웃 스킵:", kakaoError);
        }
      }

      // Supabase 로그아웃 (공통)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("Supabase 로그아웃 완료");
    } catch (error: any) {
      // AuthSessionMissingError: 이미 세션이 없는 경우, 로그아웃 성공으로 처리
      if (error?.message?.includes("Auth session missing!")) {
        console.log("이미 세션이 종료되었습니다.");
      } else {
        console.error("로그아웃 오류:", error);
        throw error;
      }
    } finally {
      // 로컬 상태 초기화
      setAuthState({
        session: null,
        user: null,
        isLoading: false,
      });
    }
  };

  // 계정 탈퇴(연결 해제) 함수
  const deleteAccount = async () => {
    try {
      // 현재 세션에서 프로바이더 정보 확인
      const provider = authState.session?.user?.app_metadata?.provider;
      console.log("탈퇴 프로바이더:", provider);

      // 프로바이더별 연결 해제(탈퇴) 처리
      if (provider === "google") {
        // Google 연결 해제 (revokeAccess: 앱에 부여한 모든 권한 취소)
        try {
          const currentUser = GoogleSignin.getCurrentUser();
          if (currentUser) {
            await GoogleSignin.revokeAccess(); // 권한 완전 취소
            await GoogleSignin.signOut();
            console.log("구글 연결 해제 완료");
          }
        } catch (googleError) {
          console.log("구글 연결 해제 실패:", googleError);
          // 구글 연결 해제 실패해도 Supabase 처리 진행
        }
      } else if (provider === "kakao") {
        // 카카오 연결 해제 (unlink: 카카오 계정과의 연결 완전 해제)
        try {
          await kakaoUnlink();
          console.log("카카오 연결 해제 완료");
        } catch (kakaoError) {
          console.log("카카오 연결 해제 실패:", kakaoError);
          // 카카오 연결 해제 실패해도 Supabase 처리 진행
        }
      }

      // Supabase 로그아웃 (클라이언트에서 직접 사용자 삭제는 불가)
      // 실제 사용자 데이터 삭제는 백엔드 API나 Edge Function에서 처리 필요
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log("계정 탈퇴 처리 완료");
    } catch (error: any) {
      if (error?.message?.includes("Auth session missing!")) {
        console.log("이미 세션이 종료되었습니다.");
      } else {
        console.error("계정 탈퇴 오류:", error);
        throw error;
      }
    } finally {
      // 로컬 상태 초기화
      setAuthState({
        session: null,
        user: null,
        isLoading: false,
      });
    }
  };

  return {
    ...authState,
    signOut,
    deleteAccount,
    isAuthenticated: !!authState.session,
  };
}
