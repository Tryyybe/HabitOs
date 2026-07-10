/*
  File: js/notifications.js
  Phase: 8 — File Modularization
  Last Updated: 2026-07-09
  Description: Browser push notification permission request and routine reminder scheduling.
               Depends on: js/storage.js (S, save, parseMin, todayDayIdx).
               Calls: showToast(), renderSettings() from js/app.js.
*/

function reqNotif() {
  if (!('Notification' in window)) { showToast('Notifications not supported on this browser.'); return; }
  Notification.requestPermission().then(p => {
    if (p==='granted') {
      S.notifGranted=true; save();
      showToast('Notifications enabled! ✓');
      renderSettings(); scheduleNotifs();
    } else { showToast('Permission denied. Enable in your browser settings.'); }
  });
}

function scheduleNotifs() {
  if (!S.notifGranted || Notification.permission!=='granted') return;
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const rts=S.days[todayDayIdx]||[];
  rts.forEach(r => {
    const rm=parseMin(r.time), diffMs=(rm-nowM)*60*1000;
    if (diffMs>0 && diffMs<12*60*60*1000) {
      const alert5=diffMs-(5*60*1000);
      if (alert5>0) setTimeout(()=>new Notification(`⏰ ${r.name} in 5 mins`,{body:`${r.emoji} Get ready for ${r.name} at ${r.time}`}),alert5);
      setTimeout(()=>new Notification(`🔔 Time for ${r.name}`,{body:`${r.emoji} It's ${r.time} — start your ${r.name} routine!`}),diffMs);
    }
  });
}
