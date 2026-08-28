<title>PDND v3 — Operazioni non supportate</title>

# Migrazione PDND v3 — operazioni non supportate e approssimazioni

Report di riferimento per completare la migrazione dell'integrazione PDND (Issue 250).

L'API esposta da GovCat sotto `/pdnd/v1` è rimasta invariata (path e modello dati dell'API PDND
"Interoperability API Gateway" v1). Con `pdnd.versione=v3` l'implementazione invoca le API
**PDND core v3** (`m2mGatewayApiV3`, versione 3.1.0) e riporta le risposte nel modello v1.

Questo documento elenca:

1. le **operazioni che rispondono 501** (`SYS.501`) in configurazione v3, con il motivo tecnico e le
   strade percorribili per completarle;
2. le **approssimazioni** applicate alle operazioni supportate, da validare funzionalmente;
3. il **costo in chiamate** delle operazioni ricostruite.

Con `pdnd.versione=v1` il comportamento è identico a prima della migrazione: nessuna delle
limitazioni sotto si applica.

---

## 1. Operazioni non supportate (HTTP 501)

### 1.1 Eventi — `GET /{ambiente}/events`, `/events/eservices`, `/events/keys`

**Motivo.** Nell'API v1 un evento è identificato da `eventId` numerico (`integer int64`) e la
risposta riporta `lastEventId` per la ripresa incrementale. Nella v3 l'identificativo dell'evento è
un **UUID** (`lastEventId` è un parametro `format: uuid`) e la risposta non riporta alcun
progressivo. Inoltre la v3 **non ha un flusso aggregato**: gli eventi sono separati per tipo
(`/eserviceEvents`, `/keyEvents`, `/agreementEvents`, `/purposeEvents`, `/tenantEvents`,
`/clientEvents`, `/producerKeyEvents`, `/producerKeychainEvents`, `/consumerDelegationEvents`,
`/producerDelegationEvents`, `/eserviceTemplateEvents`, `/attributeEvents`, `/purposeTemplateEvents`),
mentre `/events` della v1 era il flusso unico.

Il modello `Event` cambia forma: la v1 espone `{eventId, eventType, objectType, objectId{}}`, la v3
espone per ciascun tipo un oggetto dedicato con `id` (UUID), `eventTimestamp` e i riferimenti
tipizzati (es. `KeyEvent{id, eventType, eventTimestamp, kid, clientId}`).

**Strade per completarla.**

- **Cambio di contratto** dell'API esposta: `lastEventId` come stringa e `eventId` come UUID. È la
  soluzione pulita, ma è un breaking change per il pannello PDND del frontend
  (`pdnd.service.ts` → `events()`) e per eventuali altri client.
- **Mappatura progressivo ↔ UUID mantenuta da GovCat**: si conserva localmente la corrispondenza
  tra un progressivo numerico e l'UUID dell'evento PDND. Richiede persistenza e una politica di
  retention; il progressivo non sarebbe più quello della PDND.
- **Aggregazione dei flussi per tipo**: per `/events` occorre decidere l'ordinamento tra stream
  diversi (`eventTimestamp` è disponibile in tutti i modelli evento v3) e come esprimere
  `objectType`/`objectId` a partire dai riferimenti tipizzati.

### 1.2 Attributi di un accordo — `GET /{ambiente}/agreements/{agreementId}/attributes`

**Motivo.** La v1 restituisce `Attributes{certified[], declared[], verified[]}` di
`AttributeValidityState{id, validity: VALID|INVALID}` per un accordo. La v3 **non ha alcuna
operazione sugli attributi di un accordo**: gli attributi sono interrogabili solo per tenant
(`/tenants/{tenantId}/{certified|declared|verified}Attributes`) o per descrittore
(`/eservices/{id}/descriptors/{did}/{certified|declared|verified}Attributes`), e il concetto di
`validity` non esiste.

**Strade per completarla.** Ricostruzione in due passi: `getAgreement(agreementId)` per ottenere
`consumerId` e `descriptorId`, quindi gli attributi del tenant fruitore e quelli richiesti dal
descrittore. La `validity` diventerebbe un'inferenza: `TenantCertifiedAttribute` e
`TenantDeclaredAttribute` espongono `assignedAt` e `revokedAt`, quindi un attributo con `revokedAt`
valorizzato potrebbe essere reso `INVALID`, uno senza `revokedAt` `VALID`;
`TenantVerifiedAttribute` espone solo `assignedAt` (per la verifica si potrebbero usare
`/tenants/{id}/verifiedAttributes/{attributeId}/verifiers` e `/revokers`). Da validare
funzionalmente: è una semantica ricostruita, non un dato restituito dalla PDND. Costo: 4-5 chiamate
per invocazione, più la paginazione.

### 1.3 Assegnazione e revoca di un attributo certificato per codice

`POST` e `DELETE /{ambiente}/organizations/origin/{origin}/externalId/{externalId}/attributes/{code}`
(`upsertTenant`, `revokeTenantAttribute`).

**Motivo.** Le operazioni v3 corrispondenti lavorano per identificativi:
`POST /tenants/{tenantId}/certifiedAttributes` con body `{id}` e
`DELETE /tenants/{tenantId}/certifiedAttributes/{attributeId}`. Servono quindi due risoluzioni:

- `origin` + `externalId` → `tenantId`: possibile con `GET /tenants?IPACode=` oppure `?taxCode=`,
  quindi **solo** per tenant presenti in IPA (per codice IPA) o identificati da codice fiscale; per
  altre origini non c'è un filtro.
- `code` → `attributeId`: **non disponibile**. `GET /certifiedAttributes` non accetta filtri
  (solo `offset`/`limit`, con `limit` massimo 50), quindi l'unico modo sarebbe scorrere l'intero
  registro degli attributi certificati.

**Strade per completarla.**

- Richiedere a PagoPA un filtro per `code` (e per `origin`) su `/certifiedAttributes`: è la strada
  che rende l'operazione realizzabile senza compromessi.
- Cache locale del mapping `code` → `attributeId`, popolata dagli attributi già incontrati (ad
  esempio da `createCertifiedAttribute`, che restituisce `id`, `code` e `origin`) e dagli attributi
  dei descrittori. Copre solo gli attributi noti.
- Scansione integrale paginata del registro attributi: tecnicamente possibile, ma con `limit` 50 e
  rate limit dichiarato dalla PDND non è una strada praticabile in linea.

Nota: queste due operazioni non sono utilizzate dal frontend GovCat; l'impatto riguarda eventuali
client esterni dell'API esposta.

### 1.4 Approvazioni: supportate solo in v3

`POST /{ambiente}/agreements/{agreementId}/approve` e `POST /{ambiente}/purposes/{purposeId}/approve`
sono le prime operazioni di scrittura dell'API PDND esposta da GovCat. Non esistono nell'API v1,
quindi con `pdnd.versione=v1` rispondono **501** (`SYS.501`) esattamente come le operazioni della
sezione precedente; con `pdnd.versione=v3` invocano gli endpoint omonimi della PDND.

Sono inoltre le uniche operazioni PDND soggette a un controllo di ruolo: sono consentite ai soli
utenti con `ruolo_pdnd = admin`, altrimenti **403** (`AUT.403.RUOLO.PDND`). Il corpo opzionale
`DelegationRef` della v3 non è esposto: l'approvazione avviene sempre come titolare, mai come
delegato.

---

## 2. Approssimazioni sulle operazioni supportate

| Ambito | Comportamento v1 | Comportamento con v3 | Da valutare |
|---|---|---|---|
| `Organization.category` | categoria IPA dell'ente | tipologia di tenant: `PA`, `PRIVATE`, `GSP`, `SCP` (`Tenant.kind`) | la categoria IPA non è più esposta dalla v3; alternativa disponibile: `selfcareInstitutionType` |
| `EService.version`, `state`, `serverUrls`, `attributes` | proprietà dell'e-service | prese dal **descrittore corrente**: si preferisce lo stato pubblicato, poi sospeso, deprecato, archiviato; a parità, la `version` numerica più alta | verificare che la scelta coincida con il descrittore che la v1 considerava attivo |
| `EServiceDescriptorState` | `PUBLISHED`, `DEPRECATED`, `SUSPENDED`, `ARCHIVED` | `ARCHIVING` → `PUBLISHED`, `ARCHIVING_SUSPENDED` → `SUSPENDED` (archiviazione pianificata ma non ancora effettiva) | interpretazione da confermare con la documentazione PDND |
| `EServiceDescriptor.interface` | metadati dell'interfaccia (id, nome, content type) | non valorizzato | la v3 espone solo il download dell'interfaccia (`/interface`), senza metadati; i `docs` provengono da `/documents` |
| `EServiceAttributeValue.code` / `origin` | presenti per tutti i tipi di attributo | presenti solo per gli attributi **certificati** | `DeclaredAttribute` e `VerifiedAttribute` della v3 espongono solo `id`, `name`, `description` |
| `EServiceAttributeValue.explicitAttributeVerification` | flag di verifica esplicita | non valorizzato | non presente nel modello v3 |
| filtro attributo in `getOrganizationEServices` | applicato dalla PDND su tutti i tipi | applicato da GovCat sui soli attributi certificati | conseguenza della riga precedente |
| elenchi di accordi, descrittori, finalità | — | esclusi gli elementi in stati non rappresentabili: accordi `DRAFT`, descrittori `DRAFT` e `WAITING_FOR_APPROVAL`, finalità con versione `REJECTED` | comportamento coerente con la v1, che non prevedeva quegli stati |
| accordo singolo in stato `DRAFT` | — | errore 500 `INT.500.PDND` (stato non rappresentabile) | valutare se il caso possa presentarsi nei flussi reali |
| `Purpose.throughput` e `state` | proprietà della finalità | da `currentVersion.dailyCalls` e `currentVersion.state`; in mancanza si usa `waitingForApprovalVersion`, poi `rejectedVersion` | — |
| `getAttribute` | una chiamata | fino a 3 chiamate in cascata (`certifiedAttributes` → `declaredAttributes` → `verifiedAttributes`), proseguendo solo sui 404 | il `kind` è dedotto dall'operazione che risponde |

---

## 3. Costo in chiamate verso la PDND

La v3 pagina tutte le collezioni con `limit` massimo **50**: GovCat scorre le pagine fino
all'ultima (nessun troncamento; limite di guardia a 1000 pagine per collezione, con log dedicato).

| Operazione esposta | Chiamate v3 |
|---|---|
| `getEService` | 6: e-service, tenant erogatore, descrittori, 3 endpoint attributi del descrittore |
| `getEServiceDescriptors` | 1 + 1 per descrittore (documenti) |
| `getEServiceDescriptor` | 2: descrittore e documenti |
| `getSubscribers` | 1 (accordi, paginati) + 1 per organizzazione fruitrice distinta |
| `approveAgreement`, `approvePurpose` | 1 — solo in v3: in v1 rispondono 501 |
| `getOrganizationEServices` | 1 (ricerca tenant) + N/50 (elenco e-service) + **4 per e-service** (descrittori e 3 endpoint attributi) |
| altre operazioni | 1 |

`getOrganizationEServices` è quindi l'operazione più onerosa: per un ente con 50 e-service si
superano le 200 chiamate. Da tenere presente rispetto al rate limit dichiarato dalla PDND
(header `X-Rate-Limit-*` in tutte le risposte v3, oggi non interpretati da GovCat). Un limite
massimo di e-service elaborati, una cache dei descrittori o l'interpretazione degli header di rate
limit sono i tre interventi possibili se il costo si rivelasse eccessivo in esercizio.

---

## 4. Riferimenti

- Specifica ufficiale PDND core v3: `pagopa/interop-be-monorepo` →
  `packages/api-clients/open-api/m2mGatewayApiV3.yml` (versione 3.1.0)
- Sottoinsieme utilizzato da GovCat (generazione client e mock):
  `bo/servlets/govway-apicat-api/src/main/resources/pdnd/openapi_pdnd_client_v3.yaml`
- API PDND esposta da GovCat (contratto invariato):
  `bo/servlets/govway-apicat-api/src/main/resources/pdnd/openapi_pdnd.yaml`
- Adattamento v3 → modello esposto: `PDNDClientV3`; selezione della versione: `PDNDClientFactory`
- Mock v3: `/pdnd/mock/v3/{collaudo|produzione}` (`PDNDMockServerV3`, risposte in
  `resources/pdnd/mock/v3/`)
