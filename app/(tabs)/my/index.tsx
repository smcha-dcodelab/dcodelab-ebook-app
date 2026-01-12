import { getSecureStore } from "@/utils/secureStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyScreen() {
  const router = useRouter();

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = async () => {
      const token = await getSecureStore("token");
      if (!token) {
        // 토큰이 없으면 로그인 페이지로 리다이렉트 (마이 탭에서 진입)
        router.replace("/auth?from=my");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>마이</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
