import SnsLogin from "@/components/auth/SnsLogin";
import TopHeader from "@/components/common/TopHeader";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isFromMy = from === "my";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TopHeader
        rightLabel="닫기"
        onRightLabelPress={() => router.replace("/(tabs)")}
      />
      <View style={styles.content}>
        <SnsLogin showMessage={isFromMy} showLogo={!isFromMy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
});
