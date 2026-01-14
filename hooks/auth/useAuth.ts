import { supabase } from "@/lib/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

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
    // 초기 세션 확인
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setAuthState({
          session,
          user: session?.user ?? null,
          isLoading: false,
        });
      } catch (error) {
        console.error("세션 확인 오류:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      setAuthState({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 로그아웃 함수
  const signOut = async () => {
    try {
      // Google 로그아웃
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
      }

      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("로그아웃 오류:", error);
      throw error;
    }
  };

  return {
    ...authState,
    signOut,
    isAuthenticated: !!authState.session,
  };
}
