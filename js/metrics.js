/*
  File: js/metrics.js
  Phase: 8 — File Modularization
  Last Updated: 2026-07-10
  Description: Streak calculation, XP/level system, grade helpers, and weekly/monthly metrics.
               Fixed: heatmap today highlight offset bug. Fixed: per-routine duplicate names.
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

// FIX 1 — Correct today key using local date (not UTC) to avoid timezone offset bug
function getLocalDateKey(d) {
  const year  = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day   = String(d.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

// FIX 2 — Deduplicate per-routine list by routine NAME (not id)
// Aggregates completions across all days for routines sharing the same name
function getUniqueRoutinesWithProgress(totalDaysInMonth) {
  const seen   = {};
  const result = [];

  S.days.forEach(dayRts => {
    dayRts.forEach(r => {
      const key = r.name.trim().toLowerCase();
      if (!seen[key]) {
        seen[key] = { name: r.name, emoji: r.emoji, ids: [] };
        result.push(seen[key]);
      }
      // Collect all IDs for this routine name (across different days)
      if (!seen[key].ids.includes(r.id)) {
        seen[key].ids.push(r.id);
      }
    });
  });

  // Calculate aggregated completion % across all collected IDs
  return result.map(entry => {
    const done = entry.ids.reduce((sum, id) => {
      return sum + Object.keys(S.completions).filter(k => k.startsWith(id+'_')).length;
    }, 0);
    const pct = totalDaysInMonth
      ? Math.min(100, Math.round(done / totalDaysInMonth * 100))
      : 0;
    return { name: entry.name, emoji: entry.emoji, pct };
  });
}

const GRADE_COLORS = {A:'#2D7A4F',B:'#1A56A0',C:'#B85C00',D:'#6B3FA0',F:'#C0392B'};
const GRADE_LABELS = {A:'Legendary performance',B:'Strong consistency',C:'Building momentum',D:'Needs more effort',F:'Start fresh tomorrow'};
