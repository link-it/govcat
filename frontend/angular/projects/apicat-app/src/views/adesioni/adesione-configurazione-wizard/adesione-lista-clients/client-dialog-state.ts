/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Stato puro della dialog di configurazione dell'autenticazione client
 * (Issue #237 - Fase 1).
 *
 * Questo modulo non dipende da Angular, dal DOM o da servizi: dati un input
 * esplicito (scenario + auth type + certificate mode + grant + liste) ritorna
 * una configurazione UI deterministica. Lo scopo e' sostituire le 27+ boolean
 * flag sparse nel componente con un'unica funzione pura testabile.
 *
 * NON e' ancora collegato al template: la Fase 3 lo cablera' al modale inline.
 */

// -----------------------------------------------------------------------------
// Discriminated unions
// -----------------------------------------------------------------------------

/**
 * 12 varianti di auth type supportate dal backend.
 * Fonte: `_checkAndSetAuthTypeCase` in adesione-lista-clients.component.ts.
 */
export type AuthType =
  | 'no_dati'
  | 'indirizzo_ip'
  | 'http_basic'
  | 'https'
  | 'https_sign'
  | 'pdnd'
  | 'https_pdnd'
  | 'https_pdnd_sign'
  | 'oauth_authorization_code'
  | 'oauth_client_credentials'
  | 'sign'
  | 'sign_pdnd';

/**
 * Uno dei 5 scenari di apertura della dialog. Vedi PIANO-LAVORO §2.
 *
 * - `new`: nuovo client (scenario A). Form completo editabile.
 * - `proposed`: nome proposto (scenario B). Solo campo nome_proposto.
 * - `referenced`: client selezionato da dropdown (scenario C). Form disabilitato.
 * - `edit`: client gia' CONFIGURATO in modifica (scenario D). Form editabile precompilato.
 * - `readonly`: qualsiasi client senza permessi di scrittura (scenario E). Tutto disabled.
 */
export type Scenario =
  | { kind: 'new' }
  | { kind: 'proposed' }
  | { kind: 'referenced'; referencedClientId: number | string }
  | { kind: 'edit' }
  | { kind: 'readonly' };

/**
 * Modalita' di certificato (auth o firma). `none` indica che l'auth type
 * corrente non richiede certificato di quel tipo.
 */
export type CertificateMode =
  | { kind: 'none' }
  | { kind: 'fornito' }
  | { kind: 'richiesto_cn' }
  | { kind: 'richiesto_csr' };

/**
 * Modalita' di presentazione del selettore delle credenziali.
 * - `toggle`: due bottoni (Nuove credenziali / Client gia' censito).
 * - `dropdown`: select con la lista dei client riutilizzabili.
 */
export type CredentialsMode = 'toggle' | 'dropdown';

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ClientDialogInput {
  scenario: Scenario;
  authType: AuthType;
  certAuth: CertificateMode;
  certSign: CertificateMode;
  isModifiable: boolean;
  credentialsMode: CredentialsMode;
  riusoObbligatorio: boolean;
  /** Numero di client riutilizzabili disponibili (serve ad auto-selezione). */
  clientsRiusoCount: number;
  /**
   * Flag derivati dalla configurazione del tipo di autorizzazione
   * (`adesione-config.json` — campi `indirizzi_ip`, `rate_limiting`, `finalita`).
   */
  showIpFruizione: boolean;
  showRateLimiting: boolean;
  showFinalita: boolean;
}

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

export interface FieldState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

export type FormFieldKey =
  | 'credenziali'
  | 'nome'
  | 'nome_proposto'
  | 'descrizione'
  | 'ip_fruizione'
  | 'rate_limiting'
  | 'finalita'
  | 'client_id'
  | 'username'
  | 'url_redirezione'
  | 'url_esposizione'
  | 'help_desk'
  | 'nome_applicazione_portale'
  | 'tipo_certificato'
  | 'tipo_certificato_firma';

export type FieldsConfig = Record<FormFieldKey, FieldState>;

export interface CertBlockConfig {
  visible: boolean;
  mode: CertificateMode;
  /** Valore CN richiesto obbligatorio se `mode.kind === 'richiesto_cn'`. */
  cnRequired: boolean;
  /** File certificato richiesto obbligatorio se `mode.kind === 'fornito' | 'richiesto_csr'`. */
  fileRequired: boolean;
  /** Modulo richiesta obbligatorio se `mode.kind === 'richiesto_csr'`. */
  moduloRequired: boolean;
}

export interface FormConfig {
  scenario: Scenario;
  authType: AuthType;
  credentialsMode: CredentialsMode;
  fields: FieldsConfig;
  certAuth: CertBlockConfig;
  certSign: CertBlockConfig;
  save: { enabled: boolean };
  /** Opzioni disponibili nel selettore credenziali (a monte della UI). */
  credentialsOptions: {
    showNuoveCredenziali: boolean;
    showUsaClientEsistente: boolean;
    showClientList: boolean;
  };
  /**
   * Indica se il "corpo" del form (nome, descrizione, cert, ecc.) e' visibile.
   * Falso in scenario `proposed` dove l'utente sta solo proponendo un nome.
   * Equivalente funzionale dell'ex-flag `_show_client_form`.
   */
  showClientFormBody: boolean;
  /** Blocco "Client ID PDND" (PDND variants). */
  showPdndClientIdBlock: boolean;
  /** Blocco "Username" (auth http_basic in scenario edit/readonly). */
  showHttpBasicUsernameBlock: boolean;
  /** Blocco "Client ID" per oauth_client_credentials in scenario edit/readonly. */
  showOauthClientCredentialsBlock: boolean;
  /** Blocco "Client ID" nested dentro OAuth Auth Code, visibile in edit/readonly. */
  showOauthAuthCodeClientIdBlock: boolean;
}

// -----------------------------------------------------------------------------
// Predicati auth type
// -----------------------------------------------------------------------------

const AUTH_WITH_CERT_AUTH: readonly AuthType[] = [
  'https',
  'https_sign',
  'https_pdnd',
  'https_pdnd_sign',
];

const AUTH_WITH_CERT_SIGN: readonly AuthType[] = [
  'https_sign',
  'https_pdnd_sign',
  'sign',
  'sign_pdnd',
];

const AUTH_REQUIRES_CLIENT_ID: readonly AuthType[] = [
  'pdnd',
  'https_pdnd',
  'https_pdnd_sign',
  'sign_pdnd',
  'oauth_client_credentials',
];

const AUTH_PDND_VARIANTS: readonly AuthType[] = [
  'pdnd',
  'https_pdnd',
  'https_pdnd_sign',
  'sign_pdnd',
];

const AUTH_WITH_OAUTH_URLS: readonly AuthType[] = [
  'oauth_authorization_code',
];

export function authRequiresCertAuth(authType: AuthType): boolean {
  return AUTH_WITH_CERT_AUTH.includes(authType);
}

export function authRequiresCertSign(authType: AuthType): boolean {
  return AUTH_WITH_CERT_SIGN.includes(authType);
}

export function authRequiresClientId(authType: AuthType): boolean {
  return AUTH_REQUIRES_CLIENT_ID.includes(authType);
}

/** Varianti dell'auth type che mostrano il blocco "Client ID PDND". */
export function authIsPdndVariant(authType: AuthType): boolean {
  return AUTH_PDND_VARIANTS.includes(authType);
}

export function authRequiresOauthUrls(authType: AuthType): boolean {
  return AUTH_WITH_OAUTH_URLS.includes(authType);
}

export function authRequiresUsername(authType: AuthType): boolean {
  return authType === 'http_basic';
}

// -----------------------------------------------------------------------------
// computeFormConfig
// -----------------------------------------------------------------------------

/**
 * Funzione pura: dato un input ritorna la configurazione UI completa.
 *
 * Regole chiave:
 * - In `readonly` tutti i campi sono disabilitati e Save non disponibile.
 * - In `proposed` solo `nome_proposto` e `credenziali` sono attivi.
 * - In `referenced` i campi visibili (client_id, nome, descrizione, cert, ecc.)
 *   sono precompilati ma disabilitati; Save abilitato perche' riferisce un client.
 * - In `new` ed `edit` i campi seguono l'auth type e lo stato dei certificati.
 * - I validator `required` vengono applicati solo ai campi enabled+required.
 */
export function computeFormConfig(input: ClientDialogInput): FormConfig {
  const { scenario, authType, isModifiable, credentialsMode, riusoObbligatorio, clientsRiusoCount } = input;

  const isReadonly = scenario.kind === 'readonly' || !isModifiable;
  const isProposed = scenario.kind === 'proposed';
  const isReferenced = scenario.kind === 'referenced';
  const isNew = scenario.kind === 'new';
  const isEdit = scenario.kind === 'edit';

  const editableScenario = !isReadonly && (isNew || isEdit);
  const showFormBody = !isProposed; // in `proposed` si nasconde il corpo del form

  const requiresCertAuth = authRequiresCertAuth(authType);
  const requiresCertSign = authRequiresCertSign(authType);
  const requiresClientId = authRequiresClientId(authType);
  const requiresOauthUrls = authRequiresOauthUrls(authType);
  const requiresUsername = authRequiresUsername(authType);

  const field = (visible: boolean, enabled: boolean, required: boolean): FieldState => ({
    visible,
    enabled: visible && enabled && !isReadonly,
    required: visible && enabled && required && !isReadonly,
  });

  const fields: FieldsConfig = {
    // il selettore credenziali e' sempre visibile tranne in `edit` (quel caso
    // non offre cambi di scenario dentro la dialog) e in `readonly`
    credenziali: field(!isEdit && !isReadonly, true, false),

    // nome: obbligatorio solo in `new`
    nome: field(showFormBody, editableScenario && isNew, isNew),

    // nome_proposto: visibile e richiesto solo in `proposed`
    nome_proposto: field(isProposed, !isReadonly, true),

    descrizione: field(showFormBody, editableScenario, false),
    ip_fruizione: field(showFormBody && input.showIpFruizione, editableScenario, false),
    rate_limiting: field(showFormBody && input.showRateLimiting, editableScenario, false),
    finalita: field(showFormBody && input.showFinalita, editableScenario, false),

    client_id: field(
      showFormBody && (requiresClientId || requiresOauthUrls),
      editableScenario,
      requiresClientId,
    ),

    username: field(showFormBody && requiresUsername, editableScenario, requiresUsername),

    url_redirezione: field(showFormBody && requiresOauthUrls, editableScenario, requiresOauthUrls),
    url_esposizione: field(showFormBody && requiresOauthUrls, editableScenario, requiresOauthUrls),
    help_desk: field(showFormBody && requiresOauthUrls, editableScenario, false),
    nome_applicazione_portale: field(showFormBody && requiresOauthUrls, editableScenario, false),

    tipo_certificato: field(showFormBody && requiresCertAuth, editableScenario, requiresCertAuth),
    tipo_certificato_firma: field(showFormBody && requiresCertSign, editableScenario, requiresCertSign),
  };

  const certAuth: CertBlockConfig = buildCertBlock(
    requiresCertAuth && showFormBody,
    input.certAuth,
    isReadonly || isReferenced,
  );

  const certSign: CertBlockConfig = buildCertBlock(
    requiresCertSign && showFormBody,
    input.certSign,
    isReadonly || isReferenced,
  );

  // Save abilitato: non readonly + scenario noto.
  // In `new` servira' anche form valido; questa funzione non lo sa ancora.
  const saveEnabled = !isReadonly;

  // Opzioni del selettore credenziali.
  // `riuso_obbligatorio=true` + lista non vuota nasconde "Nuove credenziali".
  const hasClients = clientsRiusoCount > 0;
  const hideNuoveCredenziali = riusoObbligatorio && hasClients;

  const credentialsOptions = credentialsMode === 'toggle'
    ? {
        showNuoveCredenziali: !hideNuoveCredenziali,
        showUsaClientEsistente: true,
        showClientList: false,
      }
    : {
        showNuoveCredenziali: !hideNuoveCredenziali,
        showUsaClientEsistente: false,
        showClientList: hasClients,
      };

  // Scenario in stato "gia' configurato": edit o readonly (il client ha
  // `source.stato === CONFIGURATO` nel template via `_isConfiguratoMapper`).
  const isConfigurato = isEdit || isReadonly;

  // `_show_client_form` storicamente era false solo nei sottostati in cui
  // l'utente non aveva ancora un client o un nome proposto su cui costruire
  // il form. Approssimato con "tutto tranne proposed".
  const showClientFormBody = !isProposed;

  const showPdndClientIdBlock = showClientFormBody && authIsPdndVariant(authType);
  const showHttpBasicUsernameBlock = showClientFormBody && requiresUsername && isConfigurato;
  const showOauthClientCredentialsBlock = showClientFormBody && authType === 'oauth_client_credentials' && isConfigurato;
  const showOauthAuthCodeClientIdBlock = showClientFormBody && requiresOauthUrls && isConfigurato;

  return {
    scenario,
    authType,
    credentialsMode,
    fields,
    certAuth,
    certSign,
    save: { enabled: saveEnabled },
    credentialsOptions,
    showClientFormBody,
    showPdndClientIdBlock,
    showHttpBasicUsernameBlock,
    showOauthClientCredentialsBlock,
    showOauthAuthCodeClientIdBlock,
  };
}

function buildCertBlock(
  visible: boolean,
  mode: CertificateMode,
  locked: boolean,
): CertBlockConfig {
  if (!visible) {
    return {
      visible: false,
      mode: { kind: 'none' },
      cnRequired: false,
      fileRequired: false,
      moduloRequired: false,
    };
  }

  const cnRequired = !locked && mode.kind === 'richiesto_cn';
  const fileRequired = !locked && (mode.kind === 'fornito' || mode.kind === 'richiesto_csr');
  const moduloRequired = !locked && mode.kind === 'richiesto_csr';

  return {
    visible: true,
    mode,
    cnRequired,
    fileRequired,
    moduloRequired,
  };
}
