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
import { TipoServizioEnum } from '@app/model/tipoServizioEnum';

export interface Identificativo {
    nome: string | null;
    versione: string | null;
    dominio: string | null;
    id_dominio: string | null;
    visibilita: string | null;
    multi_adesione: boolean;
}

export interface DatiGenerici {
    gruppo: string | null;
    descrizione: string | null;
    descrizione_sintetica: string | null;
    termini_ricerca: string | null;
    note: string | null;
    tags: string[];
    tassonomie: any[];
    allegati: any[];
}

export interface DatiGenerici {
    allegati: any[];
}

export class Servizio {

    id_servizio: string | null = null;
    
    nome: string | null = null;
    versione: string | null = null;
    id_dominio: string | null = null;
    visibilita: string | null = null;
    multi_adesione: boolean = false;
    eliminabile: boolean = false;

    id_gruppo: string | null = null;
    descrizione: string | null = null;
    descrizione_sintetica: string | null = null;
    termini_ricerca: string | null = null;
    note: string | null = null;
    tags: string[] = [];
    tassonomie: any[] = [];
    allegati: any[] = [];

    stato: string = 'bozza';
    
    utente_richiedente: string = '';
    data_creazione: string = '';
    data_ultima_modifica: string = '';
    utente_ultima_modifica: string = '';

    immagine: any = null;

    label: string | null = null;
    classi: any[] = [];
    gruppo: any = null;
    dominio: any = null;

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
