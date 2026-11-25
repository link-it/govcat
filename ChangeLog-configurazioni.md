# ChangeLog delle configurazioni applicative

Raccoglie, versione per versione, le modifiche alle configurazioni applicative di GovCat che
contano quando si fa l'upgrade di un'installazione: chiavi nuove, rimosse o rinominate, default
cambiati, chiavi diventate obbligatorie o opzionali, modifiche di semantica.
Il dettaglio funzionale delle modifiche resta nel `ChangeLog`; qui c'è solo l'impatto sulle
configurazioni e cosa fare all'upgrade.

Le versioni precedenti alla 2.5.1 non sono censite.

## Configurazioni censite

| Configurazione | Componente | File esterno di installazione | Default nel progetto |
|---|---|---|---|
| Proprietà API | `govcat-api.war` | `/var/govcat/conf/govcat-api.properties` | `bo/servlets/govway-apicat-api/src/main/resources/govcat-api.properties` (placeholder risolti al build dai filter, vedi `src/main/plugin/filters/api.filter.properties`) |
| Proprietà stampe | `govcat-api.war` | `/var/govcat/conf/govcat-stampe.properties` | `bo/servlets/govway-apicat-api/src/main/resources/govcat-stampe.properties` |
| Proprietà batch | `govcat-batch.war` | `/var/govcat/conf/govcat-batch-configurazione.properties` | `bo/servlets/govCatConfigurazioneBatch/src/main/resources/govcat-batch-configurazione.properties` |
| Proprietà configuratore GovWay | `govcat-batch.war` | `/var/govcat/conf/govcat-configuratore.properties` | `configuratore/src/main/resources/properties/govcat-configuratore.properties` |
| Configurazione funzionale (workflow, profili, monitoraggio, ...) | API, batch | `/var/govcat/conf/configurazione.json` | `src/main/plugin/plugin/configurazione.json` |
| Proprietà web | `govcat-web.war` | `/var/govcat/conf/govcat-web.properties` | `web/src/main/resources/govcat-web.properties` |
| Configurazione frontend | `govcat-web.war` | `/var/govcat/conf/app-config.json` (override servito dal web) | `frontend/angular/projects/apicat-app/src/assets/config/app-config.json` |
| Logging | tutti i WAR | `/var/govcat/conf/log4j2.xml` (API), `govcat-batch-log4j2.xml` (batch), `govcat-web-log4j2.xml` (web) | `*/src/main/resources/log4j2*.xml` |

## Legenda

- **Modifica**: `Aggiunta`, `Rimossa`, `Rinominata`, `Default cambiato`, `Semantica cambiata`,
  `Resa opzionale`, `Resa obbligatoria`, `Deprecata`.
- **Azione all'upgrade**:
  - `Nessuna`: chi non la usa non deve fare nulla e il comportamento resta quello di prima.
  - `Valutare`: nessun intervento obbligatorio, ma conviene rivedere il valore.
  - `Obbligatoria`: senza intervento l'installazione non parte o cambia comportamento.

## 2.5.1 (non rilasciata)

### Proprietà batch (`govcat-batch-configurazione.properties`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `configurazione-automatica.batch.utente_configuratore` | Semantica cambiata, Resa opzionale | nessuno (prima `lorenzo.gestore` nel file del WAR) | `Valutare`: l'autore del cambio di stato dopo la configurazione automatica ora è l'utente che ha richiesto la configurazione; la proprietà è usata solo come fallback, se questo non risulta dallo storico. Se il fallback non è valorizzato o l'utente non esiste, l'adesione va in configurazione `KO` senza invocare GovWay e si ripristina con il retry della configurazione automatica. Chi la valorizzava nel file esterno può lasciarla come fallback. | Issue 422 |

### Proprietà API (`govcat-api.properties`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `monitor.audit.pool_size` | Aggiunta | `10` | `Nessuna`: numero di thread per recuperare l'audit delle transazioni nelle liste con `includi_audit`. | Issue 404 |
| `pdnd.finalita.cache.enabled` / `.ttl` / `.maxElements` | Aggiunta | `true` / `300` secondi / `1000` | `Nessuna`: cache delle finalità lette dalla PDND per il confronto con le quote del rate limiting; serve solo se è configurata `adesione.rate_limiting.finalita`. | Issue 446 |

### Configurazione funzionale (`configurazione.json`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `servizio.note_vetrina` (`abilitato`, `ruoli_abilitati`) | Aggiunta | assente = note non mostrate in vetrina | `Nessuna`: per mostrare le note del servizio nella pagina di vetrina impostare `abilitato` a `true` e indicare in `ruoli_abilitati` i ruoli dell'utente sul servizio che le vedono (`richiedente`, `referente`, `referente_superiore`, `gestore`; i ruoli tecnici valgono come i non tecnici, il gestore solo se elencato, lista vuota = nessuno). Regola la sola visualizzazione: l'API del dettaglio servizio restituisce le note come prima. | Issue 484 |
| `monitoraggio.audit_abilitato` | Aggiunta | assente = disabilitato | `Valutare`: va abilitata per avere il monitoraggio di audit. | Issue 404 |
| `monitoraggio.proprieta_audit` (`nome_gruppo`, `nome_proprieta`, `ambiente`) | Aggiunta | assente | `Valutare`: indica per ciascun ambiente le proprietà custom delle API con il pattern di audit; serve se `audit_abilitato` è `true`. | Issue 404 |
| `servizio.api.profili[].rate_limiting` (`periodi`, `quota_totale`, `quota_fruitore`, con `required` e `ruoli_abilitati`) | Aggiunta | assente = sola quota totale con tutti i periodi; per i profili con `pdnd_type` quota totale e quota fruitore con il solo periodo `giorno` | `Valutare`: le proprietà custom di rate limiting esistenti non vengono migrate ai nuovi campi (il configuratore continua a leggerle). | Issue 402 |
| `servizio.api.profili[].profilo_govway` | Semantica cambiata | assente | `Valutare`: oltre che dal batch e dalle transazioni è usata anche dalle statistiche per scegliere il profilo di interoperabilità con cui interrogare il monitoraggio, quando il soggetto non ha un tipo gateway. Nel monitoraggio il tipo gateway del soggetto ora prevale su questa chiave, come nel batch. Va valorizzata sui profili usati da API non ModI, altrimenti le loro statistiche restano vuote. | Issue 440 |
| `monitoraggio.profilo_govway_default` | Semantica cambiata | `ModI` nella configurazione distribuita | `Valutare`: per statistiche e transazioni è ora solo l'ultimo fallback, dopo `soggetto.profilo_gateway_default`, come nel batch (prima le statistiche usavano sempre questa chiave e le transazioni la usavano subito dopo `profilo_govway` dei profili). Con `soggetto.profilo_gateway_default` valorizzato, le API i cui profili non dichiarano `profilo_govway` sono monitorate con quel profilo, lo stesso con cui le configura il batch. | Issue 440 |
| `monitoraggio.ruoli_abilitati` | Semantica cambiata | lista vuota nella configurazione distribuita | `Valutare`: prima era applicata solo dal frontend, ora anche dalle API di transazioni e statistiche, che rispondono 403 agli utenti senza un ruolo abilitato sul servizio (il ruolo `referente` vale solo per i referenti del servizio, non per gli operatori API dell'organizzazione). Il gestore è sempre ammesso dalle API, anche se non è nella lista. Verificare che la lista comprenda i ruoli che devono consultare il monitoraggio. | Issue 449 |
| `adesione.rate_limiting.stati_autorizzati.collaudo` / `.produzione` | Aggiunta | assente = ricavati dagli stati del workflow (da `autorizzato_collaudo` / `autorizzato_produzione` in poi) | `Valutare` solo con workflow personalizzati i cui nomi di stato non seguono le convenzioni. | Issue 402 |
| `adesione.rate_limiting.finalita.collaudo` / `.produzione` (`nome_gruppo`, `nome_proprieta`) | Aggiunta | assente = nessun confronto con le finalità PDND | `Valutare`: indica per ambiente la proprietà custom delle adesioni con l'identificativo della finalità PDND. Con la chiave valorizzata il riepilogo del rate limiting confronta la quota giornaliera delle adesioni autorizzate con quella della finalità, e il batch legge da lì la finalità da configurare su GovWay al posto della property `configuratore.ScenarioMtlsFruizioniPdnd.<ambiente>.purposeId`. Il gruppo deve essere fra le `adesione.proprieta_custom`, con una classe dato dello stesso ambiente, altrimenti l'API non parte. Per renderla obbligatoria prima della configurazione: classe dato `collaudo_pdnd` / `produzione_pdnd` e la stessa classe fra i `dati_obbligatori` della voce `in_configurazione_*` del workflow delle adesioni. | Issue 446 |

### Proprietà configuratore GovWay (`govcat-configuratore.properties`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `configuratore.ScenarioMtlsFruizioniPdnd.<ambiente>.rateLimiting` | Deprecata, Semantica cambiata | assente | `Valutare`: lo scenario configura una policy per ogni periodo (minuti, orario, giornaliero) delle quote di rate limiting dell'adesione; la property vale solo per le adesioni senza quote, con il comportamento della 2.5.0. Le quote vanno reinserite nel rate limiting delle adesioni: non c'è migrazione automatica dalle proprietà custom. | Issue 446 |
| `configuratore.ScenarioMtlsFruizioniPdnd.<ambiente>.purposeId` | Deprecata | assente | `Valutare`: vale solo se il `configurazione.json` non indica `adesione.rate_limiting.finalita` per l'ambiente; conviene spostare il riferimento nella nuova chiave, usata anche dal riepilogo del rate limiting. | Issue 446 |

### Configurazione frontend (`app-config.json`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `AppConfig.Services.rateLimitingMock` | Aggiunta | `false` | `Nessuna`: dati di esempio solo per sviluppo, in installazione deve restare `false`. | Issue 402 |
