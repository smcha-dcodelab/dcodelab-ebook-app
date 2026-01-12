import { GlobalStyles } from "@/constants";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface TopHeaderProps {
  /** 왼쪽 아이콘 컴포넌트 (선택적) */
  leftIcon?: React.ReactNode;
  /** 왼쪽 아이콘 클릭 핸들러 (선택적) */
  onLeftIconPress?: () => void;
  /** 중앙 라벨 텍스트 (선택적) */
  centerLabel?: string;
  /** 중앙 라벨 클릭 핸들러 (선택적) */
  onCenterLabelPress?: () => void;
  /** 오른쪽 라벨 텍스트 (선택적) */
  rightLabel?: string;
  /** 오른쪽 라벨 클릭 핸들러 (선택적) */
  onRightLabelPress?: () => void;
}

/**
 * TopHeader 컴포넌트
 *
 * 가로로 세 부분으로 나뉘어진 헤더 컴포넌트입니다.
 * - 왼쪽: 아이콘 (선택적)
 * - 중앙: 라벨 (선택적)
 * - 오른쪽: 라벨 (선택적)
 *
 * @example
 * ```tsx
 * <TopHeader
 *   leftIcon={<Image source={require('./icon.png')} />}
 *   onLeftIconPress={() => router.back()}
 *   centerLabel="제목"
 *   rightLabel="닫기"
 *   onRightLabelPress={() => router.back()}
 * />
 * ```
 */
const TopHeader = ({
  leftIcon,
  onLeftIconPress,
  centerLabel,
  onCenterLabelPress,
  rightLabel,
  onRightLabelPress,
}: TopHeaderProps) => {
  return (
    <View style={styles.container}>
      {/* 왼쪽 아이콘 영역 */}
      <View style={styles.leftSection}>
        {leftIcon && (
          <Pressable
            style={styles.iconContainer}
            onPress={onLeftIconPress}
            disabled={!onLeftIconPress}
          >
            {leftIcon}
          </Pressable>
        )}
      </View>

      {/* 중앙 라벨 영역 */}
      <View style={styles.centerSection}>
        {centerLabel && (
          <Pressable
            style={styles.labelContainer}
            onPress={onCenterLabelPress}
            disabled={!onCenterLabelPress}
          >
            <Text style={styles.centerLabelText}>{centerLabel}</Text>
          </Pressable>
        )}
      </View>

      {/* 오른쪽 라벨 영역 */}
      <View style={styles.rightSection}>
        {rightLabel && (
          <Pressable
            style={styles.labelContainer}
            onPress={onRightLabelPress}
            disabled={!onRightLabelPress}
          >
            <Text style={styles.rightLabelText}>{rightLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.bg.bgColor1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 5,
    width: "100%",
  },
  leftSection: {
    flex: 0,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSection: {
    flex: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  labelContainer: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  centerLabelText: {
    fontSize: 14,
    letterSpacing: -0.3,
    lineHeight: 17,
    fontWeight: "600",
    fontFamily: GlobalStyles.pretendard.semiBold,
    color: GlobalStyles.text.textColor80,
    textAlign: "center",
  },
  rightLabelText: {
    fontSize: 14,
    letterSpacing: -0.3,
    lineHeight: 17,
    fontWeight: "600",
    fontFamily: GlobalStyles.pretendard.semiBold,
    color: GlobalStyles.text.textColor80,
    textAlign: "center",
  },
});

export default TopHeader;
