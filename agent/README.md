# Manutenzione
PWA statica italiana per anziani, mobile-first, senza backend o dipendenze di produzione. Mantenere testi essenziali, caratteri grandi (almeno 22 px per i contenuti) e due pulsanti principali alti almeno 150 px. Dettagli tecnici e privacy restano richiudibili.
`index.html` e `style.css`: interfaccia; `app.js`: GPS, localStorage, Maps; `manifest.webmanifest` e `icons/`: installazione; `sw.js`: cache offline limitata a questo percorso.

Invarianti: un solo parcheggio in `macchina.parking.v1`, sostituito solo dopo salvataggio persistente riuscito. Il GPS parte solo al clic. Nessuna chiamata a Google prima dell'apertura del percorso. Non inviare coordinate a server o analytics. Gli errori non cancellano il parcheggio precedente.

Verifica: `npm test`. Per prova manuale: `python3 -m http.server 8000`, poi aprire localhost:8000. Su telefono usare HTTPS pubblico. Provare permesso concesso/negato, salvataggio e sostituzione, riapertura, percorso a piedi, installazione e riapertura offline dopo prima visita online.

Pubblicazione: GitHub Pages dal branch main, cartella root. `.github/workflows/test.yml` esegue test su push e pull request. Incrementare CACHE in `sw.js` quando cambiano le risorse della shell; chiudere le schede per attivare una versione in attesa. Usare percorsi relativi per /macchina/.
Aggiornare questa guida e README quando cambiano architettura, invarianti o comandi. Non aggiungere credenziali o coordinate personali al repository.
