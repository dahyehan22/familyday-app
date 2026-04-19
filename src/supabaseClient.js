import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// ─── LOAD FAMILY ───
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
  const memberList=(members||[]).map(m=>({id:m.id,name:m.name,role:m.role,emoji:m.emoji,userId:m.user_id}));
  const myMember=memberList.find(m=>m.userId===userId);
  return {familyId, members:memberList, role:myMember?.role||"부모"};
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
