# Gestione Font Personalizzati

Questa directory contiene i font personalizzati e i loro file CSS per l'applicazione GovCat.

## Struttura Directory

```
assets/fonts/
├── css/                    # File CSS con @font-face declarations
│   ├── titillium-web.css
│   └── roboto.css
├── titillium-web/         # File font Titillium Web (da creare)
│   ├── TitilliumWeb-Regular.woff2
│   ├── TitilliumWeb-Bold.woff2
│   ├── TitilliumWeb-Italic.woff2
│   └── TitilliumWeb-BoldItalic.woff2
└── roboto/                # File font Roboto (da creare)
    ├── Roboto-Regular.woff2
    ├── Roboto-Bold.woff2
    ├── Roboto-Italic.woff2
    └── Roboto-BoldItalic.woff2
```

## Come Aggiungere un Nuovo Font

### 1. Scarica i file del font

Scarica i file del font in formato `.woff2` e `.woff` (per compatibilità con browser più vecchi).

**Fonti consigliate:**
- [Google Fonts](https://fonts.google.com/)
- [Font Squirrel](https://www.fontsquirrel.com/)

### 2. Crea la directory per il font

```bash
mkdir -p assets/fonts/nome-font
```

### 3. Copia i file del font

Posiziona i file `.woff2` e `.woff` nella directory appena creata.

### 4. Crea il file CSS

Crea un file CSS in `assets/fonts/css/nome-font.css` con le dichiarazioni `@font-face`:

```css
/* Regular */
@font-face {
  font-family: 'Nome Font';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../nome-font/NomeFont-Regular.woff2') format('woff2'),
       url('../nome-font/NomeFont-Regular.woff') format('woff');
}

/* Bold */
@font-face {
  font-family: 'Nome Font';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../nome-font/NomeFont-Bold.woff2') format('woff2'),
       url('../nome-font/NomeFont-Bold.woff') format('woff');
}
```

### 5. Aggiungi il font in app-config.json

Aggiungi il font nell'array `Fonts` del file `app-config.json`:

```json
{
  "AppConfig": {
    "Fonts": [
      {
        "Name": "Nome Font",
        "CssFile": "fonts/css/nome-font.css",
        "FontFamily": "'Nome Font', sans-serif"
      }
    ]
  }
}
```

### 6. Associa il font a un tema

Aggiungi la proprietà `FontName` al tema desiderato:

```json
{
  "Themes": [
    {
      "Name": "linkit-blue",
      "FontName": "Nome Font",
      "Variables": {
        ...
      }
    }
  ]
}
```

## Configurazione Font

### Parametri

**Name** (obbligatorio): Nome identificativo del font.

**CssFile** (opzionale): Percorso relativo ad `assets/` del file CSS contenente le dichiarazioni `@font-face`. Se omesso, si presume che il font sia già disponibile nel sistema o caricato esternamente.

**FontFamily** (obbligatorio): Valore CSS da applicare alla proprietà `font-family`. Può includere fallback fonts.

### Esempio con Font di Sistema

Per usare solo font di sistema senza file esterni:

```json
{
  "Name": "System Default",
  "FontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
}
```

### Esempio con Font Esterno (Google Fonts)

Se vuoi usare Google Fonts senza scaricare i file:

1. Non specificare `CssFile`
2. Aggiungi il link di Google Fonts nell'`index.html`

```json
{
  "Name": "Open Sans",
  "FontFamily": "'Open Sans', sans-serif"
}
```

E in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
```

## Note Tecniche

- Il sistema carica dinamicamente il CSS del font quando viene applicato un tema
- Se cambi tema con un font diverso, il CSS precedente viene sostituito
- I font vengono applicati a tutto il documento tramite la proprietà CSS `--font-family-base`
- Se un font non viene trovato nella configurazione, viene mostrato un warning nella console
- Usa `font-display: swap` nelle dichiarazioni `@font-face` per migliorare le performance di caricamento

## Best Practices

1. **Formato**: Usa `.woff2` come formato principale (ottima compressione e supporto moderno)
2. **Fallback**: Includi sempre `.woff` per browser più vecchi
3. **Pesi**: Includi solo i pesi che usi realmente (Regular 400 e Bold 700 sono solitamente sufficienti)
4. **Performance**: Considera di usare `font-display: swap` per evitare il FOIT (Flash of Invisible Text)
5. **Licenze**: Verifica sempre le licenze dei font prima di usarli in produzione

## Troubleshooting

**Il font non viene caricato:**
- Verifica che il percorso nel CSS sia corretto
- Controlla la console del browser per errori 404
- Assicurati che i file del font siano presenti nella directory corretta

**Il font appare diverso dal previsto:**
- Verifica che il valore di `FontFamily` corrisponda esattamente al nome nella dichiarazione `@font-face`
- Controlla che non ci siano conflitti con CSS globali

**Performance lente:**
- Riduci il numero di varianti del font (pesi e stili)
- Considera di usare solo formati `.woff2` se non hai bisogno di supportare browser molto vecchi
- Usa `font-display: swap` per il caricamento asincrono
