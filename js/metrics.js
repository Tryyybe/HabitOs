/*
  File: js/metrics.js
  Phase: 8 — File Modularization
  Last Updated: 2026-07-09
  Description: Streak calculation, XP/level system, grade helpers, and weekly/monthly metrics.
               Depends on: js/storage.js (S, isDone, addD, dk, todayKey, todayDayIdx, todayRoutines).
*/

function streak(rid) {
  let s=0, d=new Date(TODAY);
  for (let i=0;i<366;i++) {
    const day=dk(d), dIdx=d.getDay();
    const dayRt=S.days[dIdx]||[];
    const r=dayRt.find(x=>x.id===rid);
    if (!r){d=addD(d,-1);continue;}
    if (day===todayKey && !isDone(rid,day)){d=addD(d,-1);continue;}
    if (!isDone(rid,day)) break;
    s++; d=addD(d,-1);
  }
  return s;
}

function bestStreak() {
  let best=0;
  S.days.forEach(dayRts => dayRts.forEach(r => { const s=streak(r.id); if(s>best) best=s; }));
  return best;
}

function getMetrics() {
  const rts=todayRoutines(), total=rts.length;
  const done=rts.filter(r=>isDone(r.id,todayKey)).length;
  const todayPct=total?Math.round(done/total*100):0;
  let wT=0,wD=0;
  for (let i=0;i<7;i++) {
    const d=addD(TODAY,-i),dIdx=d.getDay(),day=dk(d);
    (S.days[dIdx]||[]).forEach(r=>{wT++;if(isDone(r.id,day))wD++;});
  }
  const weekPct=wT?Math.round(wD/wT*100):0;
  const xp=Object.keys(S.completions).length*10;
  const level=xp>=5000?'Legendary 🏆':xp>=2000?'Elite ⚡':xp>=500?'Pro 💎':xp>=100?'Rising 🌱':'Beginner';
  return {total,done,todayPct,weekPct,xp,level,streak:bestStreak()};
}

function getGrade(pct) {
  return pct>=90?'A':pct>=75?'B':pct>=60?'C':pct>=40?'D':'F';
}

const GRADE_COLORS = {A:'#2D7A4F',B:'#1A56A0',C:'#B85C00',D:'#6B3FA0',F:'#C0392B'};
const GRADE_LABELS = {A:'Legendary performance',B:'Strong consistency',C:'Building momentum',D:'Needs more effort',F:'Start fresh tomorrow'};
