# Documentazione app-config.json

## Descrizione

Il file `app-config.json` è il file di configurazione runtime principale dell'applicazione **GovCat** (Catalogo API ModI). Contiene tutte le configurazioni necessarie per personalizzare il comportamento dell'applicazione senza dover ricompilare il codice sorgente.

**Percorso**: `/assets/config/app-config.json`

---

## Struttura del File

### 1. Informazioni Generali

```json
{
  "version": "0.1",
  "sessionPrefix": "GWAC"
}
```

- **version**: Versione del formato del file di configurazione
- **sessionPrefix**: Prefisso utilizzato per le chiavi di sessione nel browser storage

---

### 2. AppConfig

Sezione principale che contiene tutte le configurazioni dell'applicazione.

#### 2.1 Configurazioni Base

```json
"SITE": "http://172.16.1.250/govcat-web/catalogo/",
"TIMEOUT": "30000",
"DELAY": "500",
"DEFAULT_TRANSACTION_INTERVAL": 30,
"DEFAULT_NOTIFICATIONS_TIMER": 15000
```

- **SITE**: URL base dell'applicazione
- **TIMEOUT**: Timeout per le richieste HTTP (in millisecondi)
- **DELAY**: Ritardo di debounce per le operazioni (in millisecondi)
- **DEFAULT_TRANSACTION_INTERVAL**: Intervallo di default per le transazioni (in secondi)
- **DEFAULT_NOTIFICATIONS_TIMER**: Intervallo per il polling delle notifiche (in millisecondi)

#### 2.2 Accesso Anonimo

```json
"ANONYMOUS_ACCESS": true
```

- **ANONYMOUS_ACCESS**: Permette l'accesso anonimo al catalogo in modalità sola lettura

#### 2.3 AUTH_SETTINGS - Configurazione Autenticazione

```json
"AUTH_SETTINGS": {
  "LOGIN_ENABLED": false,
  "AUTH_USER": false,
  "OTHER_AUTHS": [...],
  "AUTOLOGIN": true,
  "SHOW_USER_REGISTRATION": false,
  "OAUTH": {...},
  "TOKEN_POLICIES": {...}
}
```

##### Proprietà Principali

- **LOGIN_ENABLED**: Abilita/disabilita il form di login tradizionale
- **AUTH_USER**: Abilita l'autenticazione utente con username/password
- **AUTOLOGIN**: Esegue automaticamente il login all'avvio
- **SHOW_USER_REGISTRATION**: Mostra il link di registrazione nuovo utente

##### OTHER_AUTHS - Provider di Autenticazione Esterni

Array di provider OAuth esterni configurabili:

```json
"OTHER_AUTHS": [
  {
    "label": "Accedi con Github",
    "icon": "github",
    "image": "",
    "enabled": false,
    "signin_url": "http://172.16.1.90/govhub-reverse-proxy/oauth2/authorization/github"
  },
  {
    "label": "Accedi con OAuth",
    "icon": "",
    "image": "Oauth_logo.svg",
    "enabled": true,
    "signin_url": "",
    "signin_action": "oauth"
  }
]
```

- **label**: Testo del pulsante di login
- **icon**: Icona FontAwesome da visualizzare (es. "github")
- **image**: Percorso immagine personalizzata (alternativa a icon)
- **enabled**: Abilita/disabilita questo provider
- **signin_url**: URL per l'autenticazione (se vuoto, usa configurazione OAUTH interna)
- **signin_action**: Azione speciale (es. "oauth" per usare configurazione OAUTH)

##### OAUTH - Configurazione OAuth 2.0 / OpenID Connect

```json
"OAUTH": {
  "Issuer": "",
  "ClientId": "catalogo-app",
  "RedirectUri": "",
  "LogoutRedirectUri": "",
  "ResponseType": "code",
  "ShowDebugInformation": false,
  "BackdoorOAuth": true,
  "Scope": "openid profile email offline_access",
  "AutoAuthDiscovery": false
}
```

- **Issuer**: URL dell'identity provider OpenID Connect (se vuoto, viene calcolato dinamicamente)
- **ClientId**: ID client OAuth registrato presso l'identity provider
- **RedirectUri**: URI di redirect dopo l'autenticazione (se vuoto, usa URL corrente)
- **LogoutRedirectUri**: URI di redirect dopo il logout
- **ResponseType**: Tipo di risposta OAuth (code = Authorization Code Flow)
- **ShowDebugInformation**: Mostra informazioni di debug OAuth nella console
- **BackdoorOAuth**: Abilita meccanismi di fallback per l'autenticazione
- **Scope**: Scope OAuth richiesti (spazi separati)
- **AutoAuthDiscovery**: Abilita la discovery automatica degli endpoint OAuth

##### TOKEN_POLICIES - Policy per Token di Autorizzazione

```json
"TOKEN_POLICIES": {
  "code_grant": {
    "redirect_uri": "/code-grant-authorization/?return=ok"
  }
}
```

Configura le policy per la gestione dei token di autorizzazione per scenari specifici (es. code grant flow).

#### 2.4 GOVAPI - Endpoint Backend

```json
"GOVAPI": {
  "HOST": "/govcat-api/api/v1",
  "HOST_PDND": "/govcat-api/pdnd/v1",
  "HOST_MONITOR": "/govcat-api/monitor/v1",
  "LOGOUT_URL": "/logout"
}
```

- **HOST**: Endpoint principale delle API REST del backend
- **HOST_PDND**: Endpoint API per l'integrazione PDND (Piattaforma Digitale Nazionale Dati)
- **HOST_MONITOR**: Endpoint API per il monitoraggio GovWay
- **LOGOUT_URL**: URL per il logout

#### 2.5 Languages - Internazionalizzazione

```json
"Languages": [
  {
    "language": "Italiano",
    "alpha2Code": "it",
    "alpha3Code": "ita"
  },
  {
    "language": "English",
    "alpha2Code": "en",
    "alpha3Code": "eng"
  }
],
"DefaultLanguage": "it"
```

Lingue supportate dall'applicazione e lingua di default.

#### 2.6 Watermark

```json
"Watermark": false,
"WatermarkText": "Develop"
```

- **Watermark**: Abilita la visualizzazione di una filigrana sull'interfaccia
- **WatermarkText**: Testo della filigrana (utile per ambienti di test/sviluppo)

#### 2.7 Search - Configurazione Ricerca

```json
"Search": {
  "HistoryCount": 3,
  "newLayout": false
}
```

- **HistoryCount**: Numero di ricerche recenti da memorizzare nella cronologia
- **newLayout**: Abilita il nuovo layout per la ricerca

#### 2.8 Services - Configurazione Servizi

```json
"Services": {
  "showReferents": true,
  "hideVersions": false
}
```

- **showReferents**: Mostra i referenti dei servizi nel catalogo
- **hideVersions**: Nasconde le versioni sia nelle liste che nei dettagli dei servizi e delle API

#### 2.9 Layout - Configurazione Interfaccia

##### Layout.Login - Schermata di Login

```json
"Login": {
  "title": "Catalogo API ModI",
  "logo": "linkit_logo/LINK_logo-Govcat-O.svg",
  "header": "linkit_logo/LINK_logo-Govcat-O.svg"
}
```

- **title**: Titolo mostrato nella pagina di login
- **logo**: Logo principale
- **header**: Logo nell'header della pagina di login

##### Layout.Header - Header dell'Applicazione

```json
"showHeaderBar": true,
"Header": {
  "title": "Catalogo API ModI",
  "logo": "linkit_logo/LINK_logo-Govcat-O.svg"
}
```

- **showHeaderBar**: Mostra/nasconde la barra dell'header
- **Header.title**: Titolo nell'header
- **Header.logo**: Logo nell'header

##### Layout.Details - Pagina Dettagli

```json
"Details": {
  "singleColumn": false,
  "columns": 6,
  "Collapsible": {
    "informations": true
  }
}
```

- **singleColumn**: Layout a singola colonna
- **columns**: Numero di colonne per il layout (sistema a griglia Bootstrap, max 12)
- **Collapsible.informations**: Rende le sezioni informazioni collassabili

##### Layout.GroupView - Vista Gruppi

```json
"GroupView": {
  "numberCharLogoText": 8,
  "enabledImageLink": true,
  "showGroupIcon": true,
  "showGroupLabel": false,
  "colors": ["#00ffff", "#f0ffff", ...]
}
```

- **numberCharLogoText**: Numero di caratteri da mostrare nel logo testuale del gruppo
- **enabledImageLink**: Abilita link cliccabili sulle immagini dei gruppi
- **showGroupIcon**: Mostra l'icona del gruppo
- **showGroupLabel**: Mostra l'etichetta del gruppo
- **colors**: Array di colori esadecimali per colorare i gruppi in modo distintivo

##### Layout - Funzionalità UI

```json
"forceMenuOpen": true,
"showNotificationsMenu": true,
"showNotificationsBar": true,
"enablePollingNotifications": false,
"showTaxonomies": true,
"showCommunicationsMenu": true,
"showVersion": false,
"showBuild": false,
"showAbout": true,
"showAboutMiniBox": false,
"showNewsArea": false,
"privacyPolicyUrl": "https://www.link.it/informativa-privacy-policy/"
```

- **forceMenuOpen**: Forza il menu laterale sempre aperto
- **showNotificationsMenu**: Mostra il menu notifiche
- **showNotificationsBar**: Mostra la barra delle notifiche
- **enablePollingNotifications**: Abilita il polling automatico delle notifiche
- **showTaxonomies**: Mostra le tassonomie nel catalogo
- **showCommunicationsMenu**: Mostra il menu comunicazioni
- **showVersion**: Mostra il numero di versione nell'interfaccia
- **showBuild**: Mostra il numero di build nell'interfaccia
- **showAbout**: Mostra il link "Informazioni su"
- **showAboutMiniBox**: Mostra il box informazioni in versione compatta
- **showNewsArea**: Mostra l'area notizie
- **privacyPolicyUrl**: URL della privacy policy

#### 2.10 Fonts - Gestione Font Personalizzati

```json
"Fonts": [
  {
    "Name": "System Default",
    "FontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
  },
  {
    "Name": "Lato",
    "CssFile": "fonts/css/lato.css",
    "FontFamily": "'Lato', Helvetica, Arial, sans-serif"
  },
  {
    "Name": "Titillium Web",
    "CssFile": "fonts/css/titillium-web.css",
    "FontFamily": "'Titillium Web', sans-serif"
  },
  {
    "Name": "Roboto",
    "CssFile": "fonts/css/roboto.css",
    "FontFamily": "'Roboto', sans-serif"
  }
]
```

L'array `Fonts` definisce i font disponibili per i temi.

##### Proprietà di un Font

- **Name** (obbligatorio): Nome identificativo del font
- **CssFile** (opzionale): Percorso del file CSS contenente le dichiarazioni `@font-face` (relativo ad `assets/`)
- **FontFamily** (obbligatorio): Valore CSS da applicare alla proprietà `font-family`, può includere font di fallback

##### Font Disponibili

1. **System Default**: Font di sistema (non richiede file esterni)
2. **Lato**: Font Google (v25) - moderno e leggibile
3. **Titillium Web**: Font Google (v19) - design italiano
4. **Roboto**: Font Google (v50) - standard Material Design

Per maggiori dettagli sull'aggiunta di nuovi font, consulta: `assets/fonts/README.md`

#### 2.11 CurrentThems e Themes - Sistema di Tematizzazione

```json
"CurrentThems": "linkit-lato",
"Themes": [...]
```

- **CurrentThems**: Nome del tema attualmente attivo
- **Themes**: Array di temi disponibili

##### Temi Disponibili

L'applicazione supporta 6 temi predefiniti:

1. **Default**: Tema standard con header blu (#0071A9)
2. **linkit-white**: Tema chiaro con header bianco e footer grigio
3. **linkit-coral**: Tema con header corallo (#ff4050)
4. **linkit-blue**: Tema con header blu scuro (#2e445a)
5. **linkit-no-border**: Tema senza bordi con sfondo chiaro
6. **linkit-lato**: Tema con font Lato (basato su linkit-blue)

##### Struttura di un Tema

Ogni tema è definito da un oggetto con:

```json
{
  "Name": "nome-tema",
  "FontName": "Nome Font",
  "Variables": {
    "variabile-css": "valore",
    ...
  }
}
```

- **Name** (obbligatorio): Identificativo univoco del tema
- **FontName** (opzionale): Nome del font da utilizzare (deve corrispondere a un font nell'array `Fonts`)
- **Variables** (obbligatorio): Oggetto contenente le variabili CSS personalizzate

##### Variabili CSS Disponibili

Le variabili CSS personalizzabili includono:

**Colori Base:**

- `--body-back-color`: Colore di sfondo del body
- `--body-color`: Colore del testo del body
- `--border-color`: Colore dei bordi
- `--link-color`: Colore dei link
- `--link-hover-color`: Colore dei link al passaggio del mouse

**Header e Footer:**

- `--header-back-color`: Colore di sfondo dell'header
- `--header-color`: Colore del testo dell'header
- `--footer-back-color`: Colore di sfondo del footer
- `--footer-color`: Colore del testo del footer
- `--footer-expander-back-color`: Colore di sfondo dell'espansore del footer
- `--footer-expander-color`: Colore del testo dell'espansore del footer
- `--footer-border-color`: Colore del bordo del footer

**Navbar/Sidebar:**

- `--navbar-back-color`: Colore di sfondo della navbar
- `--navbar-color`: Colore del testo della navbar
- `--navbar-link-color`: Colore dei link nella navbar
- `--navbar-link-active-color`: Colore del link attivo
- `--navbar-link-active-back-color`: Colore di sfondo del link attivo
- `--navbar-toggle-back-color`: Colore di sfondo del toggle
- `--navbar-toggle-back-over-color`: Colore di sfondo del toggle al passaggio del mouse
- `--navbar-toggle-over-color`: Colore del testo del toggle al passaggio del mouse
- `--navbar-border-color`: Colore del bordo della navbar

**Pulsanti:**

- `--btn-confirm`: Colore del pulsante di conferma
- `--btn-confirm-color`: Colore del testo del pulsante di conferma
- `--btn-confirm-hover`: Colore del pulsante di conferma al passaggio del mouse
- `--btn-confirm-hover-shadow`: Colore dell'ombra del pulsante di conferma al passaggio del mouse
- `--btn-secondary`: Colore del pulsante secondario
- `--btn-secondary-color`: Colore del testo del pulsante secondario
- `--btn-secondary-hover`: Colore del pulsante secondario al passaggio del mouse
- `--btn-secondary-hover-shadow`: Colore dell'ombra del pulsante secondario al passaggio del mouse
- `--shadow-focus-color`: Colore dell'ombra per gli elementi in focus

**Selezione e Stati:**

- `--item-selected-background`: Colore di sfondo dell'elemento selezionato
- `--item-selected-color`: Colore del testo dell'elemento selezionato
- `--selected-background`: Colore di sfondo della selezione
- `--selected-color`: Colore del testo della selezione
- `--selected-shadow-color`: Colore dell'ombra della selezione

**Flyout Menu:**

- `--fly-out-back-item`: Colore di sfondo degli elementi del menu flyout
- `--fly-out-color-item`: Colore del testo degli elementi del menu flyout
- `--fly-out-back-top`: Colore di sfondo della parte superiore del flyout
- `--fly-out-color-top`: Colore del testo della parte superiore del flyout
- `--fly-out-color-link`: Colore dei link nel flyout

**Blocchi di Contenuto:**

- `--row-content-block-background-color`: Colore di sfondo dei blocchi di contenuto
- `--row-content-block-border-color`: Colore del bordo dei blocchi di contenuto
- `--row-content-block-color`: Colore del testo dei blocchi di contenuto
- `--row-content-block-hover-background-color`: Colore di sfondo dei blocchi al passaggio del mouse

**Dropdown:**

- `--dropdown-item-back-hover`: Colore di sfondo degli elementi dropdown al passaggio del mouse
- `--dropdown-item-color-hover`: Colore del testo degli elementi dropdown al passaggio del mouse

**Gruppi:**

- `--group-button-background`: Colore di sfondo dei pulsanti gruppo
- `--group-button-color`: Colore del testo dei pulsanti gruppo

**Dimensioni e Tipografia:**

- `--body-font-size`: Dimensione font del body (default: .875rem)
- `--sidebar-link-font-size`: Dimensione font dei link nella sidebar (default: .875rem)
- `--sidebar-link-height`: Altezza dei link nella sidebar (default: 32px)
- `--font-size-link-row`: Dimensione font delle righe link (default: .875rem)
- `--item-row-metadata-font-size`: Dimensione font dei metadati delle righe (default: 12px)
- `--item-row-metadata-avatar-size`: Dimensione avatar nei metadati (default: 16px)

**Altri:**

- `--gp-theme-accent`: Colore accent del tema
- `--top-area-border-color`: Colore del bordo dell'area superiore
- `--version-button-hover-color`: Colore del pulsante versione al passaggio del mouse

**Action Bar (solo tema linkit-no-border):**

- `--action-bar-font-size-sm`: Dimensione font piccola per action bar
- `--action-bar-color-border`: Colore bordo action bar
- `--action-bar-color-background`: Colore sfondo action bar
- `--action-bar-color-text-default`: Colore testo default action bar
- `--action-bar-color-text-subtle`: Colore testo sottile action bar
- `--action-bar-color-error`: Colore errore action bar

---

### 3. Footer

```json
"logoCopyright": "./assets/images/linkit_logo/linkit_logo_2x.png",
"copyright": "©2022-25 Link.it S.r.l."
```

- **logoCopyright**: Logo da mostrare nel footer
- **copyright**: Testo di copyright

---

## Come Modificare la Configurazione

### Cambiare il Tema Attivo

Modifica il valore di `CurrentThems` con uno dei nomi disponibili:

```json
"CurrentThems": "linkit-blue"
```

### Personalizzare un Tema

Modifica le variabili CSS nel tema desiderato. Ad esempio, per cambiare il colore dell'header:

```json
{
  "Name": "linkit-coral",
  "Variables": {
    "--header-back-color": "#00aa00",
    ...
  }
}
```

### Associare un Font a un Tema

Per applicare un font specifico a un tema, aggiungi la proprietà `FontName`:

```json
{
  "Name": "mio-tema",
  "FontName": "Lato",
  "Variables": {
    ...
  }
}
```

Il font specificato deve esistere nell'array `Fonts`. Se ometti `FontName`, verrà usato il font di default del browser.

### Aggiungere un Nuovo Font

Per aggiungere un nuovo font personalizzato:

1. **Scarica i file font** in formato `.woff2` (consigliato) da Google Fonts o altre fonti

2. **Crea la directory** per il font:
   ```
   assets/fonts/nome-font/
   ```

3. **Copia i file font** nella directory creata

4. **Crea il file CSS** in `assets/fonts/css/nome-font.css`:
   ```css
   @font-face {
     font-family: 'Nome Font';
     font-style: normal;
     font-weight: 400;
     font-display: swap;
     src: url('../nome-font/NomeFont-Regular.woff2') format('woff2');
   }
   ```

5. **Aggiungi il font in app-config.json**:
   ```json
   "Fonts": [
     {
       "Name": "Nome Font",
       "CssFile": "fonts/css/nome-font.css",
       "FontFamily": "'Nome Font', sans-serif"
     }
   ]
   ```

6. **Associa il font a un tema** (opzionale):
   ```json
   {
     "Name": "tema-personalizzato",
     "FontName": "Nome Font",
     "Variables": {...}
   }
   ```

Per una guida completa, consulta `assets/fonts/README.md`

### Aggiungere un Nuovo Provider OAuth

Aggiungi un nuovo oggetto nell'array `OTHER_AUTHS`:

```json
{
  "label": "Accedi con Keycloak",
  "icon": "key",
  "image": "",
  "enabled": true,
  "signin_url": "https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/auth"
}
```

### Modificare gli Endpoint Backend

Cambia i valori in `GOVAPI`:

```json
"GOVAPI": {
  "HOST": "/nuovo-path/api/v1",
  "HOST_PDND": "/nuovo-path/pdnd/v1",
  "HOST_MONITOR": "/nuovo-path/monitor/v1"
}
```

### Disabilitare l'Accesso Anonimo

```json
"ANONYMOUS_ACCESS": false
```

---

## Note Importanti

1. **Runtime Configuration**: Questo file viene caricato a runtime tramite il servizio `ConfigService` della libreria `@linkit/components`. Le modifiche hanno effetto immediato senza necessità di ricompilare l'applicazione.

2. **Percorsi Relativi**: I percorsi delle immagini (logo, icone) sono relativi alla cartella `assets/images/`. I percorsi dei file CSS dei font sono relativi alla cartella `assets/`.

3. **Validazione**: L'applicazione non valida strettamente la configurazione. Valori errati potrebbero causare malfunzionamenti.

4. **Variabili CSS**: Le variabili CSS vengono applicate al `:root` del documento e possono essere sovrascritte da CSS personalizzati.

5. **Multi-tenancy**: Il sistema di temi permette di personalizzare l'applicazione per diversi tenant senza modificare il codice.

6. **Compatibilità**: Questo formato di configurazione è specifico per GovCat v2.x. Verificare la compatibilità quando si aggiorna l'applicazione.

7. **Gestione Font**: I font vengono caricati dinamicamente quando un tema viene applicato. Se un font non viene trovato o il file CSS non esiste, l'applicazione continua a funzionare usando il font di default del browser. Gli errori vengono registrati nella console del browser.

---

## Riferimenti

- **Percorso file**: `/assets/config/app-config.json`
- **Servizio di caricamento**: `ConfigService` in `@linkit/components`
- **Versione Angular**: 19
- **Versione applicazione**: Definita in `package.json` e `environment.ts`
