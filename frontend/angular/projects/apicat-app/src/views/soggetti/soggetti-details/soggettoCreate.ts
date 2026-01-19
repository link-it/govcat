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

import { TipoGateway } from './soggetto';

export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}

export class SoggettoCreate {

  id_soggetto: string | null = '';
  aderente: boolean = false;
  referente: boolean = false;
  nome: string | null = '';
  id_organizzazione: string | null = '';
  organizzazione: Organizzazione | null = {id_organizzazione: '', nome: ''};

  descrizione: string | null = '';
  // codice_ente: string | null = null;
  // codice_fiscale_soggetto: string | null = null;
  // id_tipo_utente: string | null = null;

  nome_gateway: string | null = null;
  tipo_gateway: TipoGateway | null = null;

  url_invocazione: string | null = null;
  url_prefix_collaudo: string | null = null;
  url_prefix_produzione: string | null = null;

  skip_collaudo: boolean = false;
  vincola_skip_collaudo: boolean = false;

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
