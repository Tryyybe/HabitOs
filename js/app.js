/*
  File: js/app.js
  Phase: 8 — File Modularization
  Last Updated: 2026-07-09
  Description: Main app logic — all render functions, view switching, modal, settings,
               confetti, toast, and init. Loaded last.
               Depends on: js/storage.js, js/metrics.js, js/notifications.js.
*/

function renderHeader() {
  const h=TODAY.getHours();
  document.getElementById('hPart').textContent=h<12?'morning':h<17?'afternoon':'evening';
  document.getElementById('hDate').textContent=TODAY.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const m=getMetrics();
  document.getElementById('hSub').textContent=
    m.total===0?'Add routines for today in Settings.':
    m.done===m.total?'All routines done. Legend. 🔥':
    `${m.total-m.done} routine${m.total-m.done!==1?'s':''} remaining.`;
  document.getElementById('dayPillDot').textContent=DAYS[todayDayIdx][0];
  document.getElementById('dayPillText').textContent=`${DAYS_FULL[todayDayIdx]}'s Routines`;
}

function renderQuote() {
  document.getElementById('qText').textContent=QUOTES[TODAY.getDate()%QUOTES.length];
}

function renderNext() {
  const nowM=TODAY.getHours()*60+TODAY.getMinutes();
  const rts=todayRoutines();
  let next=null,diff=Infinity;
  rts.forEach(r=>{const rm=parseMin(r.time),d=rm-nowM;if(d>0&&d<diff){diff=d;next=r;}});
  if(next){
    document.getElementById('nextName').textContent=`${next.emoji} ${next.name}`;
    const hh=Math.floor(diff/60),mm=diff%60;
    document.getElementById('nextVal').textContent=hh>0?`${hh}h ${mm}m`:`${mm}m`;
  } else {
    document.getElementById('nextName').textContent='No more routines today';
    document.getElementById('nextVal').textContent='—';
  }
}

function renderMetrics() {
  const m=getMetrics(),circ=2*Math.PI*20;
  document.getElementById('mStreak').innerHTML=`${m.streak} <span class="met-u">🔥</span>`;
  document.getElementById('mPct').textContent=m.todayPct+'%';
  document.getElementById('mSub').textContent=`${m.done}/${m.total}`;
  document.getElementById('mWeek').textContent=m.weekPct+'%';
  document.getElementById('mXP').textContent=m.xp;
  document.getElementById('mLevel').textContent=m.level;
  document.getElementById('secCnt').textContent=`${m.done}/${m.total} done`;
  document.getElementById('todayRing').style.strokeDashoffset=circ-(m.todayPct/100)*circ;
}

function renderHabits() {
  const list=document.getElementById('hlist'),rts=todayRoutines();
  if(!rts.length){
    list.innerHTML=`<div class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-h">No routines for ${DAYS_FULL[todayDayIdx]}</div>
      <div class="empty-s">Go to Settings and add your ${DAYS_FULL[todayDayIdx]} routines.<br>Each day can have its own unique schedule.</div>
      <button class="btn-goto-settings" onclick="sw('settings',document.querySelectorAll('.nb')[3])">Go to Settings →</button>
    </div>`;
    return;
  }
  list.innerHTML=rts.map(r=>{
    const done=isDone(r.id,todayKey),st=streak(r.id);
    return `<div class="hcard${done?' done':''}" onclick="toggle('${r.id}')">
      <div class="hcheck">${done?'✓':''}</div>
      <div class="hbody">
        <div class="htime">${r.time}</div>
        <div class="hname">${r.name}</div>
        ${st>0?`<div class="hstreak">🔥 ${st}d streak</div>`:''}
      </div>
      <div class="hemoji">${r.emoji}</div>
    </div>`;
  }).join('');
}

let fired=false;
function checkAllDone(){
  const m=getMetrics(),all=m.total>0&&m.done===m.total;
  document.getElementById('allDone').classList.toggle('show',all);
  if(all&&!fired){fireConfetti();fired=true;}
  if(!all) fired=false;
}

function renderWeekly(){
  const isSun=TODAY.getDay()===0,dis=S.wDismissed===todayKey;
  if(!isSun||dis){document.getElementById('weeklyCard').classList.remove('show');return;}
  let wT=0,wD=0;
  for(let i=0;i<7;i++){const d=addD(TODAY,-i),dIdx=d.getDay(),day=dk(d);(S.days[dIdx]||[]).forEach(r=>{wT++;if(isDone(r.id,day))wD++;});}
  const pct=wT?Math.round(wD/wT*100):0;
  const grade=pct>=90?'A 🌟':pct>=75?'B 💎':pct>=60?'C 🌱':pct>=40?'D ⚡':'F 🔥';
  const gc={A:'#2D7A4F',B:'#1A56A0',C:'#B85C00',D:'#6B3FA0',F:'#C0392B'};
  document.getElementById('wGrade').textContent=grade;
  document.getElementById('wGrade').style.color=gc[grade[0]];
  document.getElementById('wDone').textContent=wD;
  document.getElementById('wMiss').textContent=wT-wD;
  document.getElementById('wPct').textContent=pct+'%';
  document.getElementById('weeklyCard').classList.add('show');
}
function closeWeekly(){S.wDismissed=todayKey;save();document.getElementById('weeklyCard').classList.remove('show');}

function renderActivity(){
  const yr=TODAY.getFullYear(),mo=TODAY.getMonth();
  const first=new Date(yr,mo,1),last=new Date(yr,mo+1,0);
  const offset=(first.getDay()+6)%7,total=last.getDate();
  const cells=Math.ceil((offset+total)/7)*7;
  document.getElementById('actMonth').textContent=TODAY.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const DLBLS=['M','T','W','T','F','S','S'];
  let html=DLBLS.map(l=>`<div class="hmap-lbl">${l}</div>`).join('');
  for(let i=0;i<cells;i++){
    const day=i-offset+1;
    if(day<1||day>total){html+=`<div style="opacity:0;aspect-ratio:1"></div>`;continue;}
    const d=new Date(yr,mo,day),dkey=dk(d),isT=dkey===todayKey,dIdx=d.getDay();
    const dayRts=S.days[dIdx]||[];
    const done=dayRts.filter(r=>isDone(r.id,dkey)).length,tot=dayRts.length;
    let lv=0;if(tot&&done){const p=done/tot;lv=p>=.75?4:p>=.5?3:p>=.25?2:1;}
    html+=`<div class="hmap-cell${isT?' htoday':''}" data-l="${lv}" title="${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${done}/${tot}"></div>`;
  }
  document.getElementById('hmapGrid').innerHTML=html;
  const allRts=[];
  S.days.forEach(dayRts=>dayRts.forEach(r=>{if(!allRts.find(x=>x.id===r.id))allRts.push(r);}));
  const tDays=last.getDate();
  document.getElementById('prList').innerHTML=allRts.length?allRts.map(r=>{
    const done=Object.keys(S.completions).filter(k=>k.startsWith(r.id+'_')).length;
    const pct=tDays?Math.min(100,Math.round(done/tDays*100)):0;
    return `<div class="pr-card"><div class="pr-top"><div class="pr-name">${r.emoji} ${r.name}</div><div class="pr-pct">${pct}%</div></div><div class="pr-bar"><div class="pr-fill" style="width:${pct}%"></div></div></div>`;
  }).join(''):`<div style="text-align:center;padding:32px;color:var(--ink3);font-size:14px">No routines added yet.</div>`;
}

function renderSummary(){
  const yr=TODAY.getFullYear(),mo=TODAY.getMonth();
  const tDays=new Date(yr,mo+1,0).getDate();
  document.getElementById('sumEy').textContent=TODAY.toLocaleDateString('en-US',{month:'long',year:'numeric'}).toUpperCase();
  let done=0,active=0;
  for(let d=1;d<=tDays;d++){
    const dkey=dk(new Date(yr,mo,d)),dIdx=new Date(yr,mo,d).getDay();
    const dayDone=(S.days[dIdx]||[]).filter(r=>isDone(r.id,dkey)).length;
    if(dayDone>0) active++; done+=dayDone;
  }
  const allRts=[];
  S.days.forEach(dayRts=>dayRts.forEach(r=>{if(!allRts.find(x=>x.id===r.id))allRts.push(r);}));
  const pct=allRts.length*tDays?Math.round(done/(allRts.length*tDays)*100):0;
  const grade=getGrade(pct);
  document.getElementById('sumDone').textContent=done;
  document.getElementById('sumStreak').textContent=bestStreak();
  document.getElementById('sumDays').textContent=active;
  document.getElementById('sgBig').textContent=grade;
  document.getElementById('sgBig').style.color=GRADE_COLORS[grade];
  document.getElementById('sgSub').textContent=GRADE_LABELS[grade];
  const rData=[
    {lbl:'Completion',val:pct,col:'#B8952A',disp:pct+'%'},
    {lbl:'Active Days',val:Math.round(active/tDays*100),col:'#1A56A0',disp:active+'d'},
    {lbl:'Best Streak',val:Math.min(100,Math.round(bestStreak()/30*100)),col:'#B85C00',disp:bestStreak()+'🔥'},
  ];
  document.getElementById('sumRings').innerHTML=rData.map(rd=>{
    const c=2*Math.PI*32,off=c-(rd.val/100)*c;
    return `<div class="sum-ring"><svg viewBox="0 0 76 76">
      <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="7"/>
      <circle cx="38" cy="38" r="32" fill="none" stroke="${rd.col}" stroke-width="7"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        stroke-linecap="round" transform="rotate(-90 38 38)"/>
      <text x="38" y="43" text-anchor="middle" fill="#1A1A18" font-size="10" font-weight="800" font-family="Inter,sans-serif">${rd.disp}</text>
    </svg><div class="sum-ring-lbl">${rd.lbl}</div></div>`;
  }).join('');
}

let activeDayTab=todayDayIdx;
function renderDayTabs(){
  document.getElementById('dayTabs').innerHTML=DAYS.map((d,i)=>
    `<button class="day-tab${i===activeDayTab?' active':''}" onclick="selectDayTab(${i})">${d}</button>`
  ).join('');
  renderSettingsList();
}
function selectDayTab(idx){activeDayTab=idx;renderDayTabs();}
function renderSettingsList(){
  const day=DAYS_FULL[activeDayTab];
  document.getElementById('settDayLabel').textContent=`${day}'s routines`;
  document.getElementById('addBtnDay').textContent=day;
  const rts=S.days[activeDayTab]||[];
  document.getElementById('settList').innerHTML=rts.length?rts.map(r=>`
    <div class="sett-item">
      <div class="sett-emoji">${r.emoji}</div>
      <div class="sett-info"><div class="sett-name">${r.name}</div><div class="sett-time">${r.time}</div></div>
      <div class="sett-btns">
        <button class="btn-edit" onclick="editR('${r.id}')">Edit</button>
        <button class="btn-del" onclick="delR('${r.id}')">✕</button>
      </div>
    </div>`).join(''):`<div style="text-align:center;padding:24px;color:var(--ink3);font-size:13px">No routines for ${day} yet.</div>`;
}
function renderSettings(){
  if(S.notifGranted){
    document.getElementById('notifSub').textContent='Notifications enabled ✓';
    const btn=document.getElementById('notifBtn');
    btn.textContent='✓ On';btn.style.background='var(--green)';
  }
  renderDayTabs();
}

let editId=null;
function openModal(id=null){
  editId=id;
  if(id){
    const r=(S.days[activeDayTab]||[]).find(x=>x.id===id);
    document.getElementById('mTitle').textContent='Edit Routine';
    document.getElementById('iTime').value=r.time;
    document.getElementById('iName').value=r.name;
    document.getElementById('iEmoji').value=r.emoji;
  } else {
    document.getElementById('mTitle').textContent=`Add Routine — ${DAYS_FULL[activeDayTab]}`;
    document.getElementById('iTime').value='';
    document.getElementById('iName').value='';
    document.getElementById('iEmoji').value='';
  }
  document.getElementById('mOv').classList.add('open');
  setTimeout(()=>document.getElementById('iTime').focus(),350);
}
function closeModal(){document.getElementById('mOv').classList.remove('open');editId=null;}
function saveRoutine(){
  const time=document.getElementById('iTime').value.trim();
  const name=document.getElementById('iName').value.trim();
  const emoji=document.getElementById('iEmoji').value.trim()||'○';
  if(!time||!name){showToast('Fill in time and name.');return;}
  if(!S.days[activeDayTab]) S.days[activeDayTab]=[];
  if(editId){
    const r=S.days[activeDayTab].find(x=>x.id===editId);
    if(r){r.time=time;r.name=name;r.emoji=emoji;}
    showToast('Routine updated. ✓');
  } else {
    S.days[activeDayTab].push({id:'r'+Date.now(),time,name,emoji});
    showToast('Routine added! ✓');
  }
  save();closeModal();renderSettingsList();render();
}
function editR(id){openModal(id);}
function delR(id){
  if(!confirm('Remove this routine?'))return;
  S.days[activeDayTab]=(S.days[activeDayTab]||[]).filter(r=>r.id!==id);
  save();renderSettingsList();render();
}
function resetAll(){
  if(!confirm('Reset ALL data? Cannot be undone.'))return;
  S=defaultState();save();render();renderSettings();showToast('Data reset.');
}
function exportCard(){showToast('📸 Screenshot this screen to save your card!');}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2600);
}

function sw(name,btn){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('v-'+name).classList.add('active');
  btn.classList.add('active');
  if(name==='activity') renderActivity();
  if(name==='summary')  renderSummary();
  if(name==='settings') renderSettings();
}

function fireConfetti(){
  const cv=document.getElementById('confetti'),ctx=cv.getContext('2d');
  cv.width=window.innerWidth;cv.height=window.innerHeight;
  const cols=['#B8952A','#D4AE45','#E8C96A','#2D7A4F','#1A56A0','#6B3FA0','#B85C00','#F7F4EF'];
  const ps=Array.from({length:150},()=>({
    x:Math.random()*cv.width,y:-12,w:Math.random()*9+3,h:Math.random()*14+6,
    col:cols[Math.floor(Math.random()*cols.length)],r:Math.random()*Math.PI*2,
    vx:(Math.random()-.5)*5,vy:Math.random()*4+2,vr:(Math.random()-.5)*.15,
  }));
  let f=0;
  (function draw(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.col;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;p.vy+=0.08;});
    if(++f<200) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,cv.width,cv.height);
  })();
}

function render(){
  renderHeader();renderQuote();renderMetrics();
  renderHabits();renderNext();renderWeekly();checkAllDone();
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeModal();
  if(e.key==='Enter'&&document.getElementById('mOv').classList.contains('open')) saveRoutine();
});
document.getElementById('mOv').addEventListener('click',e=>{
  if(e.target===document.getElementById('mOv')) closeModal();
});

render();
if(S.notifGranted&&Notification.permission==='granted') scheduleNotifs();
setInterval(renderNext,60000);
