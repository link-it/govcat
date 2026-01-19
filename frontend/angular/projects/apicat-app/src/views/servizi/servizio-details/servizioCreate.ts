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
import { ItemCategoria } from '@app/model/itemCategoria';
import { ReferenteCreate } from '@app/model/referenteCreate';
import { DocumentoCreate } from '@app/model/documentoCreate';
import { VisibilitaEnum } from '@app/model/visibilitaEnum';
import { TipoServizioEnum } from '@app/model/tipoServizioEnum';

export interface Organizzazione {
	id_organizzazione: string | null;
	nome: string | null;
}

export interface Soggetto {
	aderente: boolean;
	id_soggetto: string | null;
	nome: string | null;
	organizzazione: Organizzazione;
	referente: boolean;
}

export class ServizioCreate {
	nome: string = '';
	versione: string = '';
	id_dominio: string = '';
	id_gruppo: string = '';
	referenti: Array<ReferenteCreate> = [];
	descrizione: string = '';
	descrizione_sintetica: string = '';
	immagine: DocumentoCreate | null = null;
	tags: Array<string> | null = null;
	visibilita: VisibilitaEnum | null = null;
	tassonomie: Array<ItemCategoria> | null = null;
	termini_ricerca: string | null = null;
	note: string | null = null;
	multi_adesione: boolean = false;
	
	referente: string = '';
	referente_tecnico: string = '';
	
	classi: any[] = [];
	
	dominio: any = null;
	gruppo: any = null;

	stato: string = 'bozza';
	adesione_disabilitata: boolean = false;
	
	id_organizzazione_interna: number | null = null;
	id_soggetto_interno: number | null = null;
	soggetto_interno: any = null;

	package: boolean = false;

	tipo: TipoServizioEnum = TipoServizioEnum.API;

	skip_collaudo: boolean = false;
	vincola_skip_collaudo: boolean = false;

	fruizione: boolean = false;

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
