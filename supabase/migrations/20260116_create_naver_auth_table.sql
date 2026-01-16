-- 네이버 인증 토큰 저장 테이블
CREATE TABLE public.naver_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  naver_id VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (Edge Function은 service_role로 접근)
ALTER TABLE public.naver_auth ENABLE ROW LEVEL SECURITY;

-- 일반 사용자는 접근 불가 (Edge Function만 service_role로 관리)
-- 필요시 본인 정보 조회만 허용
CREATE POLICY "Users can view own naver_auth" ON public.naver_auth
  FOR SELECT USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_naver_auth_naver_id ON public.naver_auth(naver_id);
CREATE INDEX idx_naver_auth_user_id ON public.naver_auth(user_id);