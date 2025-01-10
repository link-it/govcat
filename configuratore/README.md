# govcat-configuratore
Progetto per il configuratore degli scenari di govcat.

## Struttura
Il progetto si compone dell'implementazione della classe astratta `IConfigurazioneExecutor` per configurare
i vari scenari offerti dal batch di configurazione. Il package `config` contiene tutte le classi necessarie
per comunicare con l'API di configurazione di GovWay. Il package `keycloak` contiene tutte le classi 
necessarie per comunicare con l'API di Keycloak. Il package `configuratore` invece implementa il configuratore
e tutti i vari scenari usando gli invoker definiti nei package elencati precedentemente.

## Flusso di configurazione
Quando il configuratore riceve un'adesione, fa l'unwrapping dei parametri di ingresso per ottenere, in una forma
più comoda, l'associazione profilo di autenticazione (implementato dalla classe `DTOClient`) e il servizio da
configurare (implementato dalla classe GruppoServizio, la quale definisce un gruppo specifico all'interno
di un servizio).

La classe `ConfigurazioneDemo`, oltre a svolgere questo lavoro preliminare, decide quale scenario applicare in base
al tipo di profilo di autenticazione (e in futuro ad altri valori passati dal batch di configurazione).

Lo scenario scelto si occuperà di configurare i client e successivamente i vari servizi in base allo scenario.

## Scenari implementati

### Scenario mTLS

**Credenziali richieste**

Un certificato X.509 utilizzato dall'aderente come certificato client TLS su https.

**Configurazione da effettuare su GovWay**

Esistono differenti scenari possibili di seguito descritti.

##### a. Scenario 'API Gateway'

Dovrebbe essere uno dei due scenari già realizzati in #1 . 

**Applicabilità**: L'erogazione/fruizione su GovWay deve essere pre-configurata per attendersi un'autenticazione trasporto 'https' ed una autorizzazione puntuale. In questo scenario tipicamente l'erogazione o la fruizione dell'API su GovWay sarà con un profilo 'API Gateway', ma potrebbe essere anche una fruizione 'ModI'. Sicuramente NON PUO' essere una erogazione 'ModI'.

**Configurazione**: 
- censimento di un soggetto (prende il nome dal soggetto del catalogo); 
- censimento di un applicativo (prende il nome del client) a cui viene associato il certificato X.509;
- aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente.

##### b. Scenario 'ModI'

**Applicabilità**: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02) ed una autorizzazione puntuale sul canale.

**Configurazione**: 
- censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene associato il certificato X.509;
- aggiunta del soggetto nella lista degli applicativi autorizzati puntualmente sul canale.
NOTA: non serve registrare l'applicativo e il nome del client rimane inutilizzato per quanto concerne la configurazione su govway.




### Scenario mTLS + Signature

**Credenziali richieste**

- Un certificato X.509 utilizzato dall'aderente come certificato client TLS su https.
- Un certificato X.509 utilizzato dall'aderente per firmare la richiesta applicativa.

**Configurazione da effettuare su GovWay**

##### a. Scenario 'ModI'

**Applicabilità**: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02 + pattern sicurezza messaggio ID_AUTH_* o INTEGRITY_*) ed una autorizzazione puntuale sia sul canale che sul messaggio.

**Configurazione**: 
- censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene associato il certificato X.509 TLS;
- censimento di un applicativo (prende il nome del client) a cui viene associato il certificato X.509 di firma;
- aggiunta del soggetto nella lista dei soggetti autorizzati puntualmente nell'autorizzazione canale;
- aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.




### Scenario PDND

**Credenziali richieste**

L'identificativo client dell'aderente sulla PDND.

**Configurazione da effettuare su GovWay**

Esistono differenti scenari possibili di seguito descritti.

##### a. Scenario PDND 'autorizzazione puntuale'

**Applicabilità**: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi un'autenticazione canale 'https' opzionale (pattern ID_AUTH_CHANNEL_01), un'autenticazione token tramite policy 'PDND' (pattern messaggio ID_AUTH_* via PDND) ed una autorizzazione puntuale per criterio di autorizzazione messaggio.

**Configurazione**: 
- censimento di un soggetto (prende il nome dal soggetto del catalogo); 
- censimento di un applicativo (prende il nome del client) a cui viene associato il clientId fornito e la token policy 'PDND';
- aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.


##### b. Scenario PDND 'solo voucher'

**Applicabilità**: identica allo scenario precedente

**Configurazione**: non viene richiesta alcuna configurazione su GovWay.




### Scenario mTLS + PDND

**Credenziali richieste**

- Un certificato X.509 utilizzato dall'aderente come certificato client TLS su https.
- L'identificativo client dell'aderente sulla PDND.

**Applicabilità**: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02), un'autenticazione token tramite policy 'PDND' (pattern messaggio ID_AUTH_* via PDND) ed una autorizzazione puntuale sia per autorizzazione canale che per criterio di autorizzazione messaggio.

**Configurazione**: 
- censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene associato il certificato X.509 TLS;
- censimento di un applicativo (prende il nome del client) a cui viene associato il clientId fornito e la token policy 'PDND';
- aggiunta del soggetto nella lista dei soggetti autorizzati puntualmente nell'autorizzazione canale;
- aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.