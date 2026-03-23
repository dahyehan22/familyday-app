-- ============================================
-- FamilyDay RLS 설정 스크립트
-- Supabase SQL Editor에서 실행
-- ============================================

-- ────────────────────────────────────────────
-- 1단계: family_id 컬럼 추가 (없는 테이블에)
-- ────────────────────────────────────────────

-- todos 테이블에 family_id 추가
ALTER TABLE todos ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id);

-- events 테이블에 family_id 추가
ALTER TABLE events ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id);

-- coupons 테이블에 family_id 추가
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id);

-- family_settings 테이블에 family_id 추가
ALTER TABLE family_settings ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id);

-- ────────────────────────────────────────────
-- 2단계: 사용자의 family_id를 조회하는 헬퍼 함수
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT family_id FROM family_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ────────────────────────────────────────────
-- 3단계: RLS 활성화
-- ────────────────────────────────────────────

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- 4단계: RLS 정책 설정
-- ────────────────────────────────────────────

-- == families ==
-- 자기 가족만 조회
CREATE POLICY "families_select" ON families FOR SELECT USING (
  id = get_my_family_id()
);
-- 로그인한 사용자 누구나 가족 생성 가능 (첫 가입 시)
CREATE POLICY "families_insert" ON families FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- == family_members ==
-- 같은 가족 구성원만 조회
CREATE POLICY "family_members_select" ON family_members FOR SELECT USING (
  family_id = get_my_family_id()
);
-- 같은 가족에 구성원 추가 (본인 가족 또는 첫 가입 시)
CREATE POLICY "family_members_insert" ON family_members FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
-- 같은 가족 구성원만 삭제
CREATE POLICY "family_members_delete" ON family_members FOR DELETE USING (
  family_id = get_my_family_id()
);

-- == todos ==
-- 같은 가족의 할일만 조회
CREATE POLICY "todos_select" ON todos FOR SELECT USING (
  family_id = get_my_family_id()
);
-- 자기 가족에만 할일 추가
CREATE POLICY "todos_insert" ON todos FOR INSERT WITH CHECK (
  family_id = get_my_family_id()
);
-- 자기 가족 할일만 수정
CREATE POLICY "todos_update" ON todos FOR UPDATE USING (
  family_id = get_my_family_id()
);
-- 자기 가족 할일만 삭제
CREATE POLICY "todos_delete" ON todos FOR DELETE USING (
  family_id = get_my_family_id()
);

-- == events ==
CREATE POLICY "events_select" ON events FOR SELECT USING (
  family_id = get_my_family_id()
);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  family_id = get_my_family_id()
);
CREATE POLICY "events_update" ON events FOR UPDATE USING (
  family_id = get_my_family_id()
);
CREATE POLICY "events_delete" ON events FOR DELETE USING (
  family_id = get_my_family_id()
);

-- == coupons ==
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (
  family_id = get_my_family_id()
);
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (
  family_id = get_my_family_id()
);
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (
  family_id = get_my_family_id()
);
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (
  family_id = get_my_family_id()
);

-- == family_settings ==
CREATE POLICY "family_settings_select" ON family_settings FOR SELECT USING (
  family_id = get_my_family_id()
);
CREATE POLICY "family_settings_insert" ON family_settings FOR INSERT WITH CHECK (
  family_id = get_my_family_id()
);
CREATE POLICY "family_settings_update" ON family_settings FOR UPDATE USING (
  family_id = get_my_family_id()
);

-- == family_invites ==
-- 같은 가족의 초대만 조회
CREATE POLICY "family_invites_select" ON family_invites FOR SELECT USING (
  family_id = get_my_family_id()
);
-- 자기 가족에서만 초대 생성
CREATE POLICY "family_invites_insert" ON family_invites FOR INSERT WITH CHECK (
  family_id = get_my_family_id()
);
-- 초대 코드로 합류 시 업데이트 (누구나 코드 입력 가능)
CREATE POLICY "family_invites_update" ON family_invites FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
