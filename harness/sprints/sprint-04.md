# Sprint 4: Supabase 서비스 레이어 추출

## 상태: 완료

## 스프린트 계약 (Generator ↔ Evaluator 합의)

### 구현 범위
1. `src/supabaseClient.js`에 7개 서비스 그룹 추가
2. `src/FamilyDay.jsx`에서 `supabase` 직접 import 제거
3. 모든 `supabase.*` 호출을 서비스 함수로 교체 (41개 → 0개)

### 41개 호출 분류

| 그룹 | 테이블/API | 호출 수 | 위치 |
|------|---------|--------|------|
| `authDB` | supabase.auth.* | 10 | AuthPage, FamilyDay |
| `familyDB` | family_members, families, family_invites | 14 | MyPage, FamilyDay |
| `loadFamily` | (위 DB 포함, 함수 이전) | — | FamilyDay 내부 함수 |
| `loadAllFamilyData` | todos, events, coupons, family_settings | 4 | FamilyDay useEffect |
| `todoDB` | todos | 7 | FamilyDay |
| `eventDB` | events | 2 | FamilyDay |
| `couponDB` | coupons | 4 | FamilyDay |
| `settingsDB` | family_settings | 1 | FamilyDay |

### supabaseClient.js 추가 스펙

```js
// ─── AUTH ───
export const authDB = {
  signUp: (email, password, redirectTo) =>
    supabase.auth.signUp({email, password, options:{emailRedirectTo:redirectTo}}),
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({email, password}),
  signOut: () => supabase.auth.signOut(),
  resetPassword: (email, redirectTo) =>
    supabase.auth.resetPasswordForEmail(email, {redirectTo}),
  updatePassword: (password) => supabase.auth.updateUser({password}),
  getUser: () => supabase.auth.getUser(),
  getSession: () => supabase.auth.getSession(),
  verifyOtp: (params) => supabase.auth.verifyOtp(params),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
};

// ─── FAMILY ───
export const familyDB = {
  getMemberByUserId: (userId) =>
    supabase.from("family_members").select("family_id").eq("user_id",userId).limit(1).single(),
  getMembersByFamilyId: (familyId) =>
    supabase.from("family_members").select("*").eq("family_id",familyId).order("created_at"),
  insertMember: (member) => supabase.from("family_members").insert(member),
  insertMemberReturningId: (familyId, member) =>
    supabase.from("family_members").insert({family_id:familyId,name:member.name,role:member.role,emoji:member.emoji}).select("id").single(),
  deleteMemberById: (id) => supabase.from("family_members").delete().eq("id",id),
  deleteMemberByUserId: (userId) => supabase.from("family_members").delete().eq("user_id",userId),
  createFamily: (id) => supabase.from("families").insert({id,name:"우리 가족"}),
  createInvite: (invite) => supabase.from("family_invites").insert(invite),
  getInviteByCode: (code) =>
    supabase.from("family_invites").select("*").eq("code",code).is("used_by",null).gt("expires_at",new Date().toISOString()).single(),
  useInvite: (id, userId) => supabase.from("family_invites").update({used_by:userId}).eq("id",id),
};

// ─── LOAD FAMILY (FamilyDay 내 함수 이전) ───
export async function loadFamily(userId) {
  const {data:memberRow} = await familyDB.getMemberByUserId(userId);
  let familyId = memberRow?.family_id;
  if(!familyId){
    const pendingRaw = localStorage.getItem("fd_pending_invite");
    if(pendingRaw){
      const pending = JSON.parse(pendingRaw);
      localStorage.removeItem("fd_pending_invite");
      const {data:invite} = await familyDB.getInviteByCode(pending.code);
      if(invite){
        familyId = invite.family_id;
        const {data:{user:authUser}} = await authDB.getUser();
        await familyDB.insertMember({family_id:familyId,user_id:userId,name:authUser.email.split("@")[0],role:pending.role||"부모",emoji:pending.emoji||"👩"});
        await familyDB.useInvite(invite.id, userId);
      }
    }
    if(!familyId){
      familyId = crypto.randomUUID();
      await familyDB.createFamily(familyId);
      const {data:{user:authUser}} = await authDB.getUser();
      await familyDB.insertMember({family_id:familyId,user_id:userId,name:authUser.email.split("@")[0],role:"부모",emoji:"👩"});
    }
  }
  const {data:members} = await familyDB.getMembersByFamilyId(familyId);
  return {familyId, members:(members||[]).map(m=>({id:m.id,name:m.name,role:m.role,emoji:m.emoji,userId:m.user_id}))};
}

// ─── DATA LOAD ───
export function loadAllFamilyData(familyId) {
  return Promise.all([
    supabase.from("todos").select("*").eq("family_id",familyId),
    supabase.from("events").select("*").eq("family_id",familyId),
    supabase.from("coupons").select("*").eq("family_id",familyId),
    supabase.from("family_settings").select("*").eq("family_id",familyId).single(),
  ]);
}

// ─── TODOS ───
export const todoDB = {
  add: (item, familyId) => supabase.from("todos").insert({id:item.id,text:item.text,owner:item.owner,is_done:item.isDone||false,star_reward:item.starReward||1,created_date:item.createdDate,is_weekly:item.isWeekly||false,family_id:familyId}).then(()=>{}),
  done: (id, dk) => supabase.from("todos").update({is_done:true,done_date:dk}).eq("id",id).then(()=>{}),
  undone: (id) => supabase.from("todos").update({is_done:false,done_date:null}).eq("id",id).then(()=>{}),
  delete: (id) => supabase.from("todos").delete().eq("id",id).then(()=>{}),
  edit: (todo) => supabase.from("todos").update({text:todo.text,owner:todo.owner,star_reward:todo.starReward,is_weekly:todo.isWeekly}).eq("id",todo.id).then(()=>{}),
};

// ─── EVENTS ───
export const eventDB = {
  add: (ev, familyId) => supabase.from("events").insert({id:ev.id,title:ev.title,date:ev.date,start_hour:ev.startHour,start_min:ev.startMin,end_hour:ev.endHour,end_min:ev.endMin,color:ev.color,emoji:ev.emoji,family_id:familyId}).then(()=>{}),
};

// ─── COUPONS ───
export const couponDB = {
  add: (c, familyId) => supabase.from("coupons").insert({id:c.id,star_cost:c.starCost,title:c.title,description:c.desc,emoji:c.emoji,family_id:familyId}).then(()=>{}),
  delete: (id) => supabase.from("coupons").delete().eq("id",id).then(()=>{}),
  edit: (c) => supabase.from("coupons").update({star_cost:c.starCost,title:c.title,description:c.desc,emoji:c.emoji}).eq("id",c.id).then(()=>{}),
};

// ─── SETTINGS ───
export const settingsDB = {
  upsertStars: (familyId, stars) => supabase.from("family_settings").upsert({family_id:familyId,stars,updated_at:new Date().toISOString()},{onConflict:"family_id"}).then(()=>{}),
};
```

### FamilyDay.jsx import 변경
```js
// Before
import { supabase } from "./supabaseClient";

// After
import { authDB, familyDB, loadFamily, loadAllFamilyData, todoDB, eventDB, couponDB, settingsDB } from "./supabaseClient";
```

### 성공 기준 (Evaluator 체크리스트)
- [ ] `pnpm build` 성공
- [ ] `src/FamilyDay.jsx` 내 `supabase\.` 패턴 0개 (grep)
- [ ] `src/supabaseClient.js`에 7개 서비스 그룹 정의 확인
- [ ] `loadFamily` 함수가 FamilyDay.jsx에서 제거되고 supabaseClient.js에 존재
- [ ] `loadAllFamilyData` supabaseClient.js에 정의
- [ ] todoDB, eventDB, couponDB, settingsDB 각 사용처 확인

## 구현 노트 (Generator 작성)
- 상태: **완료**
- Sprint 3 후 줄 수: 2662 → Sprint 4 후: 2611 (-51줄)
  - FamilyDay 내 loadFamily 함수 이전(-33줄) + 41개 직접 호출 → 서비스 함수 교체(-18줄 순감소)
- pnpm build: **성공** (dist/assets/index-CJ4b8_Nq.js, 432.52 kB)

### supabaseClient.js 추가 내용
| 그룹 | 함수/상수 | 설명 |
|------|---------|------|
| `authDB` | 9개 메서드 | auth.* 래퍼 |
| `familyDB` | 10개 메서드 | family_members, families, family_invites |
| `loadFamily` | 함수 | FamilyDay에서 이전, localStorage 로직 포함 |
| `loadAllFamilyData` | 함수 | Promise.all 4개 테이블 |
| `todoDB` | 5개 메서드 | todos CRUD |
| `eventDB` | 1개 메서드 | events add |
| `couponDB` | 3개 메서드 | coupons CRUD |
| `settingsDB` | 1개 메서드 | family_settings upsert |

### FamilyDay.jsx 변경 사항
- import: `supabase` → 7개 서비스 모듈
- 로컬 `loadFamily` 함수 제거 (-33줄)
- 41개 `supabase.*` 직접 호출 → 서비스 함수 교체
- `supabase.` 직접 호출: **0개**

## 평가 결과
- 상태: **PASS (99점)**
- 상세: `harness/evals/eval-04.md` 참조
