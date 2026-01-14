import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyScreen() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const router = useRouter();

  // 인증 상태 변경 시 리다이렉트
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 로딩 완료 후 미인증 상태면 로그인 페이지로 이동
      router.replace("/auth?from=my");
    }
  }, [isLoading, isAuthenticated, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // 미인증 상태 (리다이렉트 대기 중)
  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert("오류", error.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileSection}>
          <Text style={styles.welcomeText}>환영합니다!</Text>
          <Text style={styles.nameText}>
            {user?.user_metadata?.full_name || user?.email}
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>계정 정보</Text>
          <InfoRow label="Provider" value="Google" />
          <InfoRow label="User ID" value={user?.id?.slice(0, 8) + "..."} />
          <InfoRow
            label="가입일"
            value={new Date(user?.created_at || "").toLocaleDateString("ko-KR")}
          />
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: "#666",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#fff",
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
