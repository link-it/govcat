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

/** Cambio di stato di un servizio o di un'adesione (`GET /{servizi|adesioni}/{id}/storico-stati`). */
export interface ItemStoricoStato {
  data: string;
  utente?: { nome?: string; cognome?: string } | null;
  /** Assente per la creazione. */
  stato_precedente?: string | null;
  stato: string;
}

export type ModuloStoricoStati = 'servizio' | 'adesione';

export const STATO_ARCHIVIATO = 'archiviato';

/** Voce "Storico degli stati" del menu di workflow (`AppConfig.Workflow.showStatusHistory`). */
export function storicoStatiAttivo(configurazione: any): boolean {
  return configurazione?.AppConfig?.Workflow?.showStatusHistory === true;
}

/** Storico di esempio al posto dell'API (`AppConfig.Workflow.statusHistoryMock`). */
export function storicoStatiMockAttivo(configurazione: any): boolean {
  return configurazione?.AppConfig?.Workflow?.statusHistoryMock === true;
}

/** Risorsa dello storico per il modulo del workflow, se l'entità ha un identificativo. */
export function risorsaStoricoStati(modulo: string, data: any): { model: string; id: string } | null {
  if (modulo === 'servizio' && data?.id_servizio) {
    return { model: 'servizi', id: data.id_servizio };
  }
  if (modulo === 'adesione' && data?.id_adesione) {
    return { model: 'adesioni', id: data.id_adesione };
  }
  return null;
}

export function nomeUtente(utente: ItemStoricoStato['utente']): string {
  return [utente?.nome, utente?.cognome].filter(Boolean).join(' ');
}

const UTENTI_MOCK = [
  { nome: 'Paolo', cognome: 'Rossi' },
  { nome: 'Laura', cognome: 'Bianchi' },
  { nome: 'Marco', cognome: 'Verdi' }
];

/**
 * Storico di esempio, dal più recente: dalla creazione allo stato corrente seguendo gli stati
 * successivi del workflow (per un'entità archiviata, fino allo stato precedente e poi l'archiviazione).
 */
export function storicoStatiMock(statoCorrente: string, workflow: any, statoPrecedente: string | null = null, adesso: Date = new Date()): ItemStoricoStato[] {
  const _cambi: any[] = workflow?.cambi_stato || [];
  const _archiviato = statoCorrente === STATO_ARCHIVIATO;
  const _obiettivo = _archiviato ? (statoPrecedente || '') : statoCorrente;
  const _percorso: string[] = [];
  let _stato: string | undefined = _cambi[0]?.stato_attuale || _obiettivo;
  while (_stato && !_percorso.includes(_stato)) {
    _percorso.push(_stato);
    if (_stato === _obiettivo) { break; }
    _stato = _cambi.find((c: any) => c.stato_attuale === _stato)?.stato_successivo?.nome;
  }
  if (_obiettivo && _percorso[_percorso.length - 1] !== _obiettivo) { _percorso.push(_obiettivo); }
  if (_archiviato) { _percorso.push(STATO_ARCHIVIATO); }

  const _voci: ItemStoricoStato[] = _percorso.map((stato: string, i: number) => ({
    stato,
    stato_precedente: i === 0 ? null : _percorso[i - 1],
    utente: UTENTI_MOCK[i % UTENTI_MOCK.length],
    data: ''
  }));
  // Un cambio ogni 1-3 giorni, a ritroso da adesso
  let _ms = adesso.getTime();
  for (let i = _voci.length - 1; i >= 0; i--) {
    _voci[i].data = new Date(_ms).toISOString();
    _ms -= ((i % 3) + 1) * 24 * 3600 * 1000 + (i % 5) * 3600 * 1000;
  }
  return _voci.reverse();
}
