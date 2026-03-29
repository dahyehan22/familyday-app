import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "./supabaseClient";

/* ─── colour tokens ─── */
const C = {
  primary: "#6C63FF",
  primaryLight: "#8B83FF",
  primaryDark: "#5549E8",
  secondary: "#FF6584",
  secondaryLight: "#FF8DA4",
  accent: "#43D4A0",
  accentLight: "#6EEDBE",
  gold: "#FFD700",
  goldLight: "#FFE44D",
  bg: "#F4F5FF",
  card: "#FFFFFF",
  textDark: "#2D2B55",
  textMid: "#6E6B99",
  textLight: "#A9A6C8",
  border: "#EEEDFC",
  momTag: "#FF6584",
  kidTag: "#6C63FF",
};

/* ─── fonts ─── */
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap";
fl.rel = "stylesheet";
if (!document.querySelector(`link[href="${fl.href}"]`)) document.head.appendChild(fl);

/* ─── keyframes ─── */
const SID = "fd-kf";
if (!document.getElementById(SID)) {
  const s = document.createElement("style"); s.id = SID;
  s.textContent = `
    @keyframes starFly{0%{opacity:1;transform:translate(0,0) scale(1) rotate(0deg)}60%{opacity:1;transform:translate(var(--tx),var(--ty)) scale(1.6) rotate(200deg)}100%{opacity:0;transform:translate(var(--tx),calc(var(--ty) - 120px)) scale(.4) rotate(360deg)}}
    @keyframes pop{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
    @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,.25)}50%{box-shadow:0 0 0 10px rgba(108,99,255,0)}}
    @keyframes confetti{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr))}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes checkPop{0%{transform:scale(0) rotate(-45deg)}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0)}}
    @keyframes strikethrough{from{width:0}to{width:100%}}
    @keyframes slideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes slideRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes glowRing{0%,100%{box-shadow:0 0 0 0 rgba(67,212,160,.5),0 0 20px rgba(67,212,160,.2)}50%{box-shadow:0 0 0 12px rgba(67,212,160,0),0 0 30px rgba(67,212,160,.15)}}
    @keyframes glowRingCurrent{0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,.5),0 0 24px rgba(108,99,255,.25)}50%{box-shadow:0 0 0 14px rgba(108,99,255,0),0 0 32px rgba(108,99,255,.15)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes dashDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    body{margin:0;padding:0;font-family:'Nunito',sans-serif;background:${C.bg}}
    ::-webkit-scrollbar{width:0;height:0}
  `;
  document.head.appendChild(s);
}

/* ─── helpers ─── */
let _id = 100;
const uid = () => `t${++_id}`;
const DAYS_KR = ["일","월","화","수","목","금","토"];
const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
function isSameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function getWeekDates(base){const d=new Date(base);const day=d.getDay();const mon=new Date(d);mon.setDate(d.getDate()-((day+6)%7));return Array.from({length:7},(_,i)=>{const dd=new Date(mon);dd.setDate(mon.getDate()+i);return dd;});}
function getMonthGrid(year,month){const first=new Date(year,month,1);const sd=first.getDay();const dim=new Date(year,month+1,0).getDate();const rows=[];let row=Array(sd).fill(null);for(let d=1;d<=dim;d++){row.push(d);if(row.length===7){rows.push(row);row=[];}}if(row.length){while(row.length<7)row.push(null);rows.push(row);}return rows;}
function fmtDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getWeekStartDate(d){const dd=new Date(d);const day=dd.getDay();dd.setDate(dd.getDate()-((day+6)%7));dd.setHours(0,0,0,0);return dd;}

/* ─── data ─── */
const SAMPLE_EVENTS = [
  {id:"e1",title:"등교 데려다주기",date:"2026-03-12",startHour:8,startMin:30,endHour:9,endMin:0,color:"#FF6584",emoji:"🚗"},
  {id:"e2",title:"학교 수업",date:"2026-03-12",startHour:9,startMin:0,endHour:12,endMin:0,color:"#FF6584",emoji:"🏫"},
  {id:"e3",title:"피아노 레슨",date:"2026-03-12",startHour:14,startMin:0,endHour:15,endMin:0,color:"#6C63FF",emoji:"🎹"},
  {id:"e4",title:"수영 수업",date:"2026-03-13",startHour:10,startMin:0,endHour:11,endMin:0,color:"#43D4A0",emoji:"🏊"},
  {id:"e5",title:"가족 저녁식사",date:"2026-03-12",startHour:18,startMin:0,endHour:19,endMin:30,color:"#43D4A0",emoji:"🍽️"},
  {id:"e6",title:"영어 학원",date:"2026-03-11",startHour:15,startMin:0,endHour:16,endMin:30,color:"#FFB347",emoji:"📚"},
  {id:"e7",title:"태권도",date:"2026-03-14",startHour:16,startMin:0,endHour:17,endMin:0,color:"#DDA0DD",emoji:"🥋"},
  {id:"e8",title:"피아노 발표회",date:"2026-03-14",startHour:10,startMin:0,endHour:12,endMin:0,color:"#6C63FF",emoji:"🎹"},
  {id:"e9",title:"가족 소풍",date:"2026-03-21",startHour:10,startMin:0,endHour:16,endMin:0,color:"#43D4A0",emoji:"🌳"},
  {id:"e10",title:"학교 축제",date:"2026-03-26",startHour:9,startMin:0,endHour:15,endMin:0,color:"#FF6584",emoji:"🎉"},
  {id:"e11",title:"미술 수업",date:"2026-03-10",startHour:13,startMin:0,endHour:14,endMin:30,color:"#DDA0DD",emoji:"🎨"},
  {id:"e12",title:"친구 생일파티",date:"2026-03-15",startHour:14,startMin:0,endHour:17,endMin:0,color:"#FFB347",emoji:"🎂"},
];
const INITIAL_SCHEDULE = [
  {id:"s1",time:"08:30",label:"등교 데려다주기",emoji:"🚗",color:C.secondary},
  {id:"s2",time:"14:00",label:"피아노 레슨",emoji:"🎹",color:C.primary},
  {id:"s3",time:"18:00",label:"가족 저녁식사",emoji:"🍽️",color:C.accent},
];
const TODAY_KEY=fmtDateKey(new Date());
const WEEK_START_KEY=fmtDateKey(getWeekStartDate(new Date()));
const INITIAL_TODOS = [
  {id:"t1",text:"장보기",owner:"mom",isDone:true,starReward:1,createdDate:TODAY_KEY,isWeekly:false},
  {id:"t2",text:"학원비 납부",owner:"mom",isDone:false,starReward:1,createdDate:TODAY_KEY,isWeekly:false},
  {id:"t3",text:"이메일 답장",owner:"mom",isDone:false,starReward:1,createdDate:TODAY_KEY,isWeekly:false},
  {id:"t4",text:"책 읽기 30분",owner:"kid",isDone:false,starReward:1,createdDate:TODAY_KEY,isWeekly:true},
  {id:"t5",text:"수학 숙제",owner:"kid",isDone:false,starReward:1,createdDate:TODAY_KEY,isWeekly:false},
];

/* ─── Timeline schedule ─── */
const TIMELINE_ITEMS = [
  {id:"tl1",time:"07:00",hour:7,min:0,label:"기상",emoji:"🌅"},
  {id:"tl2",time:"07:30",hour:7,min:30,label:"아침식사",emoji:"🍳"},
  {id:"tl3",time:"08:00",hour:8,min:0,label:"등교 준비",emoji:"🎒"},
  {id:"tl4",time:"09:00",hour:9,min:0,label:"학교",emoji:"🏫"},
  {id:"tl5",time:"12:00",hour:12,min:0,label:"점심시간",emoji:"🍱"},
  {id:"tl6",time:"14:00",hour:14,min:0,label:"숙제",emoji:"📝"},
  {id:"tl7",time:"15:00",hour:15,min:0,label:"피아노",emoji:"🎹"},
  {id:"tl8",time:"16:00",hour:16,min:0,label:"놀이시간",emoji:"⚽"},
  {id:"tl9",time:"18:00",hour:18,min:0,label:"저녁식사",emoji:"🍽️"},
  {id:"tl10",time:"19:30",hour:19,min:30,label:"자유시간",emoji:"📺"},
  {id:"tl11",time:"21:00",hour:21,min:0,label:"취침",emoji:"🌙"},
];

/* ─── Coupon rewards (initial / default) ─── */
const INITIAL_COUPONS = [
  {id:"cp1",starCost:3,title:"간식 선택권",desc:"원하는 간식 하나 고르기",emoji:"🍪"},
  {id:"cp2",starCost:5,title:"30분 추가 놀이",desc:"자유시간 30분 연장",emoji:"🎮"},
  {id:"cp3",starCost:8,title:"영화 감상권",desc:"원하는 영화 한 편 보기",emoji:"🎬"},
  {id:"cp4",starCost:10,title:"외식 선택권",desc:"원하는 메뉴로 외식하기",emoji:"🍕"},
  {id:"cp5",starCost:15,title:"장난감 교환권",desc:"15,000원 이하 장난감 선물",emoji:"🧸"},
  {id:"cp6",starCost:20,title:"놀이공원 이용권",desc:"주말 놀이공원 나들이",emoji:"🎡"},
  {id:"cp7",starCost:30,title:"특별한 하루",desc:"원하는 곳 어디든 가족 나들이",emoji:"✈️"},
];

const COUPON_EMOJI_OPTIONS = ["🍪","🎮","🎬","🍕","🧸","🎡","✈️","🍰","📚","🎨","🏊","🎂","🍦","🛍️","🎪","🎠"];

/* stepping stone side: alternates L/R */
function stoneSide(i) { return i % 2 === 0 ? "left" : "right"; }

/* ════════════ STAR BURST ════════════ */
function StarBurst({x,y,onDone}){
  const [p]=useState(()=>Array.from({length:8},(_,i)=>({id:i,tx:(Math.random()-.5)*160,ty:-(Math.random()*100+60),cx:(Math.random()-.5)*80,cy:-(Math.random()*120+40),cr:Math.random()*720-360,size:Math.random()*12+10,delay:Math.random()*.15,kind:i%3})));
  useEffect(()=>{const t=setTimeout(onDone,1200);return()=>clearTimeout(t);},[onDone]);
  return(<div style={{position:"fixed",left:x,top:y,zIndex:9999,pointerEvents:"none"}}><div style={{position:"absolute",fontSize:32,"--tx":"0px","--ty":"-180px",animation:"starFly .9s cubic-bezier(.22,.68,.36,1.2) forwards"}}>⭐</div>{p.map(p=><div key={p.id} style={{position:"absolute",width:p.size,height:p.size,borderRadius:p.kind===1?"50%":"2px",background:[C.gold,C.primary,C.secondary][p.kind],"--cx":`${p.cx}px`,"--cy":`${p.cy}px`,"--cr":`${p.cr}deg`,animation:`confetti .8s ${p.delay}s cubic-bezier(.22,.68,.36,1.2) forwards`,opacity:0}}/>)}</div>);
}

/* ════════════ CUTE FACE ════════════ */
function CuteFace({size=36,style:sx={}}){
  return(<div style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#FFE066,#FFD700)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",boxShadow:"0 2px 8px rgba(255,215,0,.35)",flexShrink:0,...sx}}>
    <div style={{position:"absolute",top:"34%",left:"28%",width:size*.09,height:size*.12,borderRadius:"50%",background:C.textDark}}/>
    <div style={{position:"absolute",top:"34%",right:"28%",width:size*.09,height:size*.12,borderRadius:"50%",background:C.textDark}}/>
    <div style={{position:"absolute",bottom:"24%",width:size*.32,height:size*.16,borderRadius:`0 0 ${size}px ${size}px`,border:`${Math.max(2,size*.06)}px solid ${C.textDark}`,borderTop:"none"}}/>
    <div style={{position:"absolute",top:"48%",left:"12%",width:size*.16,height:size*.1,borderRadius:"50%",background:"rgba(255,101,132,.3)"}}/>
    <div style={{position:"absolute",top:"48%",right:"12%",width:size*.16,height:size*.1,borderRadius:"50%",background:"rgba(255,101,132,.3)"}}/>
  </div>);
}

/* ════════════ TODO ITEM ════════════ */
function TodoItem({item,onToggle,onDelete,onEdit}){
  const [justDone,setJustDone]=useState(false);const btnRef=useRef(null);const [burst,setBurst]=useState(null);
  const handleDone=()=>{if(item.isDone)return;const r=btnRef.current?.getBoundingClientRect();if(r)setBurst({x:r.left+r.width/2,y:r.top});setJustDone(true);onToggle(item.id);};
  return(<div>
    {burst&&<StarBurst x={burst.x} y={burst.y} onDone={()=>setBurst(null)}/>}
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`,animation:justDone?"pop .35s ease":undefined,position:"relative"}}>
      <button onClick={()=>item.owner==="mom"&&onToggle(item.id)} style={{width:26,height:26,borderRadius:"50%",border:item.isDone?"none":`2.5px solid ${item.owner==="mom"?C.secondary:C.kidTag}`,background:item.isDone?`linear-gradient(135deg,${C.accent},${C.accentLight})`:"transparent",cursor:item.owner==="mom"?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .25s",padding:0,animation:item.isDone&&justDone?"checkPop .4s ease":undefined}}>
        {item.isDone&&<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      <span onClick={()=>!item.isDone&&onEdit(item)} style={{flex:1,fontSize:15,fontWeight:600,color:item.isDone?C.textLight:C.textDark,position:"relative",fontFamily:"'Nunito',sans-serif",cursor:item.isDone?"default":"pointer"}}>
        {item.text}{item.isDone&&<span style={{position:"absolute",left:0,top:"50%",height:2,background:C.textLight,animation:"strikethrough .3s ease forwards"}}/>}
      </span>
      {!item.isDone&&<button onClick={()=>onEdit(item)} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"transparent",color:C.textLight,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background=`${C.primary}10`;e.currentTarget.style.color=C.primary}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textLight}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L11.5 5.5M1 13H4L12 5C12.5523 4.44772 12.5523 3.55228 12 3L11 2C10.4477 1.44772 9.55228 1.44772 9 2L1 10V13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
      {item.owner==="kid"&&!item.isDone&&<button ref={btnRef} onClick={handleDone} style={{padding:"6px 16px",borderRadius:999,border:"none",background:`linear-gradient(135deg,${C.accent},${C.accentLight})`,color:"white",fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 3px 10px rgba(67,212,160,.35)",transition:"all .2s"}} onMouseEnter={e=>e.target.style.transform="scale(1.06)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>완료 ✓</button>}
      {item.isDone&&item.owner==="kid"&&<span style={{fontSize:18,animation:"pop .4s ease"}}>⭐</span>}
      <button onClick={()=>onDelete(item.id)} style={{width:28,height:28,borderRadius:"50%",border:"none",background:"transparent",color:C.textLight,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background="#FEE";e.currentTarget.style.color=C.secondary}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textLight}}>×</button>
    </div>
  </div>);
}

/* ════════════ ADD TASK MODAL ════════════ */
function AddTaskModal({onClose,onAdd,kidName="아이"}){
  const [text,setText]=useState("");const [owner,setOwner]=useState("kid");const [isWeekly,setIsWeekly]=useState(false);const inputRef=useRef(null);
  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100)},[]);
  const handleAdd=()=>{if(!text.trim())return;onAdd({id:uid(),text:text.trim(),owner,isDone:false,starReward:1,createdDate:fmtDateKey(new Date()),isWeekly});onClose();};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"white",borderRadius:"28px 28px 0 0",padding:"28px 24px 32px",animation:"slideUp .35s cubic-bezier(.22,.68,.36,1.05)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
        <h3 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>✨ 할 일 추가</h3>
        <div style={{display:"flex",gap:10,marginBottom:18}}>
          {["mom","kid"].map(o=><button key={o} onClick={()=>setOwner(o)} style={{padding:"8px 20px",borderRadius:999,border:`2px solid ${owner===o?(o==="mom"?C.momTag:C.kidTag):C.border}`,background:owner===o?(o==="mom"?"rgba(255,101,132,.1)":"rgba(108,99,255,.1)"):"transparent",color:owner===o?(o==="mom"?C.momTag:C.kidTag):C.textMid,fontSize:14,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .2s"}}>{o==="mom"?"👩 엄마":`🧒 ${kidName}`}</button>)}
        </div>
        <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="무엇을 해야 하나요?" style={{width:"100%",padding:"14px 18px",borderRadius:16,border:`2px solid ${C.border}`,fontSize:15,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,outline:"none",background:C.bg}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        <div onClick={()=>setIsWeekly(w=>!w)} style={{display:"flex",alignItems:"center",gap:10,marginTop:14,padding:"12px 16px",borderRadius:14,border:`2px solid ${isWeekly?C.primary:C.border}`,background:isWeekly?`${C.primary}08`:"transparent",cursor:"pointer",transition:"all .2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isWeekly?C.primary:C.border}`,background:isWeekly?C.primary:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",flexShrink:0}}>
            {isWeekly&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:isWeekly?C.primary:C.textMid,fontFamily:"'Nunito',sans-serif"}}>🔄 매주 반복</div>
            <div style={{fontSize:11,fontWeight:600,color:C.textLight,marginTop:1}}>매주 자동으로 다시 추가돼요</div>
          </div>
        </div>
        <button onClick={handleAdd} disabled={!text.trim()} style={{width:"100%",padding:"14px",marginTop:16,borderRadius:16,border:"none",background:text.trim()?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:C.border,color:text.trim()?"white":C.textLight,fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:text.trim()?"pointer":"default",boxShadow:text.trim()?"0 4px 16px rgba(108,99,255,.35)":"none"}}>할 일 추가 ✨</button>
      </div>
    </div>
  );
}

/* ════════════ EDIT TASK MODAL ════════════ */
function EditTaskModal({item,onClose,onSave,kidName="아이"}){
  const [text,setText]=useState(item.text);const [owner,setOwner]=useState(item.owner);const inputRef=useRef(null);
  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100)},[]);
  const handleSave=()=>{if(!text.trim())return;onSave({...item,text:text.trim(),owner});onClose();};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"white",borderRadius:"28px 28px 0 0",padding:"28px 24px 32px",animation:"slideUp .35s cubic-bezier(.22,.68,.36,1.05)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
        <h3 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>✏️ 할 일 수정</h3>
        <div style={{display:"flex",gap:10,marginBottom:18}}>
          {["mom","kid"].map(o=><button key={o} onClick={()=>setOwner(o)} style={{padding:"8px 20px",borderRadius:999,border:`2px solid ${owner===o?(o==="mom"?C.momTag:C.kidTag):C.border}`,background:owner===o?(o==="mom"?"rgba(255,101,132,.1)":"rgba(108,99,255,.1)"):"transparent",color:owner===o?(o==="mom"?C.momTag:C.kidTag):C.textMid,fontSize:14,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .2s"}}>{o==="mom"?"👩 엄마":`🧒 ${kidName}`}</button>)}
        </div>
        <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="무엇을 해야 하나요?" style={{width:"100%",padding:"14px 18px",borderRadius:16,border:`2px solid ${C.border}`,fontSize:15,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,outline:"none",background:C.bg}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        <button onClick={handleSave} disabled={!text.trim()} style={{width:"100%",padding:"14px",marginTop:16,borderRadius:16,border:"none",background:text.trim()?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:C.border,color:text.trim()?"white":C.textLight,fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:text.trim()?"pointer":"default",boxShadow:text.trim()?"0 4px 16px rgba(108,99,255,.35)":"none"}}>수정 완료 ✏️</button>
      </div>
    </div>
  );
}

/* ════════════ EVENT BOTTOM SHEET ════════════ */
function EventSheet({events,date,onClose}){
  const label=date?`${date.getMonth()+1}월 ${date.getDate()}일 (${DAYS_KR[date.getDay()]})`:"";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .15s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"white",borderRadius:"28px 28px 0 0",padding:"24px 20px 32px",animation:"slideUp .3s cubic-bezier(.22,.68,.36,1.05)",maxHeight:"60vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 16px"}}/>
        <h3 style={{margin:"0 0 16px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>📅 {label}</h3>
        {events.length===0&&<p style={{textAlign:"center",color:C.textLight,fontWeight:600,fontSize:15,padding:"20px 0"}}>일정이 없어요 😊</p>}
        {events.map((ev,i)=><div key={ev.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",marginBottom:8,background:`${ev.color}10`,borderRadius:16,border:`1.5px solid ${ev.color}25`,animation:`slideUp .3s ${i*.06}s ease both`}}>
          <div style={{width:6,height:40,borderRadius:3,background:ev.color,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{ev.emoji} {ev.title}</div>
            <div style={{fontSize:12,fontWeight:600,color:C.textMid,marginTop:2}}>{String(ev.startHour).padStart(2,"0")}:{String(ev.startMin).padStart(2,"0")} – {String(ev.endHour).padStart(2,"0")}:{String(ev.endMin).padStart(2,"0")}</div>
          </div>
        </div>)}
      </div>
    </div>
  );
}

const arrowBtn={width:34,height:34,borderRadius:"50%",border:`2px solid ${C.border}`,background:"white",color:C.textMid,fontSize:15,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif",transition:"all .15s",padding:0};

const EMOJI_OPTIONS = ["🏫","🎹","🏊","📚","🥋","🎨","🎂","🍽️","🚗","⚽","🎬","🏥","✈️","🛒","💼","🎉"];
const COLOR_OPTIONS = ["#FF6584","#6C63FF","#43D4A0","#FFB347","#87CEEB","#DDA0DD","#F0E68C","#FF8A65"];
const REPEAT_OPTIONS = [{key:"none",label:"반복 안함"},{key:"daily",label:"매일"},{key:"weekly",label:"매주"},{key:"monthly",label:"매월"}];

const WEEKDAY_LABELS=["일","월","화","수","목","금","토"];

function generateRepeatedEvents(base, repeat, count, weeklyDays){
  if(repeat==="none") return [base];
  if(repeat==="weekly"&&weeklyDays&&weeklyDays.length>0){
    // 요일별 반복: weeklyDays = [{day:1,start:"14:00",end:"15:00"}, ...]
    const events=[];
    const startDate=new Date(base.date+"T00:00:00");
    // 해당 주의 월요일(주 시작) 찾기
    const dayOfWeek=startDate.getDay();
    const mondayOffset=dayOfWeek===0?-6:1-dayOfWeek;
    const weekStart=new Date(startDate);
    weekStart.setDate(startDate.getDate()+mondayOffset);
    for(let w=0;w<count;w++){
      for(const wd of weeklyDays){
        const d=new Date(weekStart);
        // 일:0,월:1,...토:6 → offset from monday
        const offset=wd.day===0?6:wd.day-1;
        d.setDate(weekStart.getDate()+w*7+offset);
        if(d<startDate) continue;
        const [sh,sm]=wd.start.split(":").map(Number);
        const [eh,em]=wd.end.split(":").map(Number);
        const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        events.push({...base, id:"ev"+Date.now()+events.length, date:ds, startHour:sh, startMin:sm, endHour:eh, endMin:em});
      }
    }
    return events;
  }
  const events=[];
  const d=new Date(base.date+"T00:00:00");
  for(let i=0;i<count;i++){
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    events.push({...base, id:"ev"+Date.now()+i, date:ds});
    if(repeat==="daily") d.setDate(d.getDate()+1);
    else if(repeat==="weekly") d.setDate(d.getDate()+7);
    else if(repeat==="monthly") d.setMonth(d.getMonth()+1);
  }
  return events;
}

const repeatPickerStyle={display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"};

/* ════════════ ADD EVENT MODAL ════════════ */
function AddEventModal({ onClose, onAdd, initialDate }) {
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎹");
  const [color, setColor] = useState("#6C63FF");
  const [date, setDate] = useState(initialDate || "");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [repeat, setRepeat] = useState("none");
  const [repeatCount, setRepeatCount] = useState(4);
  const [weeklyDays, setWeeklyDays] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 150); }, []);

  const toggleWeekday = (dayIdx) => {
    setWeeklyDays(prev => {
      const exists = prev.find(d => d.day === dayIdx);
      if (exists) return prev.filter(d => d.day !== dayIdx);
      return [...prev, { day: dayIdx, start: startTime, end: endTime }].sort((a,b) => a.day - b.day);
    });
  };
  const updateWeekdayTime = (dayIdx, field, value) => {
    setWeeklyDays(prev => prev.map(d => d.day === dayIdx ? { ...d, [field]: value } : d));
  };

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const base = { id:"ev"+Date.now(), title:title.trim(), emoji, color, date, startHour:sh, startMin:sm, endHour:eh, endMin:em };
    if (repeat === "weekly" && weeklyDays.length > 0) {
      const evts = generateRepeatedEvents(base, repeat, repeatCount, weeklyDays);
      evts.forEach(ev => onAdd(ev));
    } else {
      const evts = generateRepeatedEvents(base, repeat, repeatCount);
      evts.forEach(ev => onAdd(ev));
    }
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 14,
    border: `2px solid ${C.border}`, fontSize: 14, fontWeight: 600,
    fontFamily: "'Nunito',sans-serif", color: C.textDark,
    outline: "none", background: C.bg, transition: "border .2s",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,43,85,.45)",
      backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
      alignItems: "flex-end", justifyContent: "center", animation: "fadeIn .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 420, background: "white",
        borderRadius: "28px 28px 0 0", padding: "24px 22px 32px",
        animation: "slideUp .35s cubic-bezier(.22,.68,.36,1.05)",
        maxHeight: "60vh", overflowY: "auto",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />
        <h3 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>
          📅 새 일정 추가
        </h3>

        {/* Title */}
        <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, display: "block" }}>일정 이름</label>
        <input ref={inputRef} value={title} onChange={e => setTitle(e.target.value)}
          placeholder="예: 피아노 레슨"
          style={{ ...inputStyle, marginBottom: 16 }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />

        {/* Date */}
        <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, display: "block" }}>날짜</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle, marginBottom: 16 }}
          onFocus={e => e.target.style.borderColor = C.primary}
          onBlur={e => e.target.style.borderColor = C.border}
        />

        {/* Time row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, display: "block" }}>시작</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 6, display: "block" }}>종료</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
        </div>

        {/* Emoji picker */}
        <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 8, display: "block" }}>아이콘</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {EMOJI_OPTIONS.map(em => (
            <button key={em} onClick={() => setEmoji(em)} style={{
              width: 40, height: 40, borderRadius: 12, border: "none",
              background: emoji === em ? `${C.primary}15` : C.bg,
              fontSize: 20, cursor: "pointer", transition: "all .15s",
              outline: emoji === em ? `2.5px solid ${C.primary}` : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{em}</button>
          ))}
        </div>

        {/* Color picker */}
        <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 8, display: "block" }}>색상</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
          {COLOR_OPTIONS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: c, cursor: "pointer", transition: "all .15s",
              outline: color === c ? `3px solid ${c}` : "3px solid transparent",
              outlineOffset: 2,
              boxShadow: color === c ? `0 2px 10px ${c}50` : "none",
            }} />
          ))}
        </div>

        {/* Repeat */}
        <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, marginBottom: 8, display: "block" }}>반복</label>
        <div style={repeatPickerStyle}>
          {REPEAT_OPTIONS.map(r=>(
            <button key={r.key} onClick={()=>{setRepeat(r.key);if(r.key!=="weekly")setWeeklyDays([]);}} style={{
              padding:"7px 14px",borderRadius:999,border:"none",
              background:repeat===r.key?C.primary:`${C.primary}08`,
              color:repeat===r.key?"white":C.textMid,
              fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif",
              cursor:"pointer",transition:"all .15s",
            }}>{r.label}</button>
          ))}
        </div>

        {/* Weekly: day picker */}
        {repeat==="weekly"&&(
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8,display:"block"}}>반복 요일</label>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {WEEKDAY_LABELS.map((label,idx)=>{
                const selected=weeklyDays.some(d=>d.day===idx);
                return(
                  <button key={idx} onClick={()=>toggleWeekday(idx)} style={{
                    width:38,height:38,borderRadius:"50%",border:"none",
                    background:selected?C.primary:`${C.primary}08`,
                    color:selected?"white":idx===0?C.secondary:idx===6?C.primary:C.textMid,
                    fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",
                    cursor:"pointer",transition:"all .15s",
                  }}>{label}</button>
                );
              })}
            </div>
            {/* Per-day time settings */}
            {weeklyDays.map(wd=>(
              <div key={wd.day} style={{
                display:"flex",alignItems:"center",gap:8,marginBottom:8,
                padding:"10px 12px",background:C.bg,borderRadius:12,
              }}>
                <span style={{fontSize:13,fontWeight:800,color:C.primary,minWidth:20,fontFamily:"'Nunito',sans-serif"}}>{WEEKDAY_LABELS[wd.day]}</span>
                <input type="time" value={wd.start} onChange={e=>updateWeekdayTime(wd.day,"start",e.target.value)}
                  style={{flex:1,padding:"6px 8px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,outline:"none",background:"white"}}
                />
                <span style={{fontSize:12,color:C.textLight}}>~</span>
                <input type="time" value={wd.end} onChange={e=>updateWeekdayTime(wd.day,"end",e.target.value)}
                  style={{flex:1,padding:"6px 8px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,outline:"none",background:"white"}}
                />
              </div>
            ))}
          </div>
        )}

        {repeat!=="none"&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:700,color:C.textMid,whiteSpace:"nowrap"}}>{repeat==="weekly"?"반복 기간":"반복 횟수"}</label>
            <input type="number" min={2} max={52} value={repeatCount} onChange={e=>setRepeatCount(Math.max(2,Math.min(52,Number(e.target.value))))}
              style={{width:70,padding:"8px 12px",borderRadius:12,border:`2px solid ${C.border}`,fontSize:14,fontWeight:700,fontFamily:"'Nunito',sans-serif",color:C.textDark,outline:"none",background:C.bg,textAlign:"center"}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
            <span style={{fontSize:12,fontWeight:600,color:C.textLight}}>{repeat==="weekly"?"주":"회"}</span>
          </div>
        )}

        {/* Preview */}
        {title.trim() && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
            background: `${color}10`, borderRadius: 14, border: `1.5px solid ${color}25`,
            marginBottom: 18, animation: "slideUp .2s ease",
          }}>
            <div style={{ width: 5, height: 36, borderRadius: 3, background: color }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>
                {emoji} {title}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textMid }}>
                {date}{repeat==="weekly"&&weeklyDays.length>0?` · ${weeklyDays.map(d=>WEEKDAY_LABELS[d.day]).join("·")} ${repeatCount}주`:repeat!=="none"?` · ${REPEAT_OPTIONS.find(r=>r.key===repeat).label} ${repeatCount}회`:` · ${startTime} – ${endTime}`}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleAdd}
          disabled={!title.trim() || !date}
          style={{
            width: "100%", padding: "14px", borderRadius: 16, border: "none",
            background: title.trim() && date ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : C.border,
            color: title.trim() && date ? "white" : C.textLight,
            fontSize: 16, fontWeight: 800, fontFamily: "'Nunito',sans-serif",
            cursor: title.trim() && date ? "pointer" : "default",
            boxShadow: title.trim() && date ? "0 4px 16px rgba(108,99,255,.35)" : "none",
            transition: "all .2s",
          }}>일정 추가 📅</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   WEEKLY CALENDAR
   ════════════════════════════════════════════ */
function WeeklyCalendar({ events: evtList }){
  const today=new Date();const [weekOffset,setWeekOffset]=useState(0);const [animDir,setAnimDir]=useState("up");const [selectedEvent,setSelectedEvent]=useState(null);const [animKey,setAnimKey]=useState(0);
  const baseDate=new Date(today);baseDate.setDate(today.getDate()+weekOffset*7);const weekDates=getWeekDates(baseDate);
  const startLabel=`${weekDates[0].getMonth()+1}월 ${weekDates[0].getDate()}일`;const endLabel=`${weekDates[6].getMonth()+1}월 ${weekDates[6].getDate()}일`;
  const go=dir=>{setAnimDir(dir<0?"right":"left");setWeekOffset(w=>w+dir);setAnimKey(k=>k+1);};
  const touchRef=useRef(null);
  const onTS=e=>{touchRef.current=e.touches[0].clientX;};
  const onTE=e=>{if(touchRef.current===null)return;const diff=e.changedTouches[0].clientX-touchRef.current;if(Math.abs(diff)>50)go(diff>0?-1:1);touchRef.current=null;};
  const HOURS=Array.from({length:13},(_,i)=>i+8);
  const dayEventBlocks=weekDates.map(d=>{const ds=fmtDateKey(d);return evtList.filter(ev=>ev.date===ds);});
  return(
    <div key={animKey} style={{animation:`${animDir==="left"?"slideLeft":animDir==="right"?"slideRight":"slideUp"} .3s ease both`}} onTouchStart={onTS} onTouchEnd={onTE}>
      <div style={{background:"white",borderRadius:20,padding:"16px 12px 0",marginBottom:16,boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"0 4px"}}>
          <button onClick={()=>go(-1)} style={arrowBtn}>&lt;</button>
          <span style={{fontSize:15,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{startLabel} – {endLabel}</span>
          <button onClick={()=>go(1)} style={arrowBtn}>&gt;</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"40px repeat(7,1fr)",gap:0,paddingBottom:14}}>
          <div/>
          {weekDates.map((d,i)=>{const isT=isSameDay(d,today);return(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:11,fontWeight:700,color:isT?C.primary:C.textLight}}>{DAYS_KR[d.getDay()]}</span>
              <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isT?C.primary:"transparent",color:isT?"white":C.textDark,fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>{d.getDate()}</div>
            </div>);})}
        </div>
      </div>
      <div style={{background:"white",borderRadius:20,padding:"0 2px 8px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",overflow:"hidden"}}>
        <div style={{overflowY:"auto",maxHeight:460}}>
          {HOURS.map(hour=>(
            <div key={hour} style={{display:"grid",gridTemplateColumns:"40px repeat(7,1fr)",gap:0,minHeight:44,borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontSize:10,fontWeight:700,color:C.textLight,textAlign:"right",paddingRight:6,paddingTop:3}}>{String(hour).padStart(2,"0")}:00</div>
              {weekDates.map((d,di)=>{const dayEvts=dayEventBlocks[di];const startsHere=dayEvts.filter(ev=>ev.startHour===hour);const coversHere=dayEvts.filter(ev=>ev.startHour<hour&&ev.endHour>hour);
                if(startsHere.length>0){const ev=startsHere[0];const span=Math.min(ev.endHour-ev.startHour,20-hour);return(
                  <div key={di} style={{position:"relative"}}><div onClick={()=>setSelectedEvent(ev)} style={{position:"absolute",top:2,left:2,right:2,height:span*44-6,background:`${ev.color}22`,border:`1.5px solid ${ev.color}45`,borderRadius:10,padding:"3px 4px",cursor:"pointer",overflow:"hidden",zIndex:2,transition:"transform .15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    <div style={{fontSize:10,fontWeight:800,color:ev.color,lineHeight:1.2}}>{ev.emoji}</div>
                    {span>1&&<div style={{fontSize:8,fontWeight:700,color:ev.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{ev.title}</div>}
                  </div></div>);}
                if(coversHere.length>0) return <div key={di}/>; return <div key={di}/>;
              })}
            </div>
          ))}
        </div>
      </div>
      {selectedEvent&&<EventSheet events={[selectedEvent]} date={new Date(selectedEvent.date+"T00:00:00")} onClose={()=>setSelectedEvent(null)}/>}
    </div>
  );
}

/* ════════════════════════════════════════════
   MONTHLY CALENDAR
   ════════════════════════════════════════════ */
function MonthlyCalendar({ events, onAddEvent }){
  const today=new Date();const [year,setYear]=useState(today.getFullYear());const [month,setMonth]=useState(today.getMonth());const [selectedDate,setSelectedDate]=useState(null);const [animDir,setAnimDir]=useState("up");const [animKey,setAnimKey]=useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitDate, setAddInitDate] = useState("");
  const grid=getMonthGrid(year,month);
  const goPrev=()=>{setAnimDir("right");setAnimKey(k=>k+1);if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const goNext=()=>{setAnimDir("left");setAnimKey(k=>k+1);if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const getEventsForDay=day=>{if(!day)return[];const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return events.filter(ev=>ev.date===ds);};
  const upcomingEvents=events.filter(ev=>{const d=new Date(ev.date+"T00:00:00");return d.getMonth()===month&&d.getFullYear()===year&&d>=new Date(today.toDateString());}).sort((a,b)=>a.date.localeCompare(b.date)||a.startHour-b.startHour).slice(0,5);
  const selectedEvents=selectedDate?getEventsForDay(selectedDate):[];

  const handleDateClick = (day) => {
    setSelectedDate(day);
  };
  const openAddForDate = (dateStr) => {
    setAddInitDate(dateStr);
    setShowAddModal(true);
    setSelectedDate(null);
  };

  return(
    <div>
    <div key={animKey} style={{animation:`${animDir==="left"?"slideLeft":animDir==="right"?"slideRight":"slideUp"} .3s ease both`}}>
      <div style={{background:"white",borderRadius:20,padding:"18px 16px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <button onClick={goPrev} style={arrowBtn}>&lt;</button>
          <span style={{fontSize:18,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{year}년 {MONTHS_KR[month]}</span>
          <button onClick={goNext} style={arrowBtn}>&gt;</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
          {DAYS_KR.map(d=> <div key={d} style={{textAlign:"center",fontSize:12,fontWeight:700,color:d==="일"?C.secondary:d==="토"?C.primary:C.textLight}}>{d}</div>)}
        </div>
        {grid.map((row,ri)=> <div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {row.map((day,ci)=>{if(!day) return <div key={ci} style={{height:46}}/>;const isT=day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();const evts=getEventsForDay(day);return(
            <button key={ci} onClick={()=>handleDateClick(day)} style={{height:46,borderRadius:12,border:"none",background:isT?C.primary:"transparent",color:isT?"white":C.textDark,fontSize:14,fontWeight:isT?900:600,fontFamily:"'Nunito',sans-serif",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,transition:"all .15s",padding:0}} onMouseEnter={e=>{if(!isT)e.currentTarget.style.background=`${C.primary}10`}} onMouseLeave={e=>{if(!isT)e.currentTarget.style.background="transparent"}}>
              {day}{evts.length>0&&<div style={{display:"flex",gap:2}}>{evts.slice(0,3).map((ev,ei)=> <div key={ei} style={{width:5,height:5,borderRadius:"50%",background:isT?"rgba(255,255,255,.8)":ev.color}}/>)}</div>}
            </button>);})}
        </div>)}
      </div>

      {/* Upcoming events */}
      <div style={{background:"white",borderRadius:20,padding:"18px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h3 style={{margin:0,fontSize:16,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>📌 다가오는 일정</h3>
          <button onClick={()=>{setAddInitDate("");setShowAddModal(true);}} style={{
            padding:"6px 14px",borderRadius:999,border:"none",
            background:`${C.primary}12`,color:C.primary,
            fontSize:12,fontWeight:800,fontFamily:"'Nunito',sans-serif",
            cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:4,
          }}
            onMouseEnter={e=>e.currentTarget.style.background=`${C.primary}20`}
            onMouseLeave={e=>e.currentTarget.style.background=`${C.primary}12`}
          >+ 추가</button>
        </div>
        {upcomingEvents.length===0&&<p style={{textAlign:"center",color:C.textLight,fontWeight:600,fontSize:14,padding:"12px 0"}}>이번 달은 예정된 일정이 없어요 ✨</p>}
        {upcomingEvents.map((ev,i)=>{const evD=new Date(ev.date+"T00:00:00");return(
          <div key={ev.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<upcomingEvents.length-1?`1px solid ${C.border}`:"none",animation:`slideUp .4s ${i*.06}s ease both`}}>
            <div style={{padding:"6px 10px",borderRadius:10,background:`${ev.color}20`,fontSize:12,fontWeight:800,color:ev.color,textAlign:"center",minWidth:52,fontFamily:"'Nunito',sans-serif"}}>{evD.getMonth()+1}/{evD.getDate()}</div>
            <span style={{fontSize:14,fontWeight:600,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{ev.emoji} {ev.title}</span>
          </div>);})}
      </div>

    </div>

      {/* Date detail sheet with add button — outside animation div */}
      {selectedDate&&(
        <EventSheetWithAdd
          events={selectedEvents}
          date={new Date(year,month,selectedDate)}
          onClose={()=>setSelectedDate(null)}
          onAdd={()=>{
            const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}`;
            openAddForDate(ds);
          }}
        />
      )}

      {/* Add event modal — outside animation div */}
      {showAddModal && (
        <AddEventModal
          onClose={()=>setShowAddModal(false)}
          onAdd={onAddEvent}
          initialDate={addInitDate}
        />
      )}
    </div>
  );
}

/* ════════════ EVENT SHEET WITH ADD BUTTON ════════════ */
function EventSheetWithAdd({ events, date, onClose, onAdd }) {
  const label = date ? `${date.getMonth()+1}월 ${date.getDate()}일 (${DAYS_KR[date.getDay()]})` : "";
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(45,43,85,.45)",
      backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
      alignItems: "flex-end", justifyContent: "center", animation: "fadeIn .15s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 420, background: "white",
        borderRadius: "28px 28px 0 0", padding: "24px 20px 32px",
        animation: "slideUp .3s cubic-bezier(.22,.68,.36,1.05)",
        maxHeight: "60vh", overflowY: "auto",
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>
            📅 {label}
          </h3>
          <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{
            padding: "6px 14px", borderRadius: 999, border: "none",
            background: `linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color: "white", fontSize: 12, fontWeight: 800, fontFamily: "'Nunito',sans-serif",
            cursor: "pointer", boxShadow: "0 2px 10px rgba(108,99,255,.25)",
            display: "flex", alignItems: "center", gap: 4,
          }}>+ 일정 추가</button>
        </div>
        {events.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: C.textLight, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>일정이 없어요</p>
            <button onClick={e => { e.stopPropagation(); onAdd(); }} style={{
              padding: "10px 24px", borderRadius: 999, border: `2px solid ${C.primary}30`,
              background: `${C.primary}08`, color: C.primary,
              fontSize: 14, fontWeight: 800, fontFamily: "'Nunito',sans-serif",
              cursor: "pointer",
            }}>📅 새 일정 만들기</button>
          </div>
        )}
        {events.map((ev, i) => (
          <div key={ev.id} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 8,
            background: `${ev.color}10`, borderRadius: 16, border: `1.5px solid ${ev.color}25`,
            animation: `slideUp .3s ${i * 0.06}s ease both`,
          }}>
            <div style={{ width: 6, height: 40, borderRadius: 3, background: ev.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>{ev.emoji} {ev.title}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginTop: 2 }}>
                {String(ev.startHour).padStart(2, "0")}:{String(ev.startMin).padStart(2, "0")} – {String(ev.endHour).padStart(2, "0")}:{String(ev.endMin).padStart(2, "0")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   KID'S DAY TIMELINE — Serpentine connected path
   ════════════════════════════════════════════════════ */
function KidDayTimeline({kidName="아이"}) {
  const TEST_CURRENT_IDX = 5; /* 테스트: "숙제"를 진행중으로 고정 */

  const nodes = useMemo(() => TIMELINE_ITEMS.map((item, i) => {
    let status = "future";
    if (i < TEST_CURRENT_IDX) status = "done";
    else if (i === TEST_CURRENT_IDX) status = "current";
    return { ...item, status, side: stoneSide(i), idx: i };
  }), []);

  const currentRef = useRef(null);
  useEffect(() => {
    if (currentRef.current) {
      setTimeout(() => currentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    }
  }, []);

  /* ─── segment colors cycling ─── */
  const segColors = [C.secondary, C.primary, C.accent, C.gold, C.primaryLight, C.accentLight];
  const segColor = (i) => segColors[i % segColors.length];

  const SPINE_W = 48; /* center spine column width */

  return (
    <div style={{ animation: "slideUp .4s ease both" }}>
      {/* Header card */}
      <div style={{
        background: "white", borderRadius: 24, padding: "20px 22px",
        marginBottom: 20, boxShadow: "0 4px 20px rgba(108,99,255,.08)",
        display: "flex", alignItems: "center", gap: 14, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: `${C.primary}08` }} />
        <CuteFace size={50} style={{ border: `3px solid ${C.gold}40` }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: C.textDark, fontFamily: "'Nunito',sans-serif" }}>
            {kidName}의 하루 ✨
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.textMid, fontWeight: 600 }}>
            {nodes.filter(n => n.status === "done").length}/{nodes.length} 완료 · 오늘도 화이팅! 💪
          </p>
        </div>
      </div>

      {/* Vertical timeline rows */}
      <div style={{ position: "relative" }}>
        {nodes.map((node, i) => {
          const isDone = node.status === "done";
          const isCurrent = node.status === "current";
          const isFuture = node.status === "future";
          const isLeft = node.side === "left"; /* content card side */
          const color = isFuture ? C.border : segColor(i);
          const nodeSize = isCurrent ? 40 : 32;
          const isLast = i === nodes.length - 1;

          /* ── Row: [left area] [spine] [right area] ── */
          return (
            <div
              key={node.id}
              ref={isCurrent ? currentRef : undefined}
              style={{
                display: "flex", alignItems: "stretch",
                minHeight: isCurrent ? 110 : 86,
                animation: `slideUp .45s ${i * 0.04}s ease both`,
              }}
            >
              {/* ── Left column ── */}
              <div style={{
                flex: 1, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-end", paddingTop: 8, paddingRight: 6,
              }}>
                {isLeft ? (
                  /* Content card on left */
                  <div style={{
                    background: isCurrent ? "white" : isDone ? "white" : C.bg,
                    borderRadius: 16, padding: isCurrent ? "10px 14px" : "8px 12px",
                    boxShadow: isCurrent ? `0 6px 20px rgba(108,99,255,.12)` : isDone ? `0 2px 10px rgba(0,0,0,.04)` : "none",
                    border: isCurrent ? `2px solid ${C.primary}30` : isDone ? `1.5px solid ${color}25` : `1.5px solid ${C.border}`,
                    textAlign: "right", maxWidth: "100%", transition: "all .3s",
                  }}>
                    <div style={{
                      fontSize: isCurrent ? 14 : 13, fontWeight: 800,
                      color: isFuture ? C.textLight : C.textDark,
                      fontFamily: "'Nunito',sans-serif",
                      display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end",
                    }}>
                      {node.label}
                      {(isDone || isCurrent) && <span style={{ fontSize: isCurrent ? 15 : 13 }}>{node.emoji}</span>}
                    </div>
                    {isCurrent && (
                      <div style={{ marginTop: 5 }}>
                        <span style={{
                          background: `${C.primary}12`, color: C.primary,
                          padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                        }}>진행중</span>
                        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 3, background: `${C.primary}12`, overflow: "hidden" }}>
                            <div style={{
                              width: "60%", height: "100%", borderRadius: 3,
                              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
                              animation: "shimmer 2s ease infinite", backgroundSize: "200% 100%",
                            }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.primary }}>60%</span>
                        </div>
                      </div>
                    )}
                    {isDone && (
                      <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2, fontFamily: "'Nunito',sans-serif", textAlign: "right" }}>
                        완료 ✓
                      </div>
                    )}
                  </div>
                ) : (
                  /* Time ribbon on left */
                  <div style={{
                    background: isFuture ? C.bg : isCurrent
                      ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`
                      : `linear-gradient(135deg, ${color}, ${color}DD)`,
                    color: isFuture ? C.textLight : "white",
                    padding: "5px 14px", borderRadius: 10,
                    fontSize: 14, fontWeight: 900, fontFamily: "'Nunito',sans-serif",
                    boxShadow: isFuture ? "none" : `0 3px 10px ${color}30`,
                    marginTop: 2, whiteSpace: "nowrap",
                  }}>
                    {node.time}
                  </div>
                )}
              </div>

              {/* ── Center spine ── */}
              <div style={{
                width: SPINE_W, position: "relative", display: "flex",
                flexDirection: "column", alignItems: "center", flexShrink: 0,
              }}>
                {/* Spine bar above node */}
                {i > 0 && (
                  <div style={{
                    width: 5, flex: "0 0 12px",
                    background: (node.status !== "future" || nodes[i - 1].status !== "future")
                      ? `linear-gradient(180deg, ${segColor(i - 1)}, ${color})`
                      : C.border,
                    borderRadius: 3,
                    opacity: (node.status === "future" && nodes[i - 1].status === "future") ? 0.4 : 1,
                  }} />
                )}
                {i === 0 && <div style={{ flex: "0 0 12px" }} />}

                {/* Node circle */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {isCurrent && (
                    <div style={{ position: "absolute", inset: 0 }}>
                      <div style={{
                        position: "absolute", inset: -8, borderRadius: "50%",
                        border: `3px solid ${C.primary}20`,
                        animation: "glowRingCurrent 2.5s ease-in-out infinite",
                      }} />
                      <div style={{
                        position: "absolute", inset: -14, borderRadius: "50%",
                        border: `2px solid ${C.primary}10`,
                        animation: "glowRingCurrent 2.5s 0.5s ease-in-out infinite",
                      }} />
                    </div>
                  )}
                  <div style={{
                    width: nodeSize, height: nodeSize, borderRadius: "50%",
                    background: isFuture
                      ? "linear-gradient(150deg, #F0EFF8, #E4E3F0)"
                      : isCurrent
                      ? `linear-gradient(150deg, ${C.primary}, ${C.primaryLight})`
                      : `linear-gradient(150deg, ${color}, ${color}CC)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isCurrent
                      ? `0 6px 20px rgba(108,99,255,.35)`
                      : isDone
                      ? `0 3px 12px ${color}40`
                      : `0 2px 6px rgba(0,0,0,.06)`,
                    border: "3px solid white",
                    zIndex: isCurrent ? 12 : 6,
                    position: "relative",
                    transition: "all .4s cubic-bezier(.22,.68,.36,1.05)",
                  }}>
                    {isDone && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isCurrent && <span style={{ fontSize: 18 }}>{node.emoji}</span>}
                    {isFuture && <span style={{ fontSize: 14, opacity: 0.35 }}>{node.emoji}</span>}
                  </div>

                  {/* ★ Profile avatar floating above current node ★ */}
                  {isCurrent && (
                    <div style={{
                      position: "absolute", bottom: nodeSize + 2, left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      animation: "float 3s ease-in-out infinite", zIndex: 20,
                    }}>
                      <div style={{
                        background: "white", borderRadius: 10, padding: "3px 9px",
                        boxShadow: "0 3px 12px rgba(108,99,255,.12)",
                        border: `1.5px solid ${C.primary}20`,
                        marginBottom: 4, whiteSpace: "nowrap", position: "relative",
                      }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: C.primary, fontFamily: "'Nunito',sans-serif" }}>
                          지금!
                        </span>
                        <div style={{
                          position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
                          width: 0, height: 0,
                          borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                          borderTop: "4px solid white",
                        }} />
                      </div>
                      <CuteFace size={32} style={{ border: `2.5px solid white`, boxShadow: `0 3px 12px rgba(108,99,255,.25)` }} />
                    </div>
                  )}
                </div>

                {/* Spine bar below node */}
                {!isLast && (
                  <div style={{
                    width: 5, flex: 1,
                    background: (node.status !== "future")
                      ? `linear-gradient(180deg, ${color}, ${segColor(i + 1)})`
                      : C.border,
                    borderRadius: 3,
                    opacity: node.status === "future" ? 0.4 : 1,
                  }} />
                )}
                {isLast && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 5, height: 20, borderRadius: 3,
                      background: isFuture ? C.border : color,
                      opacity: isFuture ? 0.4 : 0.6,
                    }} />
                    <div style={{
                      width: 0, height: 0, marginTop: -1,
                      borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                      borderTop: `8px solid ${isFuture ? C.border : color}`,
                      opacity: isFuture ? 0.4 : 0.6,
                    }} />
                  </div>
                )}
              </div>

              {/* ── Right column ── */}
              <div style={{
                flex: 1, display: "flex", alignItems: "flex-start",
                justifyContent: "flex-start", paddingTop: 8, paddingLeft: 6,
              }}>
                {!isLeft ? (
                  /* Content card on right */
                  <div style={{
                    background: isCurrent ? "white" : isDone ? "white" : C.bg,
                    borderRadius: 16, padding: isCurrent ? "10px 14px" : "8px 12px",
                    boxShadow: isCurrent ? `0 6px 20px rgba(108,99,255,.12)` : isDone ? `0 2px 10px rgba(0,0,0,.04)` : "none",
                    border: isCurrent ? `2px solid ${C.primary}30` : isDone ? `1.5px solid ${color}25` : `1.5px solid ${C.border}`,
                    textAlign: "left", maxWidth: "100%", transition: "all .3s",
                  }}>
                    <div style={{
                      fontSize: isCurrent ? 14 : 13, fontWeight: 800,
                      color: isFuture ? C.textLight : C.textDark,
                      fontFamily: "'Nunito',sans-serif",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      {(isDone || isCurrent) && <span style={{ fontSize: isCurrent ? 15 : 13 }}>{node.emoji}</span>}
                      {node.label}
                    </div>
                    {isCurrent && (
                      <div style={{ marginTop: 5 }}>
                        <span style={{
                          background: `${C.primary}12`, color: C.primary,
                          padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800,
                        }}>진행중</span>
                        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 3, background: `${C.primary}12`, overflow: "hidden" }}>
                            <div style={{
                              width: "60%", height: "100%", borderRadius: 3,
                              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
                              animation: "shimmer 2s ease infinite", backgroundSize: "200% 100%",
                            }} />
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.primary }}>60%</span>
                        </div>
                      </div>
                    )}
                    {isDone && (
                      <div style={{ fontSize: 10, fontWeight: 700, color, marginTop: 2, fontFamily: "'Nunito',sans-serif" }}>
                        완료 ✓
                      </div>
                    )}
                  </div>
                ) : (
                  /* Time ribbon on right */
                  <div style={{
                    background: isFuture ? C.bg : isCurrent
                      ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`
                      : `linear-gradient(135deg, ${color}, ${color}DD)`,
                    color: isFuture ? C.textLight : "white",
                    padding: "5px 14px", borderRadius: 10,
                    fontSize: 14, fontWeight: 900, fontFamily: "'Nunito',sans-serif",
                    boxShadow: isFuture ? "none" : `0 3px 10px ${color}30`,
                    marginTop: 2, whiteSpace: "nowrap",
                  }}>
                    {node.time}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════ COUPON PAGE (아이용) ════════════ */
function CouponPage({stars,coupons,onBack,onUse}){
  const [usedIds,setUsedIds]=useState([]);
  const [confirmId,setConfirmId]=useState(null);

  const handleUse=(coupon)=>{
    if(stars<coupon.starCost)return;
    setConfirmId(coupon.id);
  };
  const confirmUse=()=>{
    const coupon=coupons.find(c=>c.id===confirmId);
    if(coupon){
      setUsedIds(p=>[...p,confirmId]);
      onUse(coupon.starCost);
    }
    setConfirmId(null);
  };
  const found=confirmId?coupons.find(c=>c.id===confirmId):null;

  return(
    <div style={{animation:"slideUp .4s ease both"}}>
      {/* Header */}
      <div style={{
        background:"white",borderRadius:20,padding:"20px 20px 18px",marginBottom:16,
        boxShadow:"0 4px 20px rgba(108,99,255,.08)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <button onClick={onBack} style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${C.border}`,background:"white",color:C.textMid,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 style={{margin:0,fontSize:20,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif",flex:1}}>쿠폰 사용</h2>
        </div>
        <p style={{margin:"0 0 14px",fontSize:13,fontWeight:600,color:C.textMid}}>적립한 별로 쿠폰을 사용해 보세요.</p>
        <div style={{background:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#FFD700,#FFE44D)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 3px 10px rgba(255,215,0,.3)"}}>⭐</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:"#B8860B",marginBottom:4}}>별 모으기</div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:18,fontWeight:900,color:"#D4A017"}}>{stars}</span>
              <span style={{fontSize:12,fontWeight:700,color:"#B8860B"}}>개</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon list */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {coupons.map((coupon,i)=>{
          const isUsed=usedIds.includes(coupon.id);
          const canAfford=stars>=coupon.starCost;
          return(
            <div key={coupon.id} style={{
              background:"white",borderRadius:20,padding:"18px 20px",
              boxShadow:"0 4px 20px rgba(108,99,255,.08)",
              border:isUsed?`1.5px solid ${C.accent}25`:`1.5px solid ${C.border}`,
              display:"flex",alignItems:"center",gap:14,
              opacity:isUsed?0.6:1,
              animation:`slideUp .4s ${i*0.05}s ease both`,
            }}>
              <div style={{
                width:48,height:48,borderRadius:14,
                background:isUsed?`${C.accent}10`:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:24,flexShrink:0,
              }}>{coupon.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:14,fontWeight:900,color:"#D4A017"}}>★ {coupon.starCost}</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:isUsed?C.textLight:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{coupon.title}</div>
                <div style={{fontSize:12,fontWeight:600,color:C.textMid,marginTop:1}}>{coupon.desc}</div>
              </div>
              {isUsed?(
                <div style={{padding:"8px 14px",borderRadius:999,background:`${C.accent}12`,color:C.accent,fontSize:12,fontWeight:800,fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap",border:`1.5px solid ${C.accent}30`}}>사용 완료</div>
              ):(
                <button onClick={()=>handleUse(coupon)} style={{
                  padding:"8px 18px",borderRadius:999,border:"none",
                  background:canAfford?`linear-gradient(135deg,${C.accent},${C.accentLight})`:C.border,
                  color:canAfford?"white":C.textLight,
                  fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",
                  cursor:canAfford?"pointer":"default",
                  boxShadow:canAfford?"0 3px 10px rgba(67,212,160,.3)":"none",
                  whiteSpace:"nowrap",transition:"all .2s",
                }} onMouseEnter={e=>{if(canAfford)e.target.style.transform="scale(1.05)"}}
                   onMouseLeave={e=>{e.target.style.transform="scale(1)"}}>사용</button>
              )}
            </div>
          );
        })}
        {coupons.length===0&&(
          <div style={{background:"white",borderRadius:20,padding:"40px 20px",textAlign:"center",boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🎫</div>
            <p style={{fontSize:14,fontWeight:700,color:C.textMid}}>등록된 쿠폰이 없어요</p>
            <p style={{fontSize:12,fontWeight:600,color:C.textLight,margin:"4px 0 0"}}>부모님이 쿠폰을 추가하면 여기에 표시돼요!</p>
          </div>
        )}
      </div>

      {/* Confirm popup */}
      {found&&(
        <div onClick={()=>setConfirmId(null)} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"85%",maxWidth:320,background:"white",borderRadius:24,padding:"32px 24px 24px",textAlign:"center",animation:"pop .35s cubic-bezier(.22,.68,.36,1.05)"}}>
            <div style={{fontSize:48,marginBottom:12}}>{found.emoji}</div>
            <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>쿠폰을 사용할까요?</h3>
            <p style={{margin:"0 0 6px",fontSize:14,fontWeight:700,color:C.textDark}}>{found.title}</p>
            <p style={{margin:"0 0 24px",fontSize:13,fontWeight:600,color:C.textMid}}>★ {found.starCost}개의 별이 차감됩니다</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmId(null)} style={{flex:1,padding:"12px",borderRadius:14,border:`2px solid ${C.border}`,background:"white",color:C.textMid,fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer"}}>취소</button>
              <button onClick={confirmUse} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:"white",fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px rgba(108,99,255,.35)"}}>사용하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════ COUPON MANAGE PAGE (부모용) ════════════ */
function CouponManagePage({coupons,onBack,onAdd,onDelete}){
  const [showAddModal,setShowAddModal]=useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState(null);

  return(
    <div style={{animation:"slideUp .4s ease both"}}>
      {/* Header */}
      <div style={{
        background:"white",borderRadius:20,padding:"20px 20px 18px",marginBottom:16,
        boxShadow:"0 4px 20px rgba(108,99,255,.08)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <button onClick={onBack} style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${C.border}`,background:"white",color:C.textMid,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h2 style={{margin:0,fontSize:20,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif",flex:1}}>쿠폰 관리</h2>
          <button onClick={()=>setShowAddModal(true)} style={{
            padding:"8px 16px",borderRadius:999,border:"none",
            background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color:"white",fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",
            cursor:"pointer",boxShadow:"0 3px 12px rgba(108,99,255,.3)",
            display:"flex",alignItems:"center",gap:4,
          }}>
            <span style={{fontSize:16,lineHeight:1}}>+</span> 쿠폰 추가
          </button>
        </div>
        <p style={{margin:0,fontSize:13,fontWeight:600,color:C.textMid}}>아이가 별로 사용할 수 있는 쿠폰을 관리하세요.</p>
      </div>

      {/* Coupon list */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {coupons.map((coupon,i)=>(
          <div key={coupon.id} style={{
            background:"white",borderRadius:20,padding:"16px 20px",
            boxShadow:"0 4px 20px rgba(108,99,255,.08)",
            border:`1.5px solid ${C.border}`,
            display:"flex",alignItems:"center",gap:14,
            animation:`slideUp .4s ${i*0.04}s ease both`,
          }}>
            <div style={{
              width:48,height:48,borderRadius:14,
              background:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:24,flexShrink:0,
            }}>{coupon.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:14,fontWeight:900,color:"#D4A017"}}>★ {coupon.starCost}</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{coupon.title}</div>
              {coupon.desc&&<div style={{fontSize:12,fontWeight:600,color:C.textMid,marginTop:1}}>{coupon.desc}</div>}
            </div>
            <button onClick={()=>setDeleteConfirm(coupon.id)} style={{
              width:32,height:32,borderRadius:"50%",border:"none",
              background:"transparent",color:C.textLight,fontSize:16,
              cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
              padding:0,flexShrink:0,
            }} onMouseEnter={e=>{e.currentTarget.style.background="#FEE";e.currentTarget.style.color=C.secondary}}
               onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.textLight}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 7H18M9 7V5C9 4.45 9.45 4 10 4H14C14.55 4 15 4.45 15 5V7M10 11V17M14 11V17M5 7L6 19C6 19.55 6.45 20 7 20H17C17.55 20 18 19.55 18 19L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ))}
        {coupons.length===0&&(
          <div style={{background:"white",borderRadius:20,padding:"40px 20px",textAlign:"center",boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🎫</div>
            <p style={{fontSize:14,fontWeight:700,color:C.textMid}}>등록된 쿠폰이 없어요</p>
            <p style={{fontSize:12,fontWeight:600,color:C.textLight,margin:"4px 0 0"}}>상단의 "쿠폰 추가" 버튼으로 추가해보세요!</p>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm&&(
        <div onClick={()=>setDeleteConfirm(null)} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"85%",maxWidth:300,background:"white",borderRadius:24,padding:"28px 24px 24px",textAlign:"center",animation:"pop .35s cubic-bezier(.22,.68,.36,1.05)"}}>
            <div style={{fontSize:40,marginBottom:12}}>🗑️</div>
            <h3 style={{margin:"0 0 8px",fontSize:17,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>쿠폰을 삭제할까요?</h3>
            <p style={{margin:"0 0 20px",fontSize:13,fontWeight:600,color:C.textMid}}>삭제하면 아이가 더 이상 사용할 수 없어요.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteConfirm(null)} style={{flex:1,padding:"12px",borderRadius:14,border:`2px solid ${C.border}`,background:"white",color:C.textMid,fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer"}}>취소</button>
              <button onClick={()=>{onDelete(deleteConfirm);setDeleteConfirm(null);}} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.secondary},${C.secondaryLight})`,color:"white",fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 4px 16px rgba(255,101,132,.3)"}}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Add coupon modal */}
      {showAddModal&&<AddCouponModal onClose={()=>setShowAddModal(false)} onAdd={onAdd}/>}
    </div>
  );
}

/* ════════════ ADD COUPON MODAL ════════════ */
function AddCouponModal({onClose,onAdd}){
  const [emoji,setEmoji]=useState("🍪");
  const [starCost,setStarCost]=useState("");
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const inputRef=useRef(null);

  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),100)},[]);

  const valid=title.trim()&&starCost&&Number(starCost)>0;
  const handleAdd=()=>{
    if(!valid)return;
    onAdd({id:uid(),emoji,starCost:Number(starCost),title:title.trim(),desc:desc.trim()});
    onClose();
  };

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(45,43,85,.45)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"white",borderRadius:"28px 28px 0 0",padding:"28px 24px 32px",animation:"slideUp .35s cubic-bezier(.22,.68,.36,1.05)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}}/>
        <h3 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>🎫 쿠폰 추가</h3>

        {/* Emoji picker */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textMid,marginBottom:8}}>아이콘 선택</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {COUPON_EMOJI_OPTIONS.map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{
                width:40,height:40,borderRadius:12,border:emoji===e?`2.5px solid ${C.primary}`:`1.5px solid ${C.border}`,
                background:emoji===e?`${C.primary}10`:"white",
                fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .15s",
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Star cost */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textMid,marginBottom:6}}>필요한 별 갯수</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>★</span>
            <input value={starCost} onChange={e=>{const v=e.target.value.replace(/\D/g,"");setStarCost(v);}} placeholder="0" style={{
              width:80,padding:"12px 16px",borderRadius:14,border:`2px solid ${C.border}`,
              fontSize:18,fontWeight:800,fontFamily:"'Nunito',sans-serif",color:"#D4A017",
              outline:"none",background:C.bg,textAlign:"center",
            }} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
            <span style={{fontSize:13,fontWeight:600,color:C.textMid}}>개</span>
          </div>
        </div>

        {/* Title */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textMid,marginBottom:6}}>쿠폰 이름</div>
          <input ref={inputRef} value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 간식 선택권" style={{
            width:"100%",padding:"14px 18px",borderRadius:16,border:`2px solid ${C.border}`,
            fontSize:15,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,
            outline:"none",background:C.bg,
          }} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>

        {/* Description */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:13,fontWeight:700,color:C.textMid,marginBottom:6}}>설명 (선택)</div>
          <input value={desc} onChange={e=>setDesc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()} placeholder="예: 원하는 간식 하나 고르기" style={{
            width:"100%",padding:"14px 18px",borderRadius:16,border:`2px solid ${C.border}`,
            fontSize:15,fontWeight:600,fontFamily:"'Nunito',sans-serif",color:C.textDark,
            outline:"none",background:C.bg,
          }} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>

        {/* Preview */}
        {valid&&(
          <div style={{background:C.bg,borderRadius:16,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12,border:`1.5px solid ${C.border}`}}>
            <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:900,color:"#D4A017"}}>★ {starCost}</div>
              <div style={{fontSize:13,fontWeight:700,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{title}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:C.textLight}}>미리보기</span>
          </div>
        )}

        <button onClick={handleAdd} disabled={!valid} style={{
          width:"100%",padding:"14px",borderRadius:16,border:"none",
          background:valid?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:C.border,
          color:valid?"white":C.textLight,fontSize:16,fontWeight:800,
          fontFamily:"'Nunito',sans-serif",cursor:valid?"pointer":"default",
          boxShadow:valid?"0 4px 16px rgba(108,99,255,.35)":"none",
        }}>쿠폰 추가하기</button>
      </div>
    </div>
  );
}

/* ════════════ NAV ICONS ════════════ */
const NavIcons = {
  home: a=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinejoin="round" fill={a?`${C.primary}20`:"none"}/><path d="M9 21V14H15V21" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinejoin="round"/></svg>,
  calendar: a=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="3" stroke={a?C.primary:C.textLight} strokeWidth="2" fill={a?`${C.primary}20`:"none"}/><path d="M3 9H21" stroke={a?C.primary:C.textLight} strokeWidth="2"/><path d="M8 2V5" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/><path d="M16 2V5" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/></svg>,
  timeline: a=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7L8 11L12 5" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 8H20" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/><path d="M4 17L8 21L12 15" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 18H20" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/></svg>,
  family: a=><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3" stroke={a?C.primary:C.textLight} strokeWidth="2" fill={a?`${C.primary}20`:"none"}/><circle cx="17" cy="7" r="2.5" stroke={a?C.primary:C.textLight} strokeWidth="2" fill={a?`${C.primary}20`:"none"}/><path d="M2 21V18C2 16.34 3.34 15 5 15H13C14.66 15 16 16.34 16 18V21" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/><path d="M17 15C18.66 15 20 16.34 20 18V21" stroke={a?C.primary:C.textLight} strokeWidth="2" strokeLinecap="round"/></svg>,
};

/* ════════════════════════════════════════════
   AUTH PAGE (magic link)
   ════════════════════════════════════════════ */
const INITIAL_FAMILY_MEMBERS = [
  { id:"fm1", name:"Luna", role:"아이", emoji:"🧒" },
  { id:"fm2", name:"엄마", role:"부모", emoji:"👩" },
];

function AuthPage({ onLogin, passwordRecovery, onRecoveryDone }){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpInviteCode, setSignUpInviteCode] = useState("");
  const [signUpRole, setSignUpRole] = useState("부모");
  const [signUpEmoji, setSignUpEmoji] = useState("👩");

  const inputStyle = {
    width:"100%",padding:"14px 16px",borderRadius:14,
    border:`2px solid ${C.border}`,fontSize:14,fontWeight:600,
    fontFamily:"'Nunito',sans-serif",color:C.textDark,
    outline:"none",background:"white",transition:"border .2s",
    boxSizing:"border-box",
  };

  const handleSubmit = async () => {
    setError("");
    if(!email.trim()) return setError("이메일을 입력해주세요");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("올바른 이메일 형식이 아니에요");
    if(!password) return setError("비밀번호를 입력해주세요");
    if(isSignUp && password.length < 6) return setError("비밀번호는 6자 이상이어야 해요");
    setLoading(true);
    if(isSignUp){
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if(authError){
        if(authError.message.includes("already registered")) return setError("이미 가입된 이메일이에요. 로그인해주세요.");
        if(authError.status===429) return setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
        return setError("회원가입에 실패했어요. 다시 시도해주세요.");
      }
      if(data?.user?.identities?.length===0) return setError("이미 가입된 이메일이에요. 로그인해주세요.");
      // 초대 코드가 있으면 로그인 시 사용하도록 저장
      if(signUpInviteCode.trim()){
        localStorage.setItem("fd_pending_invite",JSON.stringify({
          code:signUpInviteCode.trim().toUpperCase(),
          role:signUpRole,
          emoji:signUpEmoji,
        }));
      }
      if(data?.session){
        // 이메일 확인 없이 바로 로그인된 경우 (Confirm email OFF)
        return;
      }
      // 이메일 확인이 필요한 경우
      setSignUpDone(true);
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if(authError){
        if(authError.message.includes("Invalid login")) return setError("이메일 또는 비밀번호가 맞지 않아요");
        if(authError.status===429) return setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
        return setError("로그인에 실패했어요. 다시 시도해주세요.");
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if(!email.trim()) return setError("이메일을 입력해주세요");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("올바른 이메일 형식이 아니에요");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/familyday-app/',
    });
    setLoading(false);
    if(resetError){
      if(resetError.status===429) return setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
      return setError("메일 발송에 실패했어요. 다시 시도해주세요.");
    }
    setResetSent(true);
  };

  const handleNewPassword = async () => {
    setError("");
    if(!newPassword) return setError("새 비밀번호를 입력해주세요");
    if(newPassword.length < 6) return setError("비밀번호는 6자 이상이어야 해요");
    if(newPassword !== confirmPassword) return setError("비밀번호가 일치하지 않아요");
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if(updateError){
      if(updateError.status===429) return setError("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
      return setError("비밀번호 변경에 실패했어요. 다시 시도해주세요.");
    }
    onRecoveryDone?.();
  };

  // 비밀번호 재설정 (리셋 링크로 접속한 경우)
  if(passwordRecovery){
    return(
      <div style={{animation:"slideUp .4s ease both"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:56,marginBottom:8}}>🔐</div>
          <h2 style={{margin:0,fontSize:22,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>FamilyDay</h2>
          <p style={{margin:"6px 0 0",fontSize:13,fontWeight:600,color:C.textMid}}>가족과 함께하는 하루</p>
        </div>
        <div style={{background:"white",borderRadius:20,padding:"24px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
          <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
            새 비밀번호 설정
          </h3>
          <p style={{margin:"0 0 20px",fontSize:13,fontWeight:600,color:C.textMid}}>
            새로운 비밀번호를 입력해주세요
          </p>
          <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>새 비밀번호</label>
          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
            placeholder="6자 이상 입력해주세요"
            style={{...inputStyle,marginBottom:14}}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}
          />
          <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>비밀번호 확인</label>
          <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력해주세요"
            style={{...inputStyle,marginBottom:4}}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}
            onKeyDown={e=>e.key==="Enter"&&handleNewPassword()}
          />
          {error&&(
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:"#FFF0F0",border:"1.5px solid #FFB4B4",fontSize:13,fontWeight:700,color:C.secondary,fontFamily:"'Nunito',sans-serif"}}>
              {error}
            </div>
          )}
          <button onClick={handleNewPassword} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:16,border:"none",marginTop:18,
            background:loading?"#B0ADE0":`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color:"white",fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",
            cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 16px rgba(108,99,255,.35)",transition:"all .2s",
            opacity:loading?.7:1,
          }}>{loading?"변경 중...":"비밀번호 변경"}</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{animation:"slideUp .4s ease both"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:56,marginBottom:8}}>👨‍👩‍👧</div>
        <h2 style={{margin:0,fontSize:22,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>FamilyDay</h2>
        <p style={{margin:"6px 0 0",fontSize:13,fontWeight:600,color:C.textMid}}>가족과 함께하는 하루</p>
      </div>

      <div style={{background:"white",borderRadius:20,padding:"24px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>

        {resetSent ? (
          <div style={{textAlign:"center",animation:"slideUp .3s ease both"}}>
            <div style={{
              width:64,height:64,borderRadius:"50%",margin:"0 auto 16px",
              background:`linear-gradient(135deg,${C.accent}20,${C.accent}10)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
            }}>✉️</div>
            <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
              비밀번호 재설정 메일을 보냈어요
            </h3>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:600,color:C.textMid}}>
              <span style={{color:C.primary,fontWeight:800}}>{email}</span>
            </p>
            <p style={{margin:"0 0 24px",fontSize:13,fontWeight:600,color:C.textLight}}>
              으로 재설정 링크를 보냈어요
            </p>
            <button onClick={()=>{setResetSent(false);setForgotPassword(false);setPassword("");}} style={{
              width:"100%",padding:"12px",borderRadius:14,border:"none",
              background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
              color:"white",fontSize:14,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .15s",
              boxShadow:"0 4px 16px rgba(108,99,255,.35)",
            }}>로그인으로 돌아가기</button>
          </div>
        ) : forgotPassword ? (
          <div style={{animation:"slideUp .3s ease both"}}>
            <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
              비밀번호 재설정
            </h3>
            <p style={{margin:"0 0 20px",fontSize:13,fontWeight:600,color:C.textMid}}>
              가입한 이메일을 입력하면 재설정 링크를 보내드려요
            </p>
            <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>이메일</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{...inputStyle,marginBottom:4}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}
              onKeyDown={e=>e.key==="Enter"&&handleForgotPassword()}
            />
            {error&&(
              <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:"#FFF0F0",border:"1.5px solid #FFB4B4",fontSize:13,fontWeight:700,color:C.secondary,fontFamily:"'Nunito',sans-serif"}}>
                {error}
              </div>
            )}
            <button onClick={handleForgotPassword} disabled={loading} style={{
              width:"100%",padding:"14px",borderRadius:16,border:"none",marginTop:18,
              background:loading?"#B0ADE0":`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
              color:"white",fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",
              cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 16px rgba(108,99,255,.35)",transition:"all .2s",
              opacity:loading?.7:1,
            }}>{loading?"발송 중...":"재설정 링크 보내기"}</button>
            <button onClick={()=>{setForgotPassword(false);setError("");}} style={{
              width:"100%",padding:"12px",borderRadius:14,border:"none",marginTop:10,
              background:"transparent",color:C.textMid,fontSize:14,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",
            }}>로그인으로 돌아가기</button>
          </div>
        ) : signUpDone ? (
          <div style={{textAlign:"center",animation:"slideUp .3s ease both"}}>
            <div style={{
              width:64,height:64,borderRadius:"50%",margin:"0 auto 16px",
              background:`linear-gradient(135deg,${C.accent}20,${C.accent}10)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
            }}>✉️</div>
            <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
              메일을 확인해주세요
            </h3>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:600,color:C.textMid}}>
              <span style={{color:C.primary,fontWeight:800}}>{email}</span>
            </p>
            <p style={{margin:"0 0 24px",fontSize:13,fontWeight:600,color:C.textLight}}>
              으로 인증 링크를 보냈어요
            </p>
            <button onClick={()=>{setSignUpDone(false);setIsSignUp(false);setPassword("");}} style={{
              width:"100%",padding:"12px",borderRadius:14,border:"none",
              background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
              color:"white",fontSize:14,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .15s",
              boxShadow:"0 4px 16px rgba(108,99,255,.35)",
            }}>로그인하러 가기</button>
          </div>
        ) : (
        <div>
        <div style={{display:"flex",gap:0,marginBottom:20,background:C.bg,borderRadius:12,padding:3}}>
          {["로그인","회원가입"].map((label,i)=>(
            <button key={label} onClick={()=>{setIsSignUp(i===1);setError("");}} style={{
              flex:1,padding:"10px 0",borderRadius:10,border:"none",
              background:(i===0?!isSignUp:isSignUp)?"white":"transparent",
              color:(i===0?!isSignUp:isSignUp)?C.textDark:C.textLight,
              fontSize:14,fontWeight:800,fontFamily:"'Nunito',sans-serif",
              cursor:"pointer",transition:"all .2s",
              boxShadow:(i===0?!isSignUp:isSignUp)?"0 2px 8px rgba(0,0,0,.06)":"none",
            }}>{label}</button>
          ))}
        </div>

        <h3 style={{margin:"0 0 6px",fontSize:18,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
          {isSignUp?"새 계정 만들기":"다시 오셨군요!"}
        </h3>
        <p style={{margin:"0 0 20px",fontSize:13,fontWeight:600,color:C.textMid}}>
          {isSignUp?"이메일과 비밀번호로 가입해요":"이메일과 비밀번호를 입력해주세요"}
        </p>

        <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>이메일</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="example@email.com"
          style={{...inputStyle,marginBottom:14}}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor=C.border}
        />

        <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>비밀번호</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
          placeholder={isSignUp?"6자 이상 입력해주세요":"비밀번호 입력"}
          style={{...inputStyle,marginBottom:4}}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor=C.border}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
        />

        {!isSignUp&&(
          <div style={{textAlign:"right",marginTop:6}}>
            <button onClick={()=>{setForgotPassword(true);setError("");}} style={{
              background:"none",border:"none",padding:0,
              fontSize:12,fontWeight:700,color:C.primary,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",
            }}>비밀번호를 잊으셨나요?</button>
          </div>
        )}

        {isSignUp&&(
          <div style={{marginTop:16,padding:"16px",borderRadius:14,background:C.bg,border:`1.5px solid ${C.border}`}}>
            <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>
              초대 코드 <span style={{fontWeight:600,color:C.textLight}}>(선택)</span>
            </label>
            <input value={signUpInviteCode} onChange={e=>setSignUpInviteCode(e.target.value)}
              placeholder="초대 코드가 있으면 입력 (예: FD-A3K9)"
              style={{...inputStyle,background:"white",marginBottom:signUpInviteCode.trim()?12:0,textTransform:"uppercase",letterSpacing:1}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
            {signUpInviteCode.trim()&&(
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>역할</label>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {["부모","아이","조부모","반려동물"].map(r=>(
                    <button key={r} onClick={()=>{
                      setSignUpRole(r);
                      if(r==="아이") setSignUpEmoji("👦");
                      else if(r==="조부모") setSignUpEmoji("👴");
                      else if(r==="반려동물") setSignUpEmoji("🐶");
                      else setSignUpEmoji("👩");
                    }} style={{
                      padding:"6px 12px",borderRadius:999,border:"none",
                      background:signUpRole===r?C.primary:`${C.primary}08`,
                      color:signUpRole===r?"white":C.textMid,
                      fontSize:12,fontWeight:700,fontFamily:"'Nunito',sans-serif",
                      cursor:"pointer",transition:"all .15s",
                    }}>{r}</button>
                  ))}
                </div>
                <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>아이콘</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["👦","👧","👨","👩","👴","👵","🐶","🐱"].map(em=>(
                    <button key={em} onClick={()=>setSignUpEmoji(em)} style={{
                      width:36,height:36,borderRadius:10,border:"none",
                      background:signUpEmoji===em?`${C.primary}15`:"white",
                      fontSize:18,cursor:"pointer",transition:"all .15s",
                      outline:signUpEmoji===em?`2.5px solid ${C.primary}`:"2px solid transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>{em}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error&&(
          <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:"#FFF0F0",border:"1.5px solid #FFB4B4",fontSize:13,fontWeight:700,color:C.secondary,fontFamily:"'Nunito',sans-serif"}}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:"100%",padding:"14px",borderRadius:16,border:"none",marginTop:18,
          background:loading?"#B0ADE0":`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
          color:"white",fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",
          cursor:loading?"not-allowed":"pointer",boxShadow:"0 4px 16px rgba(108,99,255,.35)",transition:"all .2s",
          opacity:loading?.7:1,
        }}
          onMouseEnter={e=>{if(!loading)e.currentTarget.style.transform="scale(1.02)";}}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
        >{loading?(isSignUp?"가입 중...":"로그인 중..."):(isSignUp?"회원가입":"로그인")}</button>
        </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MY PAGE (logged in)
   ════════════════════════════════════════════ */
const MEMBER_EMOJIS = ["👦","👧","👨","👩","👴","👵","🐶","🐱"];
const ROLE_OPTIONS = ["부모","아이","조부모","반려동물"];

function AddMemberModal({ onClose, onAdd }){
  const [name, setName] = useState("");
  const [role, setRole] = useState("아이");
  const [emoji, setEmoji] = useState("👦");
  const inputRef = useRef(null);

  useEffect(()=>{setTimeout(()=>inputRef.current?.focus(),150);},[]);

  const handleAdd = () => {
    if(!name.trim()) return;
    onAdd({ id:"fm"+Date.now(), name:name.trim(), role, emoji });
    onClose();
  };

  const inputStyle = {
    width:"100%",padding:"12px 14px",borderRadius:14,
    border:`2px solid ${C.border}`,fontSize:14,fontWeight:600,
    fontFamily:"'Nunito',sans-serif",color:C.textDark,
    outline:"none",background:C.bg,transition:"border .2s",
    boxSizing:"border-box",
  };

  return(
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(45,43,85,.45)",
      backdropFilter:"blur(6px)",zIndex:1000,display:"flex",
      alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s ease",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:420,background:"white",
        borderRadius:"28px 28px 0 0",padding:"24px 22px 32px",
        animation:"slideUp .35s cubic-bezier(.22,.68,.36,1.05)",
      }}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 18px"}}/>
        <h3 style={{margin:"0 0 20px",fontSize:20,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>
          👨‍👩‍👧 구성원 추가
        </h3>

        {/* Name */}
        <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>이름</label>
        <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)}
          placeholder="예: 다혜"
          style={{...inputStyle,marginBottom:16}}
          onFocus={e=>e.target.style.borderColor=C.primary}
          onBlur={e=>e.target.style.borderColor=C.border}
          onKeyDown={e=>e.key==="Enter"&&handleAdd()}
        />

        {/* Role */}
        <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8,display:"block"}}>역할</label>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {ROLE_OPTIONS.map(r=>(
            <button key={r} onClick={()=>setRole(r)} style={{
              padding:"7px 16px",borderRadius:999,border:"none",
              background:role===r?C.primary:`${C.primary}08`,
              color:role===r?"white":C.textMid,
              fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif",
              cursor:"pointer",transition:"all .15s",
            }}>{r}</button>
          ))}
        </div>

        {/* Emoji */}
        <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:8,display:"block"}}>아이콘</label>
        <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
          {MEMBER_EMOJIS.map(em=>(
            <button key={em} onClick={()=>setEmoji(em)} style={{
              width:44,height:44,borderRadius:12,border:"none",
              background:emoji===em?`${C.primary}15`:C.bg,
              fontSize:22,cursor:"pointer",transition:"all .15s",
              outline:emoji===em?`2.5px solid ${C.primary}`:"2px solid transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{em}</button>
          ))}
        </div>

        {/* Submit */}
        <button onClick={handleAdd}
          disabled={!name.trim()}
          style={{
            width:"100%",padding:"14px",borderRadius:16,border:"none",
            background:name.trim()?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:C.border,
            color:name.trim()?"white":C.textLight,
            fontSize:16,fontWeight:800,fontFamily:"'Nunito',sans-serif",
            cursor:name.trim()?"pointer":"default",
            boxShadow:name.trim()?"0 4px 16px rgba(108,99,255,.35)":"none",
            transition:"all .2s",
          }}>추가하기</button>
      </div>
    </div>
  );
}

function MyPage({ user, onUpdate, onLogout, onCouponManage }){
  const [editingName, setEditingName] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinRole, setJoinRole] = useState("부모");
  const [joinEmoji, setJoinEmoji] = useState("👩");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const fileRef = useRef(null);

  const generateInvite = async () => {
    const code = "FD-" + Math.random().toString(36).substring(2,6).toUpperCase();
    const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
    await supabase.from("family_invites").insert({family_id:user.familyId,code,invited_by:user.id,expires_at:expires});
    setInviteCode(code);
  };

  const handleJoin = async () => {
    setJoinError("");
    if(!joinCode.trim()) return setJoinError("초대 코드를 입력해주세요");
    setJoinLoading(true);
    const {data:invite}=await supabase.from("family_invites").select("*").eq("code",joinCode.trim().toUpperCase()).is("used_by",null).gt("expires_at",new Date().toISOString()).single();
    if(!invite){setJoinLoading(false);return setJoinError("유효하지 않거나 만료된 코드예요");}
    // 기존 가족에서 나가기 (본인 멤버 삭제)
    await supabase.from("family_members").delete().eq("user_id",user.id);
    // 새 가족에 합류
    await supabase.from("family_members").insert({family_id:invite.family_id,user_id:user.id,name:user.nickname,role:joinRole,emoji:joinEmoji});
    // 초대 코드 사용 처리
    await supabase.from("family_invites").update({used_by:user.id}).eq("id",invite.id);
    // 가족 정보 새로고침
    const {data:members}=await supabase.from("family_members").select("*").eq("family_id",invite.family_id).order("created_at");
    const updated={...user,familyId:invite.family_id,members:(members||[]).map(m=>({id:m.id,name:m.name,role:m.role,emoji:m.emoji,userId:m.user_id}))};
    onUpdate(updated);
    setJoinLoading(false);
    setShowJoinInput(false);
    setJoinCode("");
  };

  const deleteMember = async (memberId) => {
    await supabase.from("family_members").delete().eq("id",memberId);
    const updated={...user,members:user.members.filter(m=>m.id!==memberId)};
    onUpdate(updated);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate({...user, photo: ev.target.result});
    };
    reader.readAsDataURL(file);
  };

  const saveName = () => {
    if(nickname.trim()){
      onUpdate({...user, nickname: nickname.trim()});
    } else {
      setNickname(user.nickname);
    }
    setEditingName(false);
  };

  return(
    <div style={{animation:"slideUp .4s ease both"}}>
      {/* Profile card */}
      <div style={{background:"white",borderRadius:20,padding:"28px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",textAlign:"center",marginBottom:16}}>
        {/* Avatar */}
        <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
          <div onClick={()=>fileRef.current?.click()} style={{
            width:80,height:80,borderRadius:"50%",
            background:user.photo?`url(${user.photo}) center/cover`:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:user.photo?0:36,color:"white",
            cursor:"pointer",border:`3px solid ${C.primary}20`,
            boxShadow:"0 4px 16px rgba(108,99,255,.2)",
            transition:"transform .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            {!user.photo&&user.nickname.charAt(0)}
          </div>
          <div onClick={()=>fileRef.current?.click()} style={{
            position:"absolute",bottom:0,right:0,
            width:26,height:26,borderRadius:"50%",
            background:C.primary,border:"2px solid white",
            display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",fontSize:13,color:"white",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232l3.536 3.536M7 17H4v-3L16.5 1.5a2.121 2.121 0 013 3L7 17z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{display:"none"}}/>
        </div>

        {/* Nickname */}
        {editingName?(
          <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:4}}>
            <input value={nickname} onChange={e=>setNickname(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveName()}
              autoFocus
              style={{
                padding:"6px 12px",borderRadius:10,border:`2px solid ${C.primary}`,
                fontSize:18,fontWeight:800,fontFamily:"'Nunito',sans-serif",
                color:C.textDark,outline:"none",width:140,textAlign:"center",
              }}
            />
            <button onClick={saveName} style={{
              padding:"6px 12px",borderRadius:10,border:"none",
              background:C.primary,color:"white",fontSize:13,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",
            }}>저장</button>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center",marginBottom:4}}>
            <h2 style={{margin:0,fontSize:20,fontWeight:900,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{user.nickname}</h2>
            <button onClick={()=>setEditingName(true)} style={{
              background:"none",border:"none",cursor:"pointer",padding:4,
              color:C.textLight,fontSize:14,display:"flex",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15.232 5.232l3.536 3.536M7 17H4v-3L16.5 1.5a2.121 2.121 0 013 3L7 17z" stroke={C.textLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
        <p style={{margin:0,fontSize:13,fontWeight:600,color:C.textMid}}>{user.email}</p>
      </div>

      {/* Family members */}
      <div style={{background:"white",borderRadius:20,padding:"20px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",marginBottom:16}}>
        <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:8}}>
          👨‍👩‍👧 가족 구성원
        </h3>
        {user.members.map((m,i)=>(
          <div key={m.id} style={{
            display:"flex",alignItems:"center",gap:14,padding:"12px 0",
            borderBottom:i<user.members.length-1?`1px solid ${C.border}`:"none",
          }}>
            <div style={{
              width:42,height:42,borderRadius:"50%",
              background:`linear-gradient(135deg,${C.primaryLight}30,${C.primary}15)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,
            }}>{m.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>{m.name}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.textMid}}>{m.role}</div>
            </div>
            {m.userId!==user.id&&(
              <button onClick={()=>deleteMember(m.id)} style={{
                background:"none",border:"none",cursor:"pointer",padding:6,color:C.textLight,fontSize:16,
              }}>✕</button>
            )}
          </div>
        ))}
        <button onClick={()=>setShowAddMember(true)} style={{
          width:"100%",padding:"12px",borderRadius:14,border:`2px dashed ${C.border}`,
          background:"transparent",color:C.textMid,fontSize:14,fontWeight:700,
          fontFamily:"'Nunito',sans-serif",cursor:"pointer",marginTop:12,
          transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMid;}}
        >+ 구성원 추가</button>
      </div>

      {/* 초대 코드 */}
      <div style={{background:"white",borderRadius:20,padding:"20px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",marginBottom:16}}>
        <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:8}}>
          🔗 가족 초대
        </h3>

        {inviteCode ? (
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontSize:13,fontWeight:600,color:C.textMid,marginBottom:8}}>초대 코드 (24시간 유효)</div>
            <div style={{fontSize:28,fontWeight:900,color:C.primary,fontFamily:"'Nunito',sans-serif",letterSpacing:2,marginBottom:12}}>{inviteCode}</div>
            <button onClick={()=>{navigator.clipboard?.writeText(inviteCode);}} style={{
              padding:"8px 20px",borderRadius:999,border:"none",
              background:C.bg,color:C.primary,fontSize:13,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",
            }}>코드 복사</button>
          </div>
        ) : (
          <button onClick={generateInvite} style={{
            width:"100%",padding:"12px",borderRadius:14,border:"none",
            background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
            color:"white",fontSize:14,fontWeight:700,
            fontFamily:"'Nunito',sans-serif",cursor:"pointer",
            boxShadow:"0 4px 16px rgba(108,99,255,.25)",transition:"all .2s",
          }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >초대 코드 생성</button>
        )}

        <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:16}}>
          {showJoinInput ? (
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>초대 코드</label>
              <input value={joinCode} onChange={e=>setJoinCode(e.target.value)}
                placeholder="초대 코드 입력 (예: FD-A3K9)"
                style={{
                  width:"100%",padding:"12px 14px",borderRadius:14,
                  border:`2px solid ${C.border}`,fontSize:14,fontWeight:600,
                  fontFamily:"'Nunito',sans-serif",color:C.textDark,
                  outline:"none",background:C.bg,boxSizing:"border-box",
                  marginBottom:12,textTransform:"uppercase",letterSpacing:1,
                }}
                onFocus={e=>e.target.style.borderColor=C.primary}
                onBlur={e=>e.target.style.borderColor=C.border}
              />
              <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>역할</label>
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {ROLE_OPTIONS.map(r=>(
                  <button key={r} onClick={()=>{
                    setJoinRole(r);
                    if(r==="아이") setJoinEmoji("👦");
                    else if(r==="조부모") setJoinEmoji("👴");
                    else if(r==="반려동물") setJoinEmoji("🐶");
                    else setJoinEmoji("👩");
                  }} style={{
                    padding:"7px 14px",borderRadius:999,border:"none",
                    background:joinRole===r?C.primary:`${C.primary}08`,
                    color:joinRole===r?"white":C.textMid,
                    fontSize:13,fontWeight:700,fontFamily:"'Nunito',sans-serif",
                    cursor:"pointer",transition:"all .15s",
                  }}>{r}</button>
                ))}
              </div>
              <label style={{fontSize:12,fontWeight:700,color:C.textMid,marginBottom:6,display:"block"}}>아이콘</label>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                {MEMBER_EMOJIS.map(em=>(
                  <button key={em} onClick={()=>setJoinEmoji(em)} style={{
                    width:40,height:40,borderRadius:10,border:"none",
                    background:joinEmoji===em?`${C.primary}15`:C.bg,
                    fontSize:20,cursor:"pointer",transition:"all .15s",
                    outline:joinEmoji===em?`2.5px solid ${C.primary}`:"2px solid transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{em}</button>
                ))}
              </div>
              {joinError&&<div style={{fontSize:13,fontWeight:700,color:C.secondary,marginBottom:8}}>{joinError}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={handleJoin} disabled={joinLoading} style={{
                  flex:1,padding:"10px",borderRadius:12,border:"none",
                  background:C.primary,color:"white",fontSize:14,fontWeight:700,
                  fontFamily:"'Nunito',sans-serif",cursor:joinLoading?"not-allowed":"pointer",
                  opacity:joinLoading?.7:1,
                }}>{joinLoading?"합류 중...":"가족 합류"}</button>
                <button onClick={()=>{setShowJoinInput(false);setJoinCode("");setJoinError("");setJoinRole("부모");setJoinEmoji("👩");}} style={{
                  padding:"10px 16px",borderRadius:12,border:"none",
                  background:C.bg,color:C.textMid,fontSize:14,fontWeight:700,
                  fontFamily:"'Nunito',sans-serif",cursor:"pointer",
                }}>취소</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setShowJoinInput(true)} style={{
              width:"100%",padding:"12px",borderRadius:14,border:`2px dashed ${C.border}`,
              background:"transparent",color:C.textMid,fontSize:14,fontWeight:700,
              fontFamily:"'Nunito',sans-serif",cursor:"pointer",
              transition:"all .15s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.color=C.primary;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textMid;}}
            >초대 코드로 가족 합류</button>
          )}
        </div>
      </div>

      {/* Coupon manage */}
      <div onClick={onCouponManage} style={{
        background:"white",borderRadius:20,padding:"16px 20px",marginBottom:16,
        boxShadow:"0 4px 20px rgba(108,99,255,.08)",
        display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"transform .2s",
      }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
         onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🎫</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:800,color:C.textDark,fontFamily:"'Nunito',sans-serif"}}>쿠폰 관리</div>
          <div style={{fontSize:12,fontWeight:600,color:C.textMid,marginTop:2}}>아이 보상 쿠폰 추가 · 삭제</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M9 5L16 12L9 19" stroke={C.textLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {/* Logout */}
      <button onClick={onLogout} style={{
        width:"100%",padding:"14px",borderRadius:16,border:"none",
        background:C.bg,color:C.textMid,fontSize:15,fontWeight:700,
        fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .15s",
      }}
        onMouseEnter={e=>{e.currentTarget.style.background="#FFF0F0";e.currentTarget.style.color=C.secondary;}}
        onMouseLeave={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.textMid;}}
      >로그아웃</button>

      {showAddMember&&(
        <AddMemberModal
          onClose={()=>setShowAddMember(false)}
          onAdd={async(member)=>{
            const {data:row}=await supabase.from("family_members").insert({family_id:user.familyId,name:member.name,role:member.role,emoji:member.emoji}).select("id").single();
            const newMember={...member,id:row?.id||member.id};
            const updated={...user,members:[...user.members,newMember]};
            onUpdate(updated);
          }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════ */
export default function FamilyDay() {
  const [calTab,setCalTab]=useState("monthly");
  const [todos,setTodos]=useState([]);
  const [showModal,setShowModal]=useState(false);
  const [editingTodo,setEditingTodo]=useState(null);
  const [showCoupon,setShowCoupon]=useState(false);
  const [showCouponManage,setShowCouponManage]=useState(false);
  const [coupons,setCoupons]=useState([]);
  const [stars,setStars]=useState(0);
  const [navTab,setNavTab]=useState("home");
  const [mounted,setMounted]=useState(false);
  const [events,setEvents]=useState([]);
  const [user,setUser]=useState(null);
  const [authReady,setAuthReady]=useState(false);
  const [dbLoaded,setDbLoaded]=useState(false);
  const [passwordRecovery,setPasswordRecovery]=useState(false);

  /* ── Supabase: 가족/구성원 로드 ── */
  async function loadFamily(userId){
    // 1. 이 유저가 속한 가족 찾기
    const {data:memberRow}=await supabase.from("family_members").select("family_id").eq("user_id",userId).limit(1).single();
    let familyId=memberRow?.family_id;
    // 2. 가족이 없으면: 대기 중인 초대 코드 확인 → 없으면 새 가족 생성
    if(!familyId){
      const pendingRaw=localStorage.getItem("fd_pending_invite");
      if(pendingRaw){
        const pending=JSON.parse(pendingRaw);
        localStorage.removeItem("fd_pending_invite");
        const {data:invite}=await supabase.from("family_invites").select("*").eq("code",pending.code).is("used_by",null).gt("expires_at",new Date().toISOString()).single();
        if(invite){
          familyId=invite.family_id;
          const {data:{user:authUser}}=await supabase.auth.getUser();
          await supabase.from("family_members").insert({family_id:familyId,user_id:userId,name:authUser.email.split("@")[0],role:pending.role||"부모",emoji:pending.emoji||"👩"});
          await supabase.from("family_invites").update({used_by:userId}).eq("id",invite.id);
        }
      }
      if(!familyId){
        // 클라이언트에서 UUID 생성 — RLS SELECT 정책(get_my_family_id)이
        // family_members 등록 전이라 insert().select() 조회 불가하므로
        familyId=crypto.randomUUID();
        await supabase.from("families").insert({id:familyId,name:"우리 가족"});
        const {data:{user:authUser}}=await supabase.auth.getUser();
        await supabase.from("family_members").insert({family_id:familyId,user_id:userId,name:authUser.email.split("@")[0],role:"부모",emoji:"👩"});
      }
    }
    // 3. 가족 구성원 목록 조회
    const {data:members}=await supabase.from("family_members").select("*").eq("family_id",familyId).order("created_at");
    return {familyId,members:(members||[]).map(m=>({id:m.id,name:m.name,role:m.role,emoji:m.emoji,userId:m.user_id}))};
  }

  /* ── Supabase Auth: 세션 감지 ── */
  useEffect(()=>{
    async function handleSession(session){
      if(session?.user){
        const u=session.user;
        const stored=localStorage.getItem("fd_user");
        const prev=stored?JSON.parse(stored):null;
        try{
          const {familyId,members}=await loadFamily(u.id);
          const merged={
            id:u.id,
            email:u.email,
            nickname:prev?.nickname||u.email.split("@")[0],
            photo:prev?.photo||null,
            familyId,
            members,
          };
          setUser(merged);
          localStorage.setItem("fd_user",JSON.stringify(merged));
        }catch(e){
          console.error("loadFamily 실패:",e);
          // 가족 로드 실패해도 기본 정보로 로그인 허용
          const fallback={id:u.id,email:u.email,nickname:prev?.nickname||u.email.split("@")[0],photo:prev?.photo||null,familyId:null,members:[]};
          setUser(fallback);
          localStorage.setItem("fd_user",JSON.stringify(fallback));
        }
      }
    }
    // URL에 token_hash가 있으면 이메일 인증 처리 (GitHub Pages 404 리다이렉트 대응)
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    if(tokenHash && type){
      supabase.auth.verifyOtp({token_hash:tokenHash,type}).then(({error})=>{
        // 인증 처리 후 URL 정리
        window.history.replaceState(null,"",window.location.pathname);
        if(!error){
          supabase.auth.getSession().then(({data:{session}})=>{
            handleSession(session).then(()=>setAuthReady(true));
          });
        } else {
          setAuthReady(true);
        }
      });
    } else {
      supabase.auth.getSession().then(({data:{session}})=>{
        handleSession(session).then(()=>setAuthReady(true));
      });
    }
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="PASSWORD_RECOVERY"){
        setPasswordRecovery(true);
      }
      if(session?.user){
        handleSession(session);
      } else {
        setUser(null);
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  /* ── Supabase: 초기 데이터 로드 ── */
  useEffect(()=>{
    if(!user?.familyId) return;
    const fid=user.familyId;
    async function loadAll(){
      const [todosRes,eventsRes,couponsRes,settingsRes]=await Promise.all([
        supabase.from("todos").select("*").eq("family_id",fid),
        supabase.from("events").select("*").eq("family_id",fid),
        supabase.from("coupons").select("*").eq("family_id",fid),
        supabase.from("family_settings").select("*").eq("family_id",fid).single(),
      ]);
      if(todosRes.data){
        const mapped=todosRes.data.map(r=>({id:r.id,text:r.text,owner:r.owner,isDone:r.is_done,starReward:r.star_reward,createdDate:r.created_date,isWeekly:r.is_weekly,doneDate:r.done_date||undefined}));
        // 주간 리셋 로직
        const todayKey=fmtDateKey(new Date());
        const curWeekStart=fmtDateKey(getWeekStartDate(new Date()));
        const weeklyTemplates=mapped.filter(t=>t.isWeekly);
        const thisWeekTodos=mapped.filter(t=>{
          const todoWeekStart=fmtDateKey(getWeekStartDate(new Date(t.createdDate+"T00:00:00")));
          return todoWeekStart===curWeekStart;
        });
        if(thisWeekTodos.length===0&&weeklyTemplates.length>0){
          const newTodos=weeklyTemplates.map(t=>({...t,id:uid(),isDone:false,createdDate:todayKey}));
          setTodos(newTodos);
          // DB에도 새 주간 할 일 저장
          for(const t of newTodos){
            supabase.from("todos").insert({id:t.id,text:t.text,owner:t.owner,is_done:false,star_reward:t.starReward,created_date:t.createdDate,is_weekly:t.isWeekly,family_id:fid}).then(()=>{});
          }
        } else {
          setTodos(mapped);
        }
      }
      if(eventsRes.data){
        setEvents(eventsRes.data.map(r=>({id:r.id,title:r.title,date:r.date,startHour:r.start_hour,startMin:r.start_min,endHour:r.end_hour,endMin:r.end_min,color:r.color,emoji:r.emoji})));
      }
      if(couponsRes.data){
        setCoupons(couponsRes.data.map(r=>({id:r.id,starCost:r.star_cost,title:r.title,desc:r.description,emoji:r.emoji})));
      }
      if(settingsRes.data){
        setStars(settingsRes.data.stars||0);
      }
      setDbLoaded(true);
    }
    loadAll();
  },[user?.familyId]);

  /* ── Supabase: stars 변경 시 DB 동기화 ── */
  useEffect(()=>{
    if(!dbLoaded) return;
    if(!user?.familyId) return;
    supabase.from("family_settings").upsert({family_id:user.familyId,stars,updated_at:new Date().toISOString()},{onConflict:"family_id"}).then(()=>{});
  },[stars,dbLoaded]);

  const addEvent=useCallback(ev=>{
    setEvents(p=>[...p,ev]);
    supabase.from("events").insert({id:ev.id,title:ev.title,date:ev.date,start_hour:ev.startHour,start_min:ev.startMin,end_hour:ev.endHour,end_min:ev.endMin,color:ev.color,emoji:ev.emoji,family_id:user?.familyId}).then(()=>{});
  },[]);
  const handleLogin=useCallback(u=>{setUser(u);localStorage.setItem("fd_user",JSON.stringify(u));},[]);
  const handleUpdateUser=useCallback(u=>{setUser(u);localStorage.setItem("fd_user",JSON.stringify(u));},[]);
  const handleLogout=useCallback(async()=>{
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("fd_user");
  },[]);

  useEffect(()=>{requestAnimationFrame(()=>setMounted(true));},[]);

  const toggleTodo=useCallback(id=>{
    const dk=fmtDateKey(new Date());
    setTodos(prev=>prev.map(t=>{
      if(t.id===id&&!t.isDone){
        setStars(s=>s+t.starReward);
        const updated={...t,isDone:true,doneDate:dk};
        supabase.from("todos").update({is_done:true,done_date:dk}).eq("id",id).then(()=>{});
        return updated;
      }
      if(t.id===id&&t.isDone&&t.owner==="mom"){
        supabase.from("todos").update({is_done:false,done_date:null}).eq("id",id).then(()=>{});
        return{...t,isDone:false,doneDate:undefined};
      }
      return t;
    }));
  },[]);
  const deleteTodo=useCallback(id=>{
    setTodos(p=>p.filter(t=>t.id!==id));
    supabase.from("todos").delete().eq("id",id).then(()=>{});
  },[]);
  const addTodo=useCallback(item=>{
    setTodos(p=>[...p,item]);
    supabase.from("todos").insert({id:item.id,text:item.text,owner:item.owner,is_done:item.isDone||false,star_reward:item.starReward||1,created_date:item.createdDate,is_weekly:item.isWeekly||false,family_id:user?.familyId}).then(()=>{});
  },[]);
  const editTodo=useCallback(updated=>{
    setTodos(p=>p.map(t=>t.id===updated.id?updated:t));
    supabase.from("todos").update({text:updated.text,owner:updated.owner,star_reward:updated.starReward,is_weekly:updated.isWeekly}).eq("id",updated.id).then(()=>{});
  },[]);

  const today=new Date();
  const todayKey=fmtDateKey(today);
  const curWeekStart=fmtDateKey(getWeekStartDate(today));
  // 이번 주 할 일만 표시: 미완료는 유지, 완료는 완료한 날짜에만 표시
  const visibleTodos=todos.filter(t=>{
    const todoWeekStart=fmtDateKey(getWeekStartDate(new Date(t.createdDate+"T00:00:00")));
    if(todoWeekStart!==curWeekStart) return false;
    if(!t.isDone) return true;
    return t.doneDate===todayKey;
  });
  const momTodos=visibleTodos.filter(t=>t.owner==="mom");
  const kidTodos=visibleTodos.filter(t=>t.owner==="kid");
  const dateStr=today.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
  const kidName=useMemo(()=>{
    const kid=user?.members?.find(m=>m.role==="아이");
    return kid?.name||"아이";
  },[user]);

  const spendStars=useCallback(cost=>setStars(s=>Math.max(0,s-cost)),[]);
  const addCoupon=useCallback(c=>{
    setCoupons(p=>[...p,c].sort((a,b)=>a.starCost-b.starCost));
    supabase.from("coupons").insert({id:c.id,star_cost:c.starCost,title:c.title,description:c.desc,emoji:c.emoji,family_id:user?.familyId}).then(()=>{});
  },[]);
  const deleteCoupon=useCallback(id=>{
    setCoupons(p=>p.filter(c=>c.id!==id));
    supabase.from("coupons").delete().eq("id",id).then(()=>{});
  },[]);

  /* Show home tab content vs timeline vs calendar */
  const showHome = navTab === "home" && !showCoupon;
  const showTimeline = navTab === "timeline";
  const showCal = navTab === "cal";

  return (
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"'Nunito',sans-serif",position:"relative",overflowX:"hidden"}}>

      {/* ─── Status bar ─── */}
      <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,padding:"12px 20px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)",marginBottom:4}}>
          <span>9:41</span><span style={{fontSize:11}}>⭐ {stars}</span>
        </div>
      </div>

      {/* ─── Header (Home) ─── */}
      {showHome && (
        <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,padding:"8px 20px 24px",borderRadius:"0 0 32px 32px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.07)"}}/>
          <div style={{position:"absolute",bottom:-30,left:40,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <h1 style={{margin:0,fontSize:13,fontWeight:700,color:"rgba(255,255,255,.7)",letterSpacing:1.5,textTransform:"uppercase"}}>FamilyDay</h1>
              <h2 style={{margin:"4px 0 2px",fontSize:22,fontWeight:900,color:"white"}}>안녕, {kidName}네 가족! 👋</h2>
              <p style={{margin:0,fontSize:13,color:"rgba(255,255,255,.7)",fontWeight:600}}>{dateStr}</p>
            </div>
            <CuteFace size={48} style={{border:"3px solid rgba(255,255,255,.3)"}}/>
          </div>
        </div>
      )}

      {/* ─── Header (Timeline / Family) ─── */}
      {(showTimeline || navTab==="family") && (
        <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,padding:"8px 20px 20px",borderRadius:"0 0 32px 32px"}}/>
      )}

      {/* ─── Header (Calendar) ─── */}
      {showCal && (
        <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,padding:"8px 20px 24px",borderRadius:"0 0 32px 32px"}}>
          <div style={{display:"flex",gap:6,marginTop:4,background:"rgba(255,255,255,.15)",borderRadius:999,padding:4}}>
            {[["daily","일간"],["weekly","주간"],["monthly","월간"]].map(([k,label])=>(
              <button key={k} onClick={()=>setCalTab(k)} style={{flex:1,padding:"8px 0",borderRadius:999,border:"none",background:calTab===k?"white":"transparent",color:calTab===k?C.primary:"rgba(255,255,255,.8)",fontSize:13,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .25s"}}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Content ─── */}
      <div style={{padding:"20px 16px 100px",opacity:mounted?1:0,transition:"opacity .4s ease"}}>

        {/* ═══ HOME ═══ */}
        {showHome && (
          <div>
            <div style={{background:"white",borderRadius:20,padding:"18px 20px",marginBottom:16,boxShadow:"0 4px 20px rgba(108,99,255,.08)",animation:"slideUp .5s ease both"}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:800,color:C.textDark,display:"flex",alignItems:"center",gap:8}}>📅 오늘의 일정</h3>
              {INITIAL_SCHEDULE.map((s,i)=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<INITIAL_SCHEDULE.length-1?`1px solid ${C.border}`:"none",animation:`slideUp .5s ${.1+i*.08}s ease both`}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0,boxShadow:`0 0 8px ${s.color}60`}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.textMid,minWidth:44}}>{s.time}</span>
                  <span style={{fontSize:15,fontWeight:600,color:C.textDark}}>{s.emoji} {s.label}</span>
                </div>
              ))}
            </div>
            <div style={{background:"white",borderRadius:20,padding:"18px 20px",boxShadow:"0 4px 20px rgba(108,99,255,.08)",animation:"slideUp .5s .15s ease both"}}>
              <h3 style={{margin:"0 0 16px",fontSize:16,fontWeight:800,color:C.textDark,display:"flex",alignItems:"center",gap:8}}>📋 할 일 보드</h3>
              <div style={{marginBottom:20}}>
                <span style={{display:"inline-block",padding:"4px 14px",borderRadius:999,background:`${C.momTag}15`,border:`1.5px solid ${C.momTag}40`,color:C.momTag,fontSize:12,fontWeight:800,marginBottom:8}}>👩 엄마</span>
                {momTodos.map(t=><TodoItem key={t.id} item={t} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={setEditingTodo}/>)}
                {momTodos.length===0&&<p style={{color:C.textLight,fontSize:14,fontWeight:600,padding:"12px 0",textAlign:"center"}}>아직 할 일이 없어요! ✨</p>}
              </div>
              <div>
                <span style={{display:"inline-block",padding:"4px 14px",borderRadius:999,background:`${C.kidTag}15`,border:`1.5px solid ${C.kidTag}40`,color:C.kidTag,fontSize:12,fontWeight:800,marginBottom:8}}>🧒 {kidName}</span>
                {kidTodos.map(t=><TodoItem key={t.id} item={t} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={setEditingTodo}/>)}
                {kidTodos.length===0&&<p style={{color:C.textLight,fontSize:14,fontWeight:600,padding:"12px 0",textAlign:"center"}}>다 했어요! 🎉</p>}
              </div>
            </div>
            <div onClick={()=>setShowCoupon(true)} style={{marginTop:16,background:"linear-gradient(135deg,#FFF9E0,#FFF3CC)",borderRadius:20,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 4px 16px rgba(255,215,0,.15)",animation:"slideUp .5s .25s ease both",cursor:"pointer",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{width:44,height:44,borderRadius:14,background:"linear-gradient(135deg,#FFD700,#FFE44D)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 3px 10px rgba(255,215,0,.3)"}}>⭐</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#B8860B",marginBottom:4}}>별 모으기</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:18,fontWeight:900,color:"#D4A017"}}>{stars}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#B8860B"}}>개</span>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{flexShrink:0,opacity:0.5}}><path d="M9 5L16 12L9 19" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        )}

        {/* ═══ COUPON PAGE ═══ */}
        {navTab==="home"&&showCoupon&&(
          <CouponPage stars={stars} coupons={coupons} onBack={()=>setShowCoupon(false)} onUse={spendStars}/>
        )}

        {/* ═══ TIMELINE ═══ */}
        {showTimeline && <KidDayTimeline kidName={kidName}/>}

        {/* ═══ CALENDAR: DAILY ═══ */}
        {showCal && calTab==="daily"&&(
          <div style={{animation:"slideUp .5s ease both"}}>
            <div style={{background:"white",borderRadius:20,padding:"18px 20px",marginBottom:16,boxShadow:"0 4px 20px rgba(108,99,255,.08)"}}>
              <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:800,color:C.textDark,display:"flex",alignItems:"center",gap:8}}>📅 오늘의 일정</h3>
              {INITIAL_SCHEDULE.map((s,i)=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<INITIAL_SCHEDULE.length-1?`1px solid ${C.border}`:"none",animation:`slideUp .5s ${.1+i*.08}s ease both`}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0,boxShadow:`0 0 8px ${s.color}60`}}/>
                  <span style={{fontSize:13,fontWeight:700,color:C.textMid,minWidth:44}}>{s.time}</span>
                  <span style={{fontSize:15,fontWeight:600,color:C.textDark}}>{s.emoji} {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CALENDAR: WEEKLY ═══ */}
        {showCal && calTab==="weekly"&&<WeeklyCalendar events={events}/>}

        {/* ═══ CALENDAR: MONTHLY ═══ */}
        {showCal && calTab==="monthly"&&<MonthlyCalendar events={events} onAddEvent={addEvent}/>}

        {/* ═══ PASSWORD RECOVERY OVERLAY ═══ */}
        {passwordRecovery&&user&&(
          <div style={{
            position:"fixed",inset:0,background:"rgba(45,43,85,.45)",
            backdropFilter:"blur(6px)",zIndex:1000,display:"flex",
            alignItems:"center",justifyContent:"center",animation:"fadeIn .2s ease",
            padding:20,
          }}>
            <div style={{width:"100%",maxWidth:420}}>
              <AuthPage onLogin={handleLogin} passwordRecovery={passwordRecovery} onRecoveryDone={()=>setPasswordRecovery(false)}/>
            </div>
          </div>
        )}

        {/* ═══ FAMILY ═══ */}
        {navTab==="family"&&!showCouponManage&&(
          user
            ? <MyPage user={user} onUpdate={handleUpdateUser} onLogout={handleLogout} onCouponManage={()=>setShowCouponManage(true)}/>
            : <AuthPage onLogin={handleLogin} passwordRecovery={passwordRecovery} onRecoveryDone={()=>setPasswordRecovery(false)}/>
        )}
        {navTab==="family"&&showCouponManage&&(
          <CouponManagePage coupons={coupons} onBack={()=>setShowCouponManage(false)} onAdd={addCoupon} onDelete={deleteCoupon}/>
        )}
      </div>

      {/* Floating add — home only */}
      {showHome && (
        <button onClick={()=>setShowModal(true)} style={{position:"fixed",bottom:88,left:"50%",transform:"translateX(-50%)",padding:"12px 28px",borderRadius:999,border:"none",background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,color:"white",fontSize:15,fontWeight:800,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 6px 24px rgba(108,99,255,.4)",zIndex:100,display:"flex",alignItems:"center",gap:8,animation:"pulseGlow 2.5s infinite",transition:"transform .2s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="translateX(-50%) scale(1.06)"}
          onMouseLeave={e=>e.currentTarget.style.transform="translateX(-50%) scale(1)"}
        ><span style={{fontSize:18}}>+</span> 할 일 추가</button>
      )}

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:"white",borderRadius:"24px 24px 0 0",padding:"10px 12px 18px",display:"flex",justifyContent:"space-around",boxShadow:"0 -4px 20px rgba(108,99,255,.08)",zIndex:99}}>
        {[
          {key:"home",label:"홈",icon:NavIcons.home},
          {key:"cal",label:"캘린더",icon:NavIcons.calendar},
          {key:"timeline",label:"타임라인",icon:NavIcons.timeline},
          {key:"family",label:"가족",icon:NavIcons.family},
        ].map(n=>{
          const active=navTab===n.key;
          return(
            <button key={n.key} onClick={()=>{setNavTab(n.key);setShowCoupon(false);setShowCouponManage(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,border:"none",background:"transparent",cursor:"pointer",padding:"4px 12px",borderRadius:12}}>
              {n.icon(active)}
              <span style={{fontSize:11,fontWeight:active?800:600,color:active?C.primary:C.textLight,fontFamily:"'Nunito',sans-serif"}}>{n.label}</span>
              {active&&<div style={{width:4,height:4,borderRadius:"50%",background:C.primary,animation:"pop .3s ease"}}/>}
            </button>
          );
        })}
      </div>

      {showModal&&<AddTaskModal onClose={()=>setShowModal(false)} onAdd={addTodo} kidName={kidName}/>}
      {editingTodo&&<EditTaskModal item={editingTodo} onClose={()=>setEditingTodo(null)} onSave={editTodo} kidName={kidName}/>}
    </div>
  );
}
