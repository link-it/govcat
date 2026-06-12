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
 * Palette semantica per gli stati delle entita` (adesione, servizio,
 * ecc.) usata da `<lnk-stato-chip>` e, in prospettiva, da altri
 * componenti UI che devono comunicare lo stato di workflow.
 *
 * Single source of truth FE-side: rimpiazza il mapping keyword-based
 * fragile del vecchio chip (che usava `s.includes('produzione')` &
 * simili) con una tabella esplicita stato → variant.
 *
 * Le 7 varianti sono mappate ai design token globali in `app-view.scss
 * :root` (--ok-*, --warn-*, --info-*, --accent-*, --surface-*).
 *
 * Per gli stati NON listati la funzione `getStatoVariant` ritorna il
 * fallback `draft` (neutro grigio): conservativo, non colora
 * accidentalmente uno stato sconosciuto come "OK" o "errore".
 */
export type LnkStatoVariant =
  | 'draft'
  | 'pending'
  | 'in-progress'
  | 'test'
  | 'prod'
  | 'archived'
  | 'error';

export const STATO_VARIANT_MAP: Record<string, LnkStatoVariant> = {
  bozza: 'draft',
  nuovo: 'draft',
  nuova: 'draft',

  richiesto_collaudo: 'pending',
  richiesto_produzione: 'pending',
  richiesto_produzione_senza_collaudo: 'pending',
  autorizzato_collaudo: 'pending',
  autorizzata_collaudo: 'pending',
  autorizzato_produzione: 'pending',
  autorizzato_produzione_senza_collaudo: 'pending',
  processing: 'pending',
  pending: 'pending',
  pending_update: 'pending',
  non_configurato: 'pending',
  'non configurato': 'pending',

  in_configurazione_collaudo: 'in-progress',
  in_configurazione_automatica_collaudo: 'in-progress',
  in_configurazione_manuale_collaudo: 'in-progress',
  in_configurazione_produzione: 'in-progress',
  in_configurazione_produzione_senza_collaudo: 'in-progress',
  in_configurazione_automatica_produzione: 'in-progress',
  in_configurazione_manuale_produzione: 'in-progress',
  configurata_collaudo: 'in-progress',
  configurata_produzione: 'in-progress',
  config_in_progress: 'in-progress',

  pubblicato_collaudo: 'test',
  inviata_collaudo: 'test',
  inviata_produzione: 'test',

  pubblicato_produzione: 'prod',
  pubblicato_produzione_senza_collaudo: 'prod',
  chiusa: 'prod',
  active: 'prod',
  abilitato: 'prod',
  configurato: 'prod',

  archiviato: 'archived',
  archiviata: 'archived',
  disabilitato: 'archived',
  letta: 'archived',

  denied: 'error',
  bad_request: 'error',
  rejected: 'error',
  forbidden: 'error',
  profile_not_exists: 'error',
  sender_not_allowed: 'error',
};

export const STATO_VARIANT_FALLBACK: LnkStatoVariant = 'draft';

export function getStatoVariant(stato: string | null | undefined): LnkStatoVariant {
  if (!stato) return STATO_VARIANT_FALLBACK;
  return STATO_VARIANT_MAP[stato.toLowerCase()] ?? STATO_VARIANT_FALLBACK;
}
