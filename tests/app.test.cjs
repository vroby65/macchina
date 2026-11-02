const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const saved = {latitude:45.4,longitude:9.2,accuracy:12,timestamp:1793630000000};
function app({raw=null, readError=false, writeError=false, geo=true, secure=true, serviceWorker=null, userAgent="Android Chrome", standalone=false, share=null, clipboard=null}={}) {
 const elements = {};
 for (const id of ['park','find','message','position','details','offline','cache-status','install','install-guide','install-now','install-close','android-install','ios-install','invite','invite-guide','invite-share','invite-close','invite-status','invite-link-box','invite-link']) elements[id] = {textContent:'',open:false,focus(){this.focused=true},select(){this.selected=true},showModal(){this.open=true},close(){this.open=false},attrs:{},listeners:{},classList:{toggle(){}},querySelector(){return {focus(){}}},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]; delete this[k]},addEventListener(k,f){this.listeners[k]=f}};
 let value=raw, request, calls=0; const windowListeners={};
 const navigator={onLine:true,userAgent}; let reloads=0;
 if(serviceWorker) navigator.serviceWorker=serviceWorker;
 if(share) navigator.share=share;
 if(clipboard) navigator.clipboard=clipboard;
 if(geo) navigator.geolocation={getCurrentPosition(ok,fail,options){request={ok,fail,options}; calls++}};
 vm.runInNewContext(source,{document:{querySelector:s=>elements[s.slice(1)]},navigator,window:{matchMedia(){return {matches:standalone}},location:{reload(){reloads++}},isSecureContext:secure,addEventListener(k,f){windowListeners[k]=f}},localStorage:{getItem(){if(readError)throw Error();return value},setItem(k,v){if(writeError)throw Error();value=v}},URL,Date,console});
 return {elements,windowListeners,get reloads(){return reloads},click(){elements.park.listeners.click()},get request(){return request},get calls(){return calls},get value(){return value},success(p=saved){request.ok({coords:p,timestamp:p.timestamp})}};
}
test('nessun GPS all’avvio; trova senza parcheggio non naviga',()=>{const a=app();assert.equal(a.calls,0);let prevented=false;a.elements.find.listeners.click({preventDefault(){prevented=true}});assert.equal(prevented,true);assert.equal(a.elements.find.attrs['aria-disabled'],'true')});
test('salva coordinate e apre percorso pedonale Google Maps',()=>{const a=app();a.click();assert.equal(a.elements.park.disabled,true);assert.equal(a.request.options.maximumAge,0);assert.equal(a.request.options.enableHighAccuracy,true);a.success();assert.deepEqual(JSON.parse(a.value),saved);const u=new URL(a.elements.find.href);assert.equal(u.origin,'https://www.google.com');assert.equal(u.searchParams.get('destination'),'45.4,9.2');assert.equal(u.searchParams.get('travelmode'),'walking');assert.equal(u.searchParams.get('dir_action'),'navigate');assert.equal(a.elements.park.disabled,false)});
test('sostituisce il parcheggio e lo ripristina alla riapertura',()=>{const a=app({raw:JSON.stringify(saved)});a.click();a.success({...saved,latitude:46});const b=app({raw:a.value});assert.match(b.elements.find.href,/46%2C9.2/);assert.equal(b.calls,0)});
for(const code of [1,2,3,99])test('errore GPS '+code+' conserva il parcheggio',()=>{const a=app({raw:JSON.stringify(saved)});a.click();a.request.fail({code});assert.deepEqual(JSON.parse(a.value),saved);assert.equal(a.elements.park.disabled,false);assert.ok(a.elements.message.textContent.length>10)});
test('errore scrittura conserva dati e destinazione precedente',()=>{const a=app({raw:JSON.stringify(saved),writeError:true});const before=a.elements.find.href;a.click();a.success({...saved,latitude:46});assert.deepEqual(JSON.parse(a.value),saved);assert.equal(a.elements.find.href,before);assert.match(a.elements.message.textContent,/Non riesco a salvare/)});
for(const raw of ['{bad','{}',JSON.stringify({...saved,latitude:91}),JSON.stringify({...saved,timestamp:1e30})])test('dati corrotti non diventano destinazioni: '+raw,()=>{const a=app({raw});assert.equal(a.elements.find.href,undefined);assert.equal(a.elements.find.attrs['aria-disabled'],'true')});
test('memoria non accessibile non blocca interfaccia',()=>{const a=app({readError:true});assert.match(a.elements.message.textContent,/Memoria locale/)});
test('bassa precisione produce avviso',()=>{const a=app();a.click();a.success({...saved,accuracy:300});assert.match(a.elements.message.textContent,/poco preciso/)});
test('coordinate GPS invalide non sostituiscono dati',()=>{const a=app({raw:JSON.stringify(saved)});a.click();a.success({...saved,longitude:181});assert.deepEqual(JSON.parse(a.value),saved);assert.equal(a.elements.park.disabled,false)});
for(const options of [{geo:false},{secure:false}])test('assenza GPS o HTTPS gestita',()=>{const a=app(options);a.click();assert.equal(a.calls,0);assert.ok(a.elements.message.textContent)});
test('manifest e shell offline includono risorse esistenti e percorsi relativi',()=>{const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest')));assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');for(const i of manifest.icons)assert.ok(fs.existsSync(path.join(root,i.src)));let shell;vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+'; result(SHELL)',{self:{addEventListener(){}},result(v){shell=v}});for(const f of shell)assert.ok(fs.existsSync(path.join(root,f.split('?')[0])))});
test('worker usa solo cache applicativa e non intercetta Google',async()=>{const listeners={};vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self:{location:{origin:'https://example.org',href:'https://example.org/macchina/sw.js'},addEventListener(k,f){listeners[k]=f}},URL});for(const url of ['https://www.google.com/maps/dir/','https://example.org/altro/']){listeners.fetch({request:{url,method:'GET'},respondWith(){assert.fail('richiesta fuori scope')}})}});
test('worker installa tutta la shell e la restituisce senza rete',async()=>{
 const listeners={}, entries=new Map();let claimed=false;
 class ShellRequest { constructor(url,options){this.url=new URL(url,'https://example.org/macchina/').href;this.cache=options.cache} }
 const cache={async addAll(files){for(const file of files){assert.equal(file.cache,'reload');entries.set(file.url,'cached:'+file.url)}},async match(req){return entries.get(typeof req==='string'?new URL(req,'https://example.org/macchina/').href:req.url)}};
 const removed=[];
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self:{location:{origin:'https://example.org',href:'https://example.org/macchina/sw.js'},async skipWaiting(){},clients:{async claim(){claimed=true}},addEventListener(k,f){listeners[k]=f}},URL,Request:ShellRequest,caches:{async open(){return cache},async keys(){return ['macchina-shell-v0','unrelated-cache','macchina-shell-v8']},async delete(k){removed.push(k)}},async fetch(){throw Error('offline')}});
 let pending;listeners.install({waitUntil(p){pending=p}});await pending;assert.ok(entries.size>=9);
 listeners.activate({waitUntil(p){pending=p}});await pending;assert.deepEqual(removed,['macchina-shell-v0']);assert.equal(claimed,true);
 for(const [file,mode] of [['app.js?v=8','cors'],['','navigate'],['unknown','navigate']]){listeners.fetch({request:{url:'https://example.org/macchina/'+file,method:'GET',mode},respondWith(p){pending=p}});assert.match(await pending,/cached:/)}
});

test('installazione senza prompt apre istruzioni per iPhone e Android',async()=>{const a=app();await a.elements.install.listeners.click();assert.equal(a.elements['install-guide'].open,true)});
test('Android apre richiesta nativa solo al clic e gestisce annullamento',async()=>{const a=app();let prompted=0,prevented=0;a.windowListeners.beforeinstallprompt({preventDefault(){prevented++},async prompt(){prompted++},userChoice:Promise.resolve({outcome:'dismissed'})});assert.equal(prompted,0);assert.equal(prevented,1);await a.elements.install.listeners.click();assert.equal(prompted,1);assert.equal(a.elements['install-guide'].open,true)});
test('installazione completata nasconde il pulsante',()=>{const a=app();a.windowListeners.appinstalled();assert.equal(a.elements.install.hidden,true)});
test('aggiornamento attiva subito il worker e preferisce HTML online alla copia vecchia',async()=>{
 const listeners={};let skipped=false,pending;
 const cache={async addAll(){},async match(){return 'html-vecchio'}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self:{location:{origin:'https://example.org',href:'https://example.org/macchina/sw.js'},async skipWaiting(){skipped=true},addEventListener(k,f){listeners[k]=f}},URL,Request:class{},caches:{async open(){return cache}},async fetch(){return 'html-nuovo'}});
 listeners.install({waitUntil(p){pending=p}});await pending;assert.equal(skipped,true);
 listeners.fetch({request:{url:'https://example.org/macchina/',method:'GET',mode:'navigate'},respondWith(p){pending=p}});assert.equal(await pending,'html-nuovo');
});

for(const controlled of [false,true])test('cambio worker ricarica una volta solo una pagina già controllata: '+controlled,()=>{
 const listeners={};let options;
 const serviceWorker={controller:controlled?{}:null,ready:Promise.resolve(),addEventListener(k,f){listeners[k]=f},register(url,o){options=o;return Promise.resolve({async update(){}})}};
 const a=app({serviceWorker});assert.equal(options.updateViaCache,'none');listeners.controllerchange();listeners.controllerchange();assert.equal(a.reloads,controlled?1:0);
});
test('cambio worker non interrompe salvataggio GPS in corso',()=>{
 const listeners={};const serviceWorker={controller:{},ready:Promise.resolve(),addEventListener(k,f){listeners[k]=f},register(){return Promise.resolve({async update(){}})}};
 const a=app({serviceWorker});a.click();listeners.controllerchange();assert.equal(a.reloads,0);a.success();assert.deepEqual(JSON.parse(a.value),saved);
});

test('Android mostra solo i tre passaggi Android nella finestra',async()=>{const a=app();await a.elements.install.listeners.click();assert.equal(a.elements['install-guide'].open,true);assert.equal(a.elements['android-install'].hidden,false);assert.equal(a.elements['ios-install'].hidden,true);a.elements['install-close'].listeners.click();assert.equal(a.elements['install-guide'].open,false)});
test('iPhone mostra solo i passaggi iPhone',async()=>{const a=app({userAgent:'iPhone Safari'});await a.elements.install.listeners.click();assert.equal(a.elements['android-install'].hidden,true);assert.equal(a.elements['ios-install'].hidden,false)});
test('app già aperta dalla Home non propone installazione',()=>{assert.equal(app({standalone:true}).elements.install.hidden,true)});
test('prompt disponibile in ritardo abilita installazione dalla guida',async()=>{const a=app();await a.elements.install.listeners.click();let prompted=0;a.windowListeners.beforeinstallprompt({preventDefault(){},async prompt(){prompted++},userChoice:Promise.resolve({outcome:'accepted'})});assert.equal(a.elements['install-now'].hidden,false);await a.elements['install-now'].listeners.click();assert.equal(prompted,1);assert.equal(a.elements['install-guide'].open,false)});

test('Invita apre e chiude il QR senza condividere né chiedere GPS',()=>{let shares=0;const a=app({share:async()=>{shares++}});a.elements.invite.listeners.click();assert.equal(a.elements['invite-guide'].open,true);assert.equal(shares,0);assert.equal(a.calls,0);a.elements['invite-close'].listeners.click();assert.equal(a.elements['invite-guide'].open,false)});
test('condivisione contiene soltanto il link pubblico, mai il parcheggio',async()=>{let payload;const a=app({raw:JSON.stringify(saved),share:async data=>{payload=data}});await a.elements['invite-share'].listeners.click();assert.deepEqual(JSON.parse(JSON.stringify(payload)),{title:"Dov'è la mia macchina?",url:'https://vroby65.github.io/macchina/'});assert.deepEqual(JSON.parse(a.value),saved)});
test('senza condivisione nativa copia il link pubblico',async()=>{let copied;const a=app({clipboard:{async writeText(text){copied=text}}});assert.equal(a.elements['invite-share'].textContent,'Copia link');await a.elements['invite-share'].listeners.click();assert.equal(copied,'https://vroby65.github.io/macchina/');assert.equal(a.elements['invite-status'].textContent,'Link copiato!')});
test('annullare condivisione non copia né mostra errori',async()=>{let copies=0;const a=app({share:async()=>{throw {name:'AbortError'}},clipboard:{async writeText(){copies++}}});await a.elements['invite-share'].listeners.click();assert.equal(copies,0);assert.equal(a.elements['invite-status'].textContent,'');assert.equal(a.elements['invite-share'].disabled,false)});
test('clipboard negata mostra link selezionabile',async()=>{const a=app({clipboard:{async writeText(){throw Error('negato')}}});await a.elements['invite-share'].listeners.click();assert.equal(a.elements['invite-link-box'].hidden,false);assert.equal(a.elements['invite-link'].value,'https://vroby65.github.io/macchina/');assert.equal(a.elements['invite-link'].selected,true)});
test('errore condivisione passa alla copia del link',async()=>{let copied;const a=app({share:async()=>{throw Error('non disponibile')},clipboard:{async writeText(text){copied=text}}});await a.elements['invite-share'].listeners.click();assert.equal(copied,'https://vroby65.github.io/macchina/')});
test('QR incluso nella shell offline',()=>{let shell;vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8')+'; result(SHELL)',{self:{addEventListener(){}},result(v){shell=v}});assert.ok(shell.includes('./qr-code.png'))});
