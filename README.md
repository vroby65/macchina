# Dov'è la mia macchina?

PWA mobile-first in italiano per anziani, con testo grande, due pulsanti principali e istruzioni secondarie richiudibili. Senza account e senza backend applicativo.

**Apri l'app: https://vroby65.github.io/macchina/**

![QR code per aprire l'app](qr-code.png)

## Uso

1. Nel luogo del parcheggio tocca **Ho parcheggiato**, consenti la posizione e attendi la conferma. Coordinate, precisione e ora sono salvate in localStorage. Un nuovo salvataggio sostituisce il precedente solo se riesce.
2. Tocca **Trova la mia macchina**: Google Maps apre le indicazioni a piedi verso il parcheggio. Se disponibile, usa l'app Google Maps; altrimenti il browser. Maps sceglie l'origine corrente e può richiedere il relativo permesso.

Il GPS può essere impreciso, soprattutto al chiuso e nei parcheggi multipiano. Non identifica il piano. L'interfaccia avvisa oltre 100 metri di incertezza; puoi ripetere il salvataggio all'aperto.

## Installazione Android e iPhone

Tocca **Installa** nell’app: apre la richiesta nativa su Android quando disponibile; altrimenti apre una finestra con tre passaggi grandi per il telefono rilevato. Su Android è presente anche “Apri in Chrome”. Quando l’app è già aperta dalla Home, il pulsante non compare. Su iPhone l’aggiunta alla Home va confermata in Safari.

- **Android / Chrome:** menu ⋮ → Aggiungi a schermata Home / Installa app.
- **iPhone / Safari:** Condividi → Aggiungi alla schermata Home → se presente, attiva Apri come app web → Aggiungi.
- Apri l'app dalla nuova icona e salva il parcheggio da lì: il browser e l'app installata possono avere spazi di memorizzazione separati.

Il GPS richiede HTTPS e il consenso dell'utente. Se negato, riabilita Localizzazione per browser e sito nelle impostazioni del telefono. I testi indicano anche GPS assente, posizione non disponibile, timeout, dati corrotti e memoria non scrivibile.

## Offline e privacy

Dopo una prima visita online attendi “App pronta anche offline”. Il service worker memorizza soltanto la shell dell'app e consente riapertura e salvataggio offline, se il dispositivo riesce a ottenere la posizione. Google Maps può richiedere rete per il percorso. Non vengono memorizzate mappe. Il browser può eliminare cache e dati; non considerare il salvataggio un backup.

Le coordinate non vengono inviate a un backend. Solo l'apertura volontaria del percorso invia a Google la destinazione. GitHub Pages riceve i normali dati delle richieste HTTP, incluso l'IP. Nessun analytics, font remoto o libreria remota. localStorage appartiene all'origine `vroby65.github.io` e non è isolato dagli altri siti sotto lo stesso dominio. Cancella i dati del sito nelle impostazioni del browser per eliminare il parcheggio (questo può rimuovere anche dati di altri siti della stessa origine). La navigazione privata può non conservarlo.

## Invita

Tocca **Invita** per mostrare il QR code. **Condividi link** apre la condivisione del telefono; se non disponibile, il link viene copiato. Se anche la copia è bloccata, appare un campo selezionabile per copiarlo a mano. Il QR funziona anche offline dopo il primo caricamento. Si condivide soltanto l'URL pubblico dell'app, mai il parcheggio salvato.

## Corso del 10 novembre 2026

Proiettare o stampare `qr-code.png`. Il QR contiene soltanto l'URL pubblico dell'app e non scade.

1. Inquadrare il QR e aprire il sito nel browser.
2. Installare l'app seguendo le istruzioni sopra.
3. Aprirla dall'icona, salvare il parcheggio all'aperto e controllare la conferma e la precisione.
4. Chiudere e riaprire: il parcheggio deve esserci ancora.
5. Toccare Trova la mia macchina e controllare il percorso a piedi.
6. Tornare all'app e provare un nuovo salvataggio: sostituisce il primo.

Prima del corso eseguire la stessa prova su un Android e un iPhone reali, inclusi permessi negati e riapertura in modalità aereo dopo il caricamento iniziale. Il GPS reale e l'installazione sui telefoni richiedono intervento sul dispositivo; i test automatici usano coordinate simulate.

## Sviluppo e verifiche

Nessuna compilazione o dipendenza di produzione. Node.js 24 per i test:

```sh
npm test
python3 -m http.server 8000
```

Aprire http://localhost:8000 per la prova locale. Da un telefono usare l'URL HTTPS pubblico. I test controllano GPS su richiesta, salvataggio/sostituzione/riapertura, URL Maps pedonale, errori GPS e memoria, validazione dati, manifest e cache offline. GitHub Actions ripete i test su push e pull request.

## Pubblicazione

GitHub Pages pubblica `main` dalla cartella `/` del repository pubblico. Impostazione in Settings → Pages → Deploy from a branch. Nessuna chiave API necessaria. I percorsi relativi supportano il sottopercorso `/macchina/`.

Quando cambia la shell, incrementare `CACHE` in `sw.js`. La nuova versione si attiva subito; la pagina si ricarica quando cambia il worker, salvo un salvataggio GPS in corso. La navigazione online usa HTML aggiornato; offline usa la shell salvata. Incrementare anche il parametro versione di app.js/style.css in index.html e SHELL quando cambiano i relativi file. La cache del parcheggio rimane indipendente dalla cache dell'app.

## Licenza

GPL-3.0-only. Il testo integrale si trova in `LICENSE`. Icone e codice inclusi sono distribuiti con la stessa licenza.

Riferimenti: [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [installazione iPhone](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).
