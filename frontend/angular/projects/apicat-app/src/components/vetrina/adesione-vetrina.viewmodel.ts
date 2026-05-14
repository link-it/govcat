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
import { LnkRefItem } from './refs.component';

/**
 * Coppia chiave/valore (key/value) renderizzata nei pannelli
 * espandibili (auth, endpoint). Mappa il vecchio `KV` del mock.
 */
export interface VetrinaKV {
  /** Etichetta umana (i18n gia` localizzato). */
  k: string;
  /** Valore; `null`/`undefined` -> mostra placeholder "non specificato". */
  v: string | null | undefined;
  /** Render in font mono. */
  mono?: boolean;
  /** Mostra bottone "copia". */
  copy?: boolean;
  /** Valore esplicitamente vuoto (forza placeholder). */
  empty?: boolean;
}

/** Modalita` di autenticazione (un client) per il pannello vetrina. */
export interface VetrinaAuthEntry {
  /** Identificativo del client (es. nome). */
  nome: string;
  /** Profilo / etichetta auth (es. PDND, OAuth). */
  profilo: string;
  /** Lista coppie chiave/valore. */
  kv: VetrinaKV[];
  /** Cert da scaricare (auth + firma) — il template usa il link diretto. */
  authCertificate?: { uuid: string; filename: string } | null;
  signCertificate?: { uuid: string; filename: string } | null;
  canDownloadAuthCertificate?: boolean;
  canDownloadSignCertificate?: boolean;
}

/** Endpoint erogazione per il pannello vetrina. */
export interface VetrinaEndpointEntry {
  nome: string;
  ver: string;
  kv: VetrinaKV[];
}

/**
 * View Model dell'adesione per la pagina vetrina. Costruito via
 * `toAdesioneVetrinaVM()` a partire dal modello reale + risorse
 * caricate (referenti, clients, erogazioni).
 */
export interface AdesioneVetrinaVM {
  id: string;
  servizioNome: string;
  versione: string;
  ente: string;
  stato: string;
  /** Data registrazione gia` formattata (es. "03.06.2024"). */
  registrata: string;
  /** "Nome Cognome" del richiedente, fallback string vuota. */
  registrataDa: string;
  descrizione: string;
  /** Variante illustrazione hero (oggi da config/feature flag). */
  immagine: 'welfare' | 'welfare-blue';
  /** Lista referenti (gia` deduplicati lato caller). */
  referenti: LnkRefItem[];
  /** Pannelli auth dell'ambiente corrente. */
  auth: VetrinaAuthEntry[];
  /** Pannelli endpoint dell'ambiente corrente. */
  endpoints: VetrinaEndpointEntry[];
}

/** Input minimale per il mapper — adatto allo shape di `Adesione`
 *  caricata da `AdesioneViewComponent`. */
export interface ToAdesioneVetrinaInput {
  adesione: {
    id_adesione: string;
    data_creazione: string | null | undefined;
    utente_richiedente?: { nome?: string | null; cognome?: string | null } | null;
    soggetto?: { organizzazione?: { nome?: string | null } | null } | null;
    servizio?: { nome?: string | null; versione?: string | null; descrizione_sintetica?: string | null } | null;
    stato: string;
  };
  referenti: LnkRefItem[];
  auth: VetrinaAuthEntry[];
  endpoints: VetrinaEndpointEntry[];
  /** Variante illustrazione hero — opzionale, default `welfare`. */
  immagine?: 'welfare' | 'welfare-blue';
  /** Formato data (default `dd.MM.yyyy`). */
  dateFormat?: string;
}

/**
 * Formatta una data ISO/string nel formato richiesto. Implementazione
 * stand-alone (niente DatePipe per evitare locale providers nei mapper).
 * In caso di stringa non parsabile ritorna la stringa originale.
 */
function _formatDate(iso: string | null | undefined, fmt: string = 'dd.MM.yyyy'): string {
  if (!iso) { return ''; }
  const d = new Date(iso);
  if (isNaN(d.getTime())) { return iso; }
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return fmt
    .replace('dd', pad(d.getDate()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('yyyy', '' + d.getFullYear());
}

/**
 * Pure function: produce l'`AdesioneVetrinaVM` dato il modello reale
 * + i dati gia` aggregati. Non chiama servizi e non genera side
 * effects — testabile in isolamento.
 */
export function toAdesioneVetrinaVM(input: ToAdesioneVetrinaInput): AdesioneVetrinaVM {
  const a = input.adesione;
  const ur = a.utente_richiedente;
  const richiedenteNome = ur ? `${ur.nome ?? ''} ${ur.cognome ?? ''}`.trim() : '';
  return {
    id: a.id_adesione,
    servizioNome: a.servizio?.nome ?? '',
    versione: a.servizio?.versione ? `v.${a.servizio.versione}` : '',
    ente: a.soggetto?.organizzazione?.nome ?? '',
    stato: a.stato,
    registrata: _formatDate(a.data_creazione, input.dateFormat),
    registrataDa: richiedenteNome,
    descrizione: a.servizio?.descrizione_sintetica ?? '',
    immagine: input.immagine ?? 'welfare',
    referenti: input.referenti,
    auth: input.auth,
    endpoints: input.endpoints,
  };
}
