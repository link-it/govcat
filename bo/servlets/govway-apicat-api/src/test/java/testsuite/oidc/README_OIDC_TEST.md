# Test di Integrazione OIDC con Keycloak

Questa guida spiega come eseguire i test di integrazione per l'autenticazione OIDC con Keycloak.

## Prerequisiti

- Docker installato (per eseguire Keycloak)
- Maven 3.x
- Java 11+
- Porta 9999 disponibile (per Keycloak)

## Setup Keycloak

### 1. Avvia Keycloak con Docker

```bash
docker run -d \
  --name keycloak-test \
  -p 9999:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

Attendi che Keycloak sia completamente avviato (circa 30-60 secondi):

```bash
docker logs -f keycloak-test
```

Quando vedi il messaggio "Keycloak ... started", Keycloak è pronto.

### 2. Accedi alla Admin Console

Apri il browser e vai su: **http://localhost:9999**

- Username: `admin`
- Password: `admin`

### 3. Crea il Realm "PROVA"

1. Clicca su **Master** (in alto a sinistra)
2. Clicca su **Create Realm**
3. Nome: `PROVA`
4. Enabled: **ON**
5. Clicca **Create**

### 4. Crea il Client "govcat-api"

1. Nel realm **PROVA**, vai su **Clients** → **Create client**
2. **General Settings:**
   - Client type: `OpenID Connect`
   - Client ID: `govcat-api`
   - Clicca **Next**

3. **Capability config:**
   - Client authentication: **OFF** (public client)
   - Authorization: **OFF**
   - Authentication flow:
     - ✅ Standard flow
     - ✅ Direct access grants (IMPORTANTE!)
     - ⬜ Implicit flow
     - ⬜ Service accounts roles
   - Clicca **Next**

4. **Login settings:**
   - Root URL: `http://localhost:8080`
   - Home URL: `http://localhost:8080`
   - Valid redirect URIs: `*`
   - Web origins: `*`
   - Clicca **Save**

### 5. Crea l'Utente "bssgnn"

1. Nel realm **PROVA**, vai su **Users** → **Add user**
2. **User details:**
   - Username: `bssgnn`
   - Email: `giovanni.bussoni@example.com` (opzionale)
   - First name: `Giovanni` (opzionale)
   - Last name: `Bussoni` (opzionale)
   - Email verified: **ON** (opzionale)
   - Enabled: **ON**
   - Clicca **Create**

3. **Imposta la password:**
   - Vai alla tab **Credentials**
   - Clicca **Set password**
   - Password: `giovannibu`
   - Password confirmation: `giovannibu`
   - Temporary: **OFF**
   - Clicca **Save** e conferma

### 6. (Opzionale) Configura i Claims Custom

Se vuoi testare claims custom come `fiscalNumber`, `organization`, ecc:

1. Nel client **govcat-api**, vai alla tab **Client scopes**
2. Clicca su **govcat-api-dedicated**
3. Vai alla tab **Mappers** → **Configure a new mapper**
4. Seleziona **User Attribute**
5. Configura il mapper:
   - Name: `fiscalNumber`
   - User Attribute: `fiscalNumber`
   - Token Claim Name: `fiscalNumber`
   - Claim JSON Type: `String`
   - Add to ID token: **ON**
   - Add to access token: **ON**
   - Add to userinfo: **ON**
6. Clicca **Save**

Poi aggiungi l'attributo all'utente:
1. Vai su **Users** → seleziona **bssgnn**
2. Tab **Attributes** → **Add attribute**
3. Key: `fiscalNumber`
4. Value: `BSSGNN84R21F979A`
5. Clicca **Save**

Ripeti per altri attributi custom: `organization`, `sede`, `matricola`, ecc.

### 7. (Opzionale) Configura i Ruoli

Per testare i ruoli:

1. Nel realm **PROVA**, vai su **Realm roles** → **Create role**
2. Crea i ruoli:
   - `GESTORE`
   - `REFERENTE_SERVIZIO`

3. Assegna i ruoli all'utente **bssgnn**:
   - Vai su **Users** → seleziona **bssgnn**
   - Tab **Role mapping** → **Assign role**
   - Seleziona i ruoli da assegnare
   - Clicca **Assign**

## Esecuzione dei Test

### Test Singolo

```bash
cd bo/servlets/govway-apicat-api
mvn test -Dtest=OidcAuthenticationIntegrationTest -Doidc.test.enabled=true
```

### Tutti i Test (inclusi OIDC)

```bash
mvn test -Doidc.test.enabled=true
```

### Test Specifico

```bash
mvn test -Dtest=OidcAuthenticationIntegrationTest#testGetProfiloConTokenValido_DeveRestituire200 -Doidc.test.enabled=true
```

## Descrizione dei Test

### Test 1: `testGetProfiloSenzaToken_DeveRestituire403`
- **Cosa testa:** Verifica che una richiesta senza token venga rifiutata
- **Risultato atteso:** HTTP 403 Forbidden

### Test 2: `testGetProfiloConTokenInvalido_DeveRestituire403`
- **Cosa testa:** Verifica che un token JWT non valido venga rifiutato
- **Risultato atteso:** HTTP 403 Forbidden

### Test 3: `testGetProfiloConTokenValido_DeveRestituire200`
- **Cosa testa:** Verifica che un token JWT valido permetta l'accesso
- **Risultato atteso:** HTTP 200 OK con dati profilo

### Test 4: `testMappingClaimsJWT_VerificaDatiUtente`
- **Cosa testa:** Verifica che i claims JWT siano mappati correttamente ai campi utente
- **Risultato atteso:** Dati utente estratti correttamente dal token

### Test 5: `testTokenScaduto_DeveGestireCorrettamente`
- **Cosa testa:** Test informativo sulla gestione dei token scaduti
- **Nota:** Per testare completamente, configura un TTL breve in Keycloak

### Test 6: `testFlussoCompletoAutenticazione`
- **Cosa testa:** Flusso completo: no auth → 403, get token → auth → 200
- **Risultato atteso:** Tutti gli step completati con successo

## Troubleshooting

### Problema: "Keycloak non è disponibile"

**Soluzione:**
```bash
# Verifica che Keycloak sia in esecuzione
docker ps | grep keycloak-test

# Se non è in esecuzione, riavvialo
docker start keycloak-test

# Verifica i log
docker logs keycloak-test
```

### Problema: "Impossibile ottenere token JWT da Keycloak"

**Possibili cause:**
1. **Utente non esiste o password errata**
   - Verifica che l'utente `bssgnn` esista
   - Verifica che la password sia `giovannibu`
   - Verifica che l'utente sia **Enabled**

2. **Client non configurato correttamente**
   - Verifica che il client `govcat-api` esista
   - Verifica che **Direct access grants** sia abilitato
   - Verifica che il client sia **public** (Client authentication: OFF)

3. **Realm errato**
   - Verifica che il realm si chiami esattamente `PROVA` (case sensitive)

### Problema: "Token JWT non valido"

**Possibili cause:**
1. **Issuer non corrisponde**
   - Verifica che `oidc.issuer.uri` sia `http://localhost:9999/realms/PROVA`

2. **JWKS endpoint non raggiungibile**
   - Verifica che Keycloak sia raggiungibile su porta 9999
   - Prova ad accedere manualmente a: http://localhost:9999/realms/PROVA/.well-known/openid-configuration

### Problema: Test falliscono con errori di connessione

**Soluzione:**
```bash
# Verifica la porta 9999
lsof -i :9999

# Se occupata da altro processo, ferma il container e usa un'altra porta
docker stop keycloak-test
docker rm keycloak-test

# Riavvia su porta diversa (es. 8180) e aggiorna application-oidc-test.properties
docker run -d --name keycloak-test -p 8180:8080 ...
```

## Verifica Manuale del Token

### 1. Ottieni un Token da Keycloak

```bash
curl -X POST http://localhost:9999/realms/PROVA/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=govcat-api" \
  -d "username=bssgnn" \
  -d "password=giovannibu"
```

Dovresti ricevere una risposta JSON con `access_token`, `refresh_token`, ecc.

### 2. Decodifica il Token

Copia l'`access_token` e vai su https://jwt.io per decodificarlo e vedere i claims.

### 3. Usa il Token per chiamare l'API

```bash
# Sostituisci YOUR_TOKEN con il token ottenuto
curl -X GET http://localhost:8080/api/v1/profilo \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Pulizia

### Ferma e rimuovi Keycloak

```bash
docker stop keycloak-test
docker rm keycloak-test
```

### Riavvia Keycloak (mantiene i dati)

```bash
docker start keycloak-test
```

## Note Aggiuntive

- I test usano il profile `oidc-test` che configura `authentication.mode=OIDC_JWT`
- La configurazione è in `src/test/resources/application-oidc-test.properties`
- I test sono abilitati solo con `-Doidc.test.enabled=true` per evitare fallimenti nei CI/CD senza Keycloak
- Il database H2 in memoria viene ricreato per ogni test

## Configurazione Personalizzata

Puoi personalizzare la configurazione del test editando:

**`src/test/resources/application-oidc-test.properties`**

```properties
# Cambia l'endpoint Keycloak
keycloak.test.token-endpoint=http://your-keycloak:8080/realms/YOUR_REALM/protocol/openid-connect/token
oidc.jwks.uri=http://your-keycloak:8080/realms/YOUR_REALM/protocol/openid-connect/certs
oidc.issuer.uri=http://your-keycloak:8080/realms/YOUR_REALM

# Cambia le credenziali
keycloak.test.username=your-username
keycloak.test.password=your-password

# Configura mapping claims custom
oidc.claim.cf=your_custom_claim
oidc.claim.organization=your_org_claim
```

## Link Utili

- **Keycloak Documentation:** https://www.keycloak.org/documentation
- **OpenID Connect Specification:** https://openid.net/specs/openid-connect-core-1_0.html
- **JWT.io (token decoder):** https://jwt.io
- **Spring Security OAuth2:** https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html
