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

export interface ProprietaAudit {
  nome_gruppo: string;
  nome_proprieta: string;
  ambiente: string;
}

export const PARAMETRO_AUDIT = 'includi_audit';

/** Voce di menu e pagina Audit separate dalle transazioni: disattivate, le informazioni di audit sono nelle transazioni. */
export const MENU_AUDIT_ATTIVO = false;

const ERRORI_AUDIT = ['MON.404.AUDIT', 'MON.400.AUDIT.ID.API', 'MON.400.AUDIT.API'];

/** Errore del backend dovuto alla richiesta delle informazioni di audit. */
export function erroreAudit(error: any): boolean {
  return ERRORI_AUDIT.includes(error?.error?.detail);
}

/** Monitoraggio di audit abilitato nella configurazione. */
export function auditAbilitato(monitoraggio: any): boolean {
  return !!monitoraggio?.abilitato && monitoraggio?.audit_abilitato === true;
}

/** L'API ha l'audit nell'ambiente: una delle proprietà configurate per l'ambiente è valorizzata. */
export function apiConAudit(api: any, ambiente: string, proprietaAudit: ProprietaAudit[] | null | undefined): boolean {
  const _gruppi: any[] = api?.proprieta_custom || [];
  return (proprietaAudit || [])
    .filter((p: ProprietaAudit) => p.ambiente === ambiente)
    .some((p: ProprietaAudit) => _gruppi
      .filter((g: any) => g?.gruppo === p.nome_gruppo)
      .some((g: any) => (g.proprieta || [])
        .some((item: any) => item?.nome === p.nome_proprieta && `${item?.valore ?? ''}`.trim() !== '')));
}

/** L'API ha l'audit in almeno uno degli ambienti configurati. */
export function apiConAuditInAmbienti(api: any, proprietaAudit: ProprietaAudit[] | null | undefined): boolean {
  const _ambienti = [...new Set((proprietaAudit || []).map((p: ProprietaAudit) => p.ambiente))];
  return _ambienti.some((ambiente: string) => apiConAudit(api, ambiente, proprietaAudit));
}

/** Aggiunge il parametro di audit al path, se non è già presente. */
export function pathConAudit(path: string): string {
  if (new RegExp(`[?&]${PARAMETRO_AUDIT}=`).test(path)) {
    return path;
  }
  return `${path}${path.includes('?') ? '&' : '?'}${PARAMETRO_AUDIT}=true`;
}

/** Data di GovWay senza fuso orario (es. 2026-10-26T09:13:19.000): formattata senza conversioni, altrimenti il valore originale. */
export function formattaDataAudit(valore: any): string | null {
  if (valore === null || valore === undefined || valore === '') {
    return null;
  }
  const _match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/.exec(`${valore}`);
  if (!_match) {
    return `${valore}`;
  }
  const [, anno, mese, giorno, ore, minuti, secondi] = _match;
  return `${giorno}-${mese}-${anno} ${ore}:${minuti}:${secondi}`;
}

/** Campi di audit del dettaglio, con le date formattate. */
export function auditDettaglio(audit: any): any {
  if (!audit) {
    return null;
  }
  return {
    ...audit,
    issued_at: formattaDataAudit(audit.issued_at),
    not_before: formattaDataAudit(audit.not_before),
    expiration: formattaDataAudit(audit.expiration),
    altre_proprieta: (audit.altre_proprieta || []).filter((p: any) => p?.nome)
  };
}

/** Richiedente nella lista: l'utente dell'audit al posto della richiesta anonima, oppure tra parentesi dopo il richiedente. */
export function richiedenteConAudit(transazione: any): any {
  const _utente = `${transazione?.audit?.user_id ?? ''}`.trim();
  const _richiedente = transazione?.richiedente;
  return {
    richiedente_anonimo: (_richiedente || _utente) ? null : '?',
    utente_audit: (!_richiedente && _utente) ? _utente : null,
    richiedente_utente_audit: (_richiedente && _utente) ? `(${_utente})` : null
  };
}
