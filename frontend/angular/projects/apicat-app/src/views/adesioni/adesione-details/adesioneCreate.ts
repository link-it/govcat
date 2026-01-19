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


// import { ItemCategoria } from '@app/model/itemCategoria';
// import { DocumentoCreate } from '@app/model/documentoCreate';
import { ReferenteCreate } from '@app/model/referenteCreate';
import { VisibilitaEnum } from '@app/model/visibilitaEnum';

export class AdesioneCreate {
  id_logico: string | null = null;
  referenti: Array<ReferenteCreate> = [];
  
  visibilita: VisibilitaEnum | null = null;

  referente: string = '';
  referente_tecnico: string = '';

  servizio: string | null = null;
  id_servizio: string | null = null;

  soggetto: string | null = null;
  id_soggetto: string | null = null;

  organizzazione: string | null = null;
  id_organizzazione: string | null = null;

  servizio_nome: string | null = null;
  soggetto_nome: string | null = null;

  skip_collaudo: boolean = false;

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
