/**
 * supabase/functions/naver-auth/index.ts
 *
 * 네이버 로그인을 위한 Supabase Edge Function
 *
 * @description
 * 네이버는 Supabase의 공식 OAuth provider가 아니므로,
 * 이 Edge Function을 통해 커스텀 인증 플로우를 구현합니다.
 *
 * 플로우:
 * 1. 클라이언트에서 네이버 SDK로 로그인하여 access token 획득
 * 2. 이 Edge Function에 access token 전송
 * 3. 네이버 API로 사용자 정보 조회
 * 4. Supabase 사용자 생성/조회
 * 5. Magic Link 생성 후 verify API 호출하여 유효한 JWT 세션 획득
 * 6. naver_auth 테이블에 토큰 저장
 * 7. 세션을 클라이언트에 반환
 *
 * 테이블 사용:
 * - auth.users: Supabase 기본 사용자 정보 (이메일, 메타데이터)
 * - public.naver_auth: 네이버 토큰 관리 (access_token, refresh_token, 만료시간)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS 헤더 설정
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// =====================================================
// 타입 정의
// =====================================================

/** 네이버 사용자 프로필 API 응답 타입 */
interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email?: string;
    nickname?: string;
    profile_image?: string;
    name?: string;
    mobile?: string;
  };
}

/** 클라이언트 요청 본문 타입 */
interface RequestBody {
  accessToken: string;
  refreshToken?: string;
  /** 네이버 토큰 만료 시간 (초 단위, 기본 3600초 = 1시간) */
  expiresIn?: number;
}

/** 세션 생성 결과 타입 */
interface SessionResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: any;
}

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * 네이버 API를 통해 사용자 프로필을 조회합니다.
 * @param accessToken 네이버 access token
 * @returns 네이버 사용자 프로필
 */
async function fetchNaverProfile(accessToken: string): Promise<NaverProfile> {
  const response = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `네이버 프로필 조회 실패: ${response.status} - ${errorText}`,
    );
  }

  return await response.json();
}

/**
 * 랜덤 비밀번호 생성 (신규 사용자 생성 시 사용)
 * Supabase 사용자 생성에 비밀번호가 필수이지만,
 * 네이버 로그인 사용자는 비밀번호를 직접 사용하지 않습니다.
 */
function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Magic Link에서 토큰을 추출하고 verify API를 호출하여 세션을 생성합니다.
 * @param supabaseUrl Supabase 프로젝트 URL
 * @param supabaseAnonKey Supabase anonymous key
 * @param actionLink generateLink에서 반환된 action_link
 * @returns 유효한 JWT 세션
 */
async function verifyMagicLinkAndGetSession(
  supabaseUrl: string,
  supabaseAnonKey: string,
  actionLink: string,
): Promise<SessionResult> {
  // action_link에서 토큰과 타입 추출
  // 예: https://xxx.supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=...
  const url = new URL(actionLink);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");

  if (!token || !type) {
    throw new Error("Magic link에서 토큰을 추출할 수 없습니다.");
  }

  // Supabase Auth /verify API 호출
  // 이 API는 토큰을 검증하고 유효한 세션을 반환합니다.
  const verifyResponse = await fetch(
    `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=`,
    {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        "Content-Type": "application/json",
      },
      redirect: "manual", // 리다이렉트를 수동으로 처리
    },
  );

  // verify API는 세션 정보를 URL fragment에 포함하여 리다이렉트합니다.
  // redirect_to가 빈 문자열이면 기본 리다이렉트 URL로 이동합니다.
  // 우리는 redirect: "manual"로 설정했으므로 리다이렉트 URL을 확인할 수 있습니다.

  const location = verifyResponse.headers.get("location");

  if (location) {
    // 리다이렉트 URL에서 세션 정보 추출
    // 예: ...#access_token=xxx&refresh_token=xxx&...
    const redirectUrl = new URL(location, supabaseUrl);
    const hash = redirectUrl.hash.substring(1); // # 제거
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");
    const expiresAt = params.get("expires_at");
    const tokenType = params.get("token_type");

    if (accessToken) {
      return {
        access_token: accessToken,
        refresh_token: refreshToken || "",
        expires_in: parseInt(expiresIn || "3600"),
        expires_at: parseInt(
          expiresAt || String(Math.floor(Date.now() / 1000) + 3600),
        ),
        token_type: tokenType || "bearer",
        user: null, // 사용자 정보는 별도로 가져옴
      };
    }
  }

  // 리다이렉트 없이 직접 응답이 온 경우
  if (verifyResponse.ok) {
    const data = await verifyResponse.json();
    if (data.access_token) {
      return data;
    }
  }

  // 오류 응답 처리
  const errorText = await verifyResponse.text();
  throw new Error(`세션 생성 실패: ${verifyResponse.status} - ${errorText}`);
}

/**
 * naver_auth 테이블에 토큰 정보를 저장합니다.
 * @param supabaseAdmin Admin 권한의 Supabase 클라이언트
 * @param userId Supabase 사용자 ID
 * @param naverId 네이버 사용자 ID
 * @param accessToken 네이버 access token
 * @param refreshToken 네이버 refresh token
 * @param expiresIn 토큰 만료 시간 (초)
 */
async function saveNaverAuthToken(
  supabaseAdmin: any,
  userId: string,
  naverId: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn: number = 3600,
): Promise<void> {
  // 토큰 만료 시간 계산
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  // UPSERT: 이미 존재하면 업데이트, 없으면 삽입
  const { error } = await supabaseAdmin.from("naver_auth").upsert(
    {
      user_id: userId,
      naver_id: naverId,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id", // user_id가 같으면 업데이트
    },
  );

  if (error) {
    console.error("naver_auth 저장 오류:", error);
    // 토큰 저장 실패해도 로그인은 진행 (치명적 오류 아님)
  }
}

// =====================================================
// 메인 핸들러
// =====================================================

Deno.serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ===================================================
    // 1. 환경 변수 확인
    // ===================================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        "필수 환경 변수가 설정되지 않았습니다. (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
      );
    }

    if (!supabaseAnonKey) {
      throw new Error(
        "SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다. Supabase Dashboard에서 Edge Function Secrets에 추가하세요.",
      );
    }

    // Supabase Admin 클라이언트 생성 (service_role 권한)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ===================================================
    // 2. 요청 본문 파싱
    // ===================================================
    const {
      accessToken,
      refreshToken,
      expiresIn = 3600,
    }: RequestBody = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "accessToken이 필요합니다." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ===================================================
    // 3. 네이버 사용자 프로필 조회
    // ===================================================
    const naverProfile = await fetchNaverProfile(accessToken);

    if (naverProfile.resultcode !== "00") {
      return new Response(
        JSON.stringify({
          error: "네이버 프로필 조회 실패",
          message: naverProfile.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      id: naverId,
      email,
      nickname,
      profile_image,
      name,
    } = naverProfile.response;

    // 네이버 사용자 고유 ID로 이메일 생성 (이메일 미제공 시)
    const userEmail = email || `naver_${naverId}@naver.placeholder`;

    console.log(`네이버 프로필 조회 성공: ${nickname || name} (${naverId})`);

    // ===================================================
    // 4. 기존 사용자 확인 (네이버 ID로 검색)
    // ===================================================
    // 먼저 naver_auth 테이블에서 네이버 ID로 검색
    const { data: existingNaverAuth } = await supabaseAdmin
      .from("naver_auth")
      .select("user_id")
      .eq("naver_id", naverId)
      .single();

    let user;
    let isNewUser = false;

    if (existingNaverAuth?.user_id) {
      // naver_auth 테이블에 있으면 해당 사용자 조회
      const { data: userData, error: userError } = await supabaseAdmin.auth
        .admin.getUserById(existingNaverAuth.user_id);

      if (!userError && userData?.user) {
        user = userData.user;
        console.log("기존 사용자 확인 (naver_auth):", user.id);
      }
    }

    // naver_auth에 없으면 이메일로 검색
    if (!user && email) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin
        .listUsers();

      if (existingUsers?.users) {
        user = existingUsers.users.find(
          (u) =>
            u.email === email ||
            (u.app_metadata?.provider === "naver" &&
              u.user_metadata?.naver_id === naverId),
        );

        if (user) {
          console.log("기존 사용자 확인 (이메일):", user.id);
        }
      }
    }

    // ===================================================
    // 5. 사용자 생성 또는 업데이트
    // ===================================================
    if (!user) {
      // 5-A. 신규 사용자 생성
      console.log("신규 사용자 생성:", userEmail);
      isNewUser = true;

      const randomPassword = generateRandomPassword();

      const { data: newUser, error: createError } = await supabaseAdmin.auth
        .admin.createUser({
          email: userEmail,
          password: randomPassword,
          email_confirm: true, // 이메일 인증 건너뛰기
          user_metadata: {
            naver_id: naverId,
            nickname: nickname || name,
            avatar_url: profile_image,
            full_name: name,
          },
          app_metadata: {
            provider: "naver",
            providers: ["naver"],
          },
        });

      if (createError) {
        throw new Error(`사용자 생성 실패: ${createError.message}`);
      }

      user = newUser.user;
    } else {
      // 5-B. 기존 사용자 메타데이터 업데이트
      console.log("기존 사용자 메타데이터 업데이트:", user.id);

      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth
        .admin.updateUserById(user.id, {
          user_metadata: {
            naver_id: naverId,
            nickname: nickname || name,
            avatar_url: profile_image,
            full_name: name,
          },
          app_metadata: {
            provider: "naver",
            providers: ["naver"],
          },
        });

      if (updateError) {
        console.warn("메타데이터 업데이트 경고:", updateError.message);
        // 업데이트 실패해도 로그인은 진행
      } else {
        user = updatedUser.user;
      }
    }

    // ===================================================
    // 6. Supabase 세션 생성 (Magic Link 방식)
    // ===================================================
    console.log("세션 생성 시작:", user.email);

    // Magic Link 생성
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin
      .generateLink({
        type: "magiclink",
        email: user.email!,
      });

    if (linkError) {
      throw new Error(`Magic Link 생성 실패: ${linkError.message}`);
    }

    // Magic Link verify API 호출하여 세션 획득
    let session;
    try {
      session = await verifyMagicLinkAndGetSession(
        supabaseUrl,
        supabaseAnonKey,
        linkData.properties.action_link,
      );
      session.user = user; // 사용자 정보 추가

      // Magic Link로 인해 "email"로 설정된 app_metadata를 "naver"로 수정
      // (Magic Link 방식은 기본적으로 provider를 "email"로 설정하므로 재설정 필요)
      const { error: metaUpdateError } = await supabaseAdmin.auth.admin
        .updateUserById(user.id, {
          app_metadata: {
            provider: "naver",
            providers: ["naver"],
          },
        });

      if (metaUpdateError) {
        console.warn("app_metadata 업데이트 실패:", metaUpdateError.message);
      } else {
        console.log("app_metadata를 naver로 업데이트 완료");
      }
    } catch (verifyError) {
      console.error("세션 생성 오류:", verifyError);

      // 세션 생성 실패 시 기본 세션 구조 반환
      // 클라이언트에서 재시도하거나 대안 로직 수행 필요
      session = {
        access_token: "",
        refresh_token: "",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: user,
      };
    }

    // ===================================================
    // 7. naver_auth 테이블에 토큰 저장
    // ===================================================
    await saveNaverAuthToken(
      supabaseAdmin,
      user.id,
      naverId,
      accessToken,
      refreshToken,
      expiresIn,
    );

    // ===================================================
    // 8. 응답 반환
    // ===================================================
    return new Response(
      JSON.stringify({
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
          token_type: session.token_type,
        },
        user: {
          id: user.id,
          email: user.email,
          naver_id: naverId,
          nickname: nickname || name,
          avatar_url: profile_image,
          provider: "naver",
          is_new_user: isNewUser,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Edge Function 오류:", error);

    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
