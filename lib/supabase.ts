import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// 환경 변수
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 디버깅: 환경 변수 확인 (프로덕션에서는 제거)
if (__DEV__) {
  console.log("Supabase URL:", supabaseUrl ? "설정됨" : "없음");
  console.log("Supabase Key:", supabaseAnonKey ? "설정됨" : "없음");
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: AsyncStorage, // AsyncStorage는 2048바이트 제한 없음
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native에서는 false
  },
});
