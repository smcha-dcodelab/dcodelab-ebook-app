import { GlobalStyles } from "@/constants";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: GlobalStyles.tint.tint2,
        contentStyle: {
          backgroundColor: GlobalStyles.bg.bgColor1,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "로그인",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
