/**
 * MODI - APICatalogo
 * Registrazione e Adesione alle API
 *
 * Interfacce per il flusso di registrazione utente (first-login)
 */

export type StatoRegistrazioneEnum =
  | 'IN_ATTESA_CONFERMA'
  | 'CODICE_INVIATO'
  | 'EMAIL_VERIFICATA'
  | 'COMPLETATA';

export const StatoRegistrazioneEnum = {
  InAttesaConferma: 'IN_ATTESA_CONFERMA' as StatoRegistrazioneEnum,
  CodiceInviato: 'CODICE_INVIATO' as StatoRegistrazioneEnum,
  EmailVerificata: 'EMAIL_VERIFICATA' as StatoRegistrazioneEnum,
  Completata: 'COMPLETATA' as StatoRegistrazioneEnum
};

export interface StatoRegistrazione {
  stato: StatoRegistrazioneEnum;
  email_jwt?: string;
  email_proposta?: string;
  nome?: string;
  cognome?: string;
  codice_fiscale?: string;
  codice_inviato?: boolean;
  tentativi_verifica_rimanenti?: number;
  tentativi_invio_rimanenti?: number;
}

export interface ModificaEmailRequest {
  email: string;
}

export interface VerificaCodiceRequest {
  codice: string;
}

export type EsitoRegistrazioneEnum = 'NUOVO_UTENTE' | 'UTENTE_ESISTENTE';

export const EsitoRegistrazioneEnum = {
  NuovoUtente: 'NUOVO_UTENTE' as EsitoRegistrazioneEnum,
  UtenteEsistente: 'UTENTE_ESISTENTE' as EsitoRegistrazioneEnum
};

export interface RegistrazioneResponse {
  esito?: EsitoRegistrazioneEnum;
  messaggio?: string;
  profilo?: any;
  scadenza_secondi?: number;
  tentativi_rimanenti?: number;
}

export interface VerificaCodiceResponse {
  esito: boolean;
  messaggio?: string;
  tentativi_rimanenti?: number;
}
