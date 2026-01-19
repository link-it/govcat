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
import { VisibilitaEnum } from '@app/model/visibilitaEnum';


export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}


export interface SoggettoReferente {
  aderente: boolean; 
  id_soggetto: string | null;
  nome: string | null;
  organizzazione: Organizzazione;
  referente: boolean; 
}

export class Dominio {

  id_dominio: string | null = null;
  nome: string | null = null;
  // visibilita: VisibilitaEnum | null = null;
  visibilita: string | null = null;
  soggetto_referente: SoggettoReferente | null = null;
  descrizione: string | null = null;
  classi: any[] = [];
  tag: string | null = null;
  deprecato: boolean = false;

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
