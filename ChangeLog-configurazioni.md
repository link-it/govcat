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

### Configurazione funzionale (`configurazione.json`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `monitoraggio.audit_abilitato` | Aggiunta | assente = disabilitato | `Valutare`: va abilitata per avere il monitoraggio di audit. | Issue 404 |
| `monitoraggio.proprieta_audit` (`nome_gruppo`, `nome_proprieta`, `ambiente`) | Aggiunta | assente | `Valutare`: indica per ciascun ambiente le proprietà custom delle API con il pattern di audit; serve se `audit_abilitato` è `true`. | Issue 404 |
| `servizio.api.profili[].rate_limiting` (`periodi`, `quota_totale`, `quota_fruitore`, con `required` e `ruoli_abilitati`) | Aggiunta | assente = sola quota totale con tutti i periodi; per i profili con `pdnd_type` quota totale e quota fruitore con il solo periodo `giorno` | `Valutare`: le proprietà custom di rate limiting esistenti non vengono migrate ai nuovi campi (il configuratore continua a leggerle). | Issue 402 |
| `adesione.rate_limiting.stati_autorizzati.collaudo` / `.produzione` | Aggiunta | assente = ricavati dagli stati del workflow (da `autorizzato_collaudo` / `autorizzato_produzione` in poi) | `Valutare` solo con workflow personalizzati i cui nomi di stato non seguono le convenzioni. | Issue 402 |

### Configurazione frontend (`app-config.json`)

| Chiave | Modifica | Default | Azione all'upgrade | Riferimento |
|---|---|---|---|---|
| `AppConfig.Services.rateLimitingMock` | Aggiunta | `false` | `Nessuna`: dati di esempio solo per sviluppo, in installazione deve restare `false`. | Issue 402 |
