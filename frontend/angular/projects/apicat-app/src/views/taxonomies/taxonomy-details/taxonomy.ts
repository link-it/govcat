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

export interface Categoria { 
  id_tassonomia: string;
  id_categoria: string;
  id_categoria_padre?: string;
  nome: string;
  nome_tassonomia: string;
  descrizione?: string;
  immagine?: string;
  figli?: Array<Categoria>;
}

export class Taxonomy {

  id_tassonomia: string | null = null;
  nome: string | null = null;
  descrizione: string | null = null;
  visibile: boolean = false;
  obbligatorio: boolean = false;
  immagine?: string;
  categorie?: Array<Categoria>;

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
