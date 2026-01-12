import { GlobalStyles } from "@/constants";
import { getSecureStore } from "@/utils/secureStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = async () => {
      const token = await getSecureStore("token");
      setIsLoggedIn(!!token);
    };

    checkAuth();
  }, []);

  const handleLoginPress = () => {
    router.push("/auth");
  };

  if (isLoggedIn === null) {
    // 로딩 중
    return (
      <SafeAreaView style={styles.container}>
        <View>
          <Text>홈</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>홈</Text>
        {!isLoggedIn && (
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
});
