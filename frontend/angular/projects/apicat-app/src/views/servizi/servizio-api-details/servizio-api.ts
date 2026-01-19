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
import { Allegato } from '@app/model/allegato';
import { APIErogazione } from '@app/model/aPIErogazione';
import { ProtocolloEnum } from '@app/model/protocolloEnum';
import { RuoloAPIEnum } from '@app/model/ruoloAPIEnum';
import { Documento } from '@app/model/documento';

import * as moment from 'moment';

export class ServizioApi {

  id_api: number | null = null;
  nome: string | null = null;
  versione: number | null = null;
  descrizione: RuoloAPIEnum | null = null;
  ruolo: string | null = '';
  codice_asset: string | null = null;
  protocollo: ProtocolloEnum | null = null;
  protocollo_dettaglio: string | null = null;
  profilo: any = null;
  allegati?: Array<Allegato>;
  specifica?: Documento;
  dati_erogazione?: APIErogazione;

  nome_gateway: string | null = null;
  gruppo_gateway: string | null = null;

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
