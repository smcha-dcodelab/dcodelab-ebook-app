import { GlobalStyles } from "@/constants";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyScreen() {
  // useAuth에서 Supabase 세션 기반 인증 상태 관리
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  const handleLoginPress = () => {
    router.push("/auth");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>홈</Text>
        {!isAuthenticated && (
          <Pressable onPress={handleLoginPress} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>로그인 이동</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.bg.bgColor1,
  },
  loginButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
