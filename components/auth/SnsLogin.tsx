import { GlobalStyles } from "@/constants";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SnsLoginButtonProps {
  /** 버튼 텍스트 */
  label: string;
  /** 버튼 배경색 */
  backgroundColor: string;
  /** 텍스트 색상 */
  textColor: string;
  /** 아이콘 이미지 소스 */
  iconSource: any;
  /** 클릭 핸들러 */
  onPress?: () => void;
}

/**
 * SNS 로그인 버튼 컴포넌트
 */
const SnsLoginButton: React.FC<SnsLoginButtonProps> = ({
  label,
  backgroundColor,
  textColor,
  iconSource,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.loginButton, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.loginButtonText, { color: textColor }]}>
        {label}
      </Text>
      {iconSource && (
        <Image
          source={iconSource}
          style={styles.loginIcon}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
};

interface SnsLoginProps {
  /** 안내 메시지 표시 여부 */
  showMessage?: boolean;
  /** 로고 표시 여부 */
  showLogo?: boolean;
}

/**
 * SnsLogin 컴포넌트
 *
 * SNS 로그인 버튼들을 제공하는 컴포넌트입니다.
 * 구글, 카카오, 네이버 로그인 버튼을 포함합니다.
 */
const SnsLogin = ({ showMessage = true, showLogo = false }: SnsLoginProps) => {
  const handleGoogleLogin = () => {
    // TODO: 구글 로그인 로직 구현
    console.log("구글 로그인");
  };

  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 로직 구현
    console.log("카카오 로그인");
  };

  const handleNaverLogin = () => {
    // TODO: 네이버 로그인 로직 구현
    console.log("네이버 로그인");
  };

  return (
    <View style={styles.container}>
      {/* 로고 영역 */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/icons/login/storinlab.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* 안내 메시지 */}
      {showMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            '마이' 메뉴는 {"\n"}로그인 후 이용할 수 있어요
          </Text>
        </View>
      )}

      {/* SNS 로그인 버튼 영역 */}
      <View style={styles.loginButtonsContainer}>
        <View style={styles.loginButtons}>
          <SnsLoginButton
            label="구글로 로그인하기"
            backgroundColor={GlobalStyles.bg.bgColor100}
            textColor={GlobalStyles.text.textColor80}
            iconSource={require("@/assets/icons/login/google.png")}
            onPress={handleGoogleLogin}
          />
          <SnsLoginButton
            label="카카오로 로그인하기"
            backgroundColor={GlobalStyles.bg.bgColor140}
            textColor={GlobalStyles.text.textColor80}
            iconSource={require("@/assets/icons/login/kakao.png")}
            onPress={handleKakaoLogin}
          />
          <SnsLoginButton
            label="네이버로 로그인하기"
            backgroundColor="#03C75A"
            textColor={GlobalStyles.text.textColor10}
            iconSource={require("@/assets/icons/login/naver.png")}
            onPress={handleNaverLogin}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 168,
    paddingHorizontal: 20,
    paddingTop: 0,
    width: "100%",
  },
  logoContainer: {
    marginTop: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 148,
    height: 24,
  },
  messageContainer: {
    width: "100%",
    marginTop: 20,
  },
  messageText: {
    fontSize: 20,
    letterSpacing: -0.5,
    lineHeight: 24,
    fontWeight: 700,
    textAlign: "left",
    color: GlobalStyles.text.textColor30,
    fontFamily: GlobalStyles.pretendard.bold,
    alignSelf: "stretch",
  },
  loginButtonsContainer: {
    height: 176,
    alignItems: "center",
    width: "100%",
  },
  loginButtons: {
    gap: 9,
    width: "100%",
  },
  loginButton: {
    gap: 10,
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: 100,
    height: 50,
    alignItems: "center",
    alignSelf: "stretch",
    position: "relative",
  },
  loginButtonText: {
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 17,
    letterSpacing: -0.3,
    fontSize: 14,
    fontFamily: GlobalStyles.pretendard.semiBold,
  },
  loginIcon: {
    width: 30,
    height: 30,
    position: "absolute",
    left: 13,
  },
});

export default SnsLogin;
