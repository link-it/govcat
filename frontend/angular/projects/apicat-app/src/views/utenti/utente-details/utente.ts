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
export interface ClassiUtente {
  id_classe_utente: string | null;
  nome: string | null;
}

export interface Organizzazione {
  id_organizzazione: string | null;
  // descrizione: string | null;
  nome: string | null;
}

/**
 * Issue 229 multi-org: shape locale dell'associazione utente-org
 * restituita dal BE in `Utente.organizzazioni[]`. Stub locale finche`
 * gli stub generati `src/model/utenteOrganizzazione.ts` non vengono
 * rigenerati dall'OpenAPI aggiornato.
 */
export interface UtenteOrganizzazioneShape {
  organizzazione: Organizzazione | null;
  ruolo_organizzazione: RuoloOrganizzazione | null;
}

export enum Ruolo {
  NESSUN_RUOLO = 'nessun_ruolo',
  GESTORE = 'gestore',
  /**
   * @deprecated Sostituito da `UTENTE_ORGANIZZAZIONE`. Mantenuto per
   * retrocompatibilita' lettura — non proporlo in nuove creazioni.
   */
  REFERENTE_SERVIZIO = 'referente_servizio',
  UTENTE_ORGANIZZAZIONE = 'utente_organizzazione',
  COORDINATORE = 'coordinatore'
}

export enum RuoloOrganizzazione {
  AMMINISTRATORE_ORGANIZZAZIONE = 'amministratore_organizzazione',
  OPERATORE_API = 'operatore_api'
}

export enum Stato {
  NON_CONFIGURATO = 'non_configurato',
  ABILITATO = 'abilitato',
  DISABILITATO = 'disabilitato',
  PENDING_UPDATE = 'pending_update'
}

export class Utente {

  id: number | null = null;
  id_utente: string | null = null;
  principal: string | null = null;
  nome: string | null = null;
  cognome: string | null = null;
  telefono: string | null = null;
  email: string | null = null;
  telefono_aziendale: string | null = null;
  email_aziendale: string | null = null;
  note: string | null = null;
  metadati: string | null = null;
  stato: Stato | null = null;
  ruolo: Ruolo | null = null;
  id_organizzazione: string | null = null;
  ruolo_organizzazione: RuoloOrganizzazione | null = null;
  // classi_utente: Array<any> = [];
  organizzazione: Organizzazione | null = null;
  /**
   * Issue 229 multi-org: associazioni dell'utente con organizzazioni
   * (ognuna con `ruolo_organizzazione`). Sostituisce il legacy mono-org
   * `organizzazione` nel nuovo schema BE.
   */
  organizzazioni: Array<UtenteOrganizzazioneShape> | null = null;
  organizzazione_esterna: string | null = null;
  organizzazione_pending: Organizzazione | null = null;
  /**
   * Issue 229 evolutiva 2: organizzazione di partenza del cambio
   * org (popolata dal BE in risposta a `PENDING_UPDATE`). Mostrata
   * accanto a `organizzazione_pending` nella UI di approvazione
   * per il messaggio "passaggio da X a Y". Stub locale: l'interfaccia
   * `Utente` in `src/model/utente.ts` (OpenAPI auto-generata) sara`
   * aggiornata al prossimo refresh BE.
   */
  organizzazione_partenza: Organizzazione | null = null;
  classi_utente: ClassiUtente | null = null;
  referente_tecnico: boolean = false;

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
