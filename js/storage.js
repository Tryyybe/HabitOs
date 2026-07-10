/*
  File: js/storage.js
  Phase: 8 — File Modularization
  Last Updated: 2026-07-09
  Description: localStorage load, save, default state, constants, and shared helpers.
               Must be loaded FIRST — all other JS files depend on S, save(), isDone(), parseMin().
*/

const DAYS      = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TODAY     = new Date();
const todayKey  = TODAY.toISOString().slice(0,10);
const todayDayIdx = TODAY.getDay();

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "The secret of your future is hidden in your daily routine.",
  "Small disciplines repeated daily lead to great achievements.",
  "Win the morning, win the day.",
  "Your habits will determine your future.",
  "Every action you take is a vote for who you wish to become.",
  "Success is the sum of small efforts repeated day in and day out.",
  "You don't rise to your goals — you fall to your systems.",
  "Motivation gets you started. Habit keeps you going.",
  "Champions are built in the moments no one is watching.",
  "The pain of discipline weighs ounces. The pain of regret weighs tons.",
  "Do something today your future self will thank you for.",
];

function defaultState() {
  return {
    days: [[],[],[],[],[],[],[]],
    completions: {},
    wDismissed: null,
    notifGranted: false,
  };
}

function load() {
  try { return JSON.parse(localStorage.getItem('habitos_v4')) || defaultState(); }
  catch { return defaultState(); }
}

let S = load();

const save = () => {
  try { localStorage.setItem('habitos_v4', JSON.stringify(S)); }
  catch(e) { console.error('HabitOS: save failed', e); }
};

const dk   = d => new Date(d).toISOString().slice(0,10);
const addD = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const isDone = (rid, day) => !!S.completions[`${rid}_${day}`];
const todayRoutines = () => S.days[todayDayIdx] || [];

function toggle(rid) {
  const k = `${rid}_${todayKey}`;
  if (S.completions[k]) delete S.completions[k]; else S.completions[k] = true;
  save(); render(); checkAllDone();
}

function parseMin(t) {
  if (!t) return 0;
  const parts = t.trim().split(' ');
  const per = parts[1] ? parts[1].toUpperCase() : 'AM';
  let [h,m] = parts[0].split(':').map(Number);
  if (isNaN(m)) m=0;
  if (per==='PM' && h!==12) h+=12;
  if (per==='AM' && h===12) h=0;
  return h*60+m;
}
