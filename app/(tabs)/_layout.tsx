import { GlobalStyles, tabBarIcons } from "@/constants";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GlobalStyles.bg.bgColor2,
        headerShown: false,
        tabBarStyle: {
          height: 82,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        tabBarLabelStyle: {
          marginTop: 3,
          fontSize: 12,
          letterSpacing: -0.3,
          lineHeight: 18,
          fontWeight: "500",
          fontFamily: GlobalStyles.pretendard.medium,
          textAlign: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                marginTop: 3,
                fontSize: 12,
                letterSpacing: -0.3,
                lineHeight: 18,
                fontWeight: "500",
                fontFamily: GlobalStyles.pretendard.medium,
                color: focused
                  ? GlobalStyles.text.textColor80
                  : GlobalStyles.text.textColor70,
                textAlign: "center",
              }}
            >
              홈
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused
                  ? tabBarIcons.tabHomeActiveIcon
                  : tabBarIcons.tabHomeIcon
              }
              style={{ width: 25, height: 25 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "내책장",
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                marginTop: 3,
                fontSize: 12,
                letterSpacing: -0.3,
                lineHeight: 18,
                fontWeight: "500",
                fontFamily: GlobalStyles.pretendard.medium,
                color: focused
                  ? GlobalStyles.text.textColor80
                  : GlobalStyles.text.textColor70,
                textAlign: "center",
              }}
            >
              내책장
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused
                  ? tabBarIcons.tabLibraryActiveIcon
                  : tabBarIcons.tabLibraryIcon
              }
              style={{ width: 25, height: 25 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "마이",
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                marginTop: 3,
                fontSize: 12,
                letterSpacing: -0.3,
                lineHeight: 18,
                fontWeight: "500",
                fontFamily: GlobalStyles.pretendard.medium,
                color: focused
                  ? GlobalStyles.text.textColor80
                  : GlobalStyles.text.textColor70,
                textAlign: "center",
              }}
            >
              마이
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused ? tabBarIcons.tabMyActiveIcon : tabBarIcons.tabMyIcon
              }
              style={{ width: 25, height: 25 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
