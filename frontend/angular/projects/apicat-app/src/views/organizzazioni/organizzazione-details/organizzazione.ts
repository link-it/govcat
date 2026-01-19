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
import * as moment from 'moment';

interface Soggetto {
  id_soggetto: number | null;
  nome: string | null;
  aderente: boolean;
  referente: boolean;
}

export class Organizzazione {

  id_organizzazione: number | null = null;
  nome: string | null = null;
  descrizione: string | null = null;
  codice_ente: string | null = null;
  codice_fiscale_soggetto: string | null = null;
  id_tipo_utente: string | null = null;
  referente: boolean = false;
  aderente: boolean = false;
  esterna: boolean = false;
  cambio_esterna_consentito: boolean = false;

  vincola_aderente: boolean = false;
  vincola_referente: boolean = false;

  id_soggetto_default: string | null = null;

  soggetto_default: Soggetto | null = null;

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
