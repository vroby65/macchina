/* SPDX-License-Identifier: GPL-3.0-only */
'use strict';
const KEY = 'macchina.parking.v1';
const park = document.querySelector('#park');
const find = document.querySelector('#find');
const message = document.querySelector('#message');
let parking = null;
function valid(p) {
  return p && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 &&
    Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180 &&
    Number.isFinite(p.accuracy) && p.accuracy >= 0 &&
    Number.isFinite(p.timestamp) && p.timestamp > 0 && !Number.isNaN(new Date(p.timestamp).getTime());
}
function say(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}
function render() {
  find.setAttribute('aria-disabled', String(!parking));
  if (!parking) { find.removeAttribute('href'); return; }
  find.href = 'https://www.google.com/maps/dir/?api=1&destination=' +
    encodeURIComponent(parking.latitude + ',' + parking.longitude) + '&travelmode=walking&dir_action=navigate';
  document.querySelector('#position').textContent = 'Salvato il ' + new Date(parking.timestamp).toLocaleString('it-IT', {day:'numeric', month:'long', hour:'2-digit', minute:'2-digit'});
  document.querySelector('#details').textContent = 'Precisione GPS: circa ' + Math.round(parking.accuracy) + ' m · ' + parking.latitude.toFixed(5) + ', ' + parking.longitude.toFixed(5);
}
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (valid(parsed)) parking = parsed;
    else say('Il parcheggio salvato non è leggibile. Salva una nuova posizione.', true);
  }
} catch {
  say('Memoria locale non disponibile o dati non leggibili. Consenti la memorizzazione dei dati del sito e riprova.', true);
}
render();
find.addEventListener('click', event => {
  if (!parking) { event.preventDefault(); say('Prima salva un parcheggio con “Ho parcheggiato”.'); }
});
park.addEventListener('click', () => {
  if (!window.isSecureContext) { say('Per usare il GPS apri questa pagina con HTTPS.', true); return; }
  if (!navigator.geolocation) { say('Questo browser non supporta il GPS. Prova Safari su iPhone o Chrome su Android.', true); return; }
  park.disabled = true;
  park.setAttribute('aria-busy', 'true');
  say('Attendi… Se richiesto, consenti la posizione.');
  function finish() { park.disabled = false; park.setAttribute('aria-busy', 'false'); }
  navigator.geolocation.getCurrentPosition(position => {
    const next = {latitude:position.coords.latitude, longitude:position.coords.longitude, accuracy:position.coords.accuracy, timestamp:position.timestamp};
    if (!valid(next)) { finish(); say('Il GPS ha restituito una posizione non valida. Riprova.', true); return; }
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { finish(); say('Non riesco a salvare sul telefono. Controlla lo spazio e le impostazioni dei dati del sito. Il parcheggio precedente resta invariato.', true); return; }
    parking = next;
    render();
    finish();
    say(next.accuracy > 100 ? 'Parcheggio salvato, ma il GPS è poco preciso. All’aperto puoi premere di nuovo “Ho parcheggiato” per migliorare la posizione.' : 'Parcheggio salvato!');
  }, error => {
    finish();
    const errors = {1:'Accesso alla posizione negato. Abilitalo nelle impostazioni del sito o del telefono, poi riprova.', 2:'Posizione non disponibile. Attiva la localizzazione e prova all’aperto.', 3:'La ricerca della posizione è scaduta. Spostati all’aperto e riprova.'};
    say(errors[error.code] || 'Non riesco a leggere la posizione. Riprova.', true);
  }, {enableHighAccuracy:true, timeout:20000, maximumAge:0});
});
function connection() { document.querySelector('#offline').hidden = navigator.onLine; }
window.addEventListener('online', connection);
window.addEventListener('offline', connection);
connection();
if ('serviceWorker' in navigator) {
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (wasControlled && !reloading && !park.disabled) {
      reloading = true;
      window.location.reload();
    }
  });
  navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(registration => {
    registration.update().catch(() => {});
    return navigator.serviceWorker.ready;
  }).then(() => {
    document.querySelector('#cache-status').textContent = 'App pronta anche offline. Il percorso richiede Google Maps.';
  }).catch(() => {
    document.querySelector('#cache-status').textContent = 'Modalità offline non disponibile. Riapri la pagina con Internet per riprovare.';
  });
}

let installPrompt = null;
const install = document.querySelector('#install');
const guide = document.querySelector('#install-guide');
const installNow = document.querySelector('#install-now');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
document.querySelector('#android-install').hidden = isIOS;
document.querySelector('#ios-install').hidden = !isIOS;
install.hidden = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function installGuide() {
  if (!guide.open) guide.showModal();
  document.querySelector('#install-close').focus();
}
document.querySelector('#install-close').addEventListener('click', () => guide.close());
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installNow.hidden = false;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  install.hidden = true;
  guide.close();
  say('App installata. Aprila dalla nuova icona.');
});
async function installApp() {
  if (!installPrompt) { installGuide(); return; }
  const prompt = installPrompt;
  installPrompt = null;
  installNow.hidden = true;
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') guide.close();
    else installGuide();
  } catch { installGuide(); }
}
install.addEventListener('click', installApp);
installNow.addEventListener('click', installApp);

const APP_URL = 'https://vroby65.github.io/macchina/';
const inviteGuide = document.querySelector('#invite-guide');
const inviteShare = document.querySelector('#invite-share');
const inviteStatus = document.querySelector('#invite-status');
const inviteLinkBox = document.querySelector('#invite-link-box');
if (!navigator.share) inviteShare.textContent = 'Copia link';
document.querySelector('#invite').addEventListener('click', () => {
  inviteStatus.textContent = '';
  inviteLinkBox.hidden = true;
  inviteGuide.showModal();
});
document.querySelector('#invite-close').addEventListener('click', () => inviteGuide.close());
inviteShare.addEventListener('click', async () => {
  inviteStatus.textContent = '';
  inviteShare.disabled = true;
  try {
    if (navigator.share) {
      try {
        await navigator.share({title: "Dov'è la mia macchina?", url: APP_URL});
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(APP_URL);
      inviteStatus.textContent = 'Link copiato!';
    } catch {
      inviteLinkBox.hidden = false;
      const link = document.querySelector('#invite-link');
      link.value = APP_URL;
      link.focus();
      link.select();
      inviteStatus.textContent = 'Tieni premuto il link e scegli Copia.';
    }
  } finally { inviteShare.disabled = false; }
});
