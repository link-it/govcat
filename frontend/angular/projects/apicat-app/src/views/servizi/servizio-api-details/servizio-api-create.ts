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
import { APIErogazione } from '@app/model/aPIErogazione';
import { DocumentoCreate } from '@app/model/documentoCreate';
import { ProtocolloEnum } from '@app/model/protocolloEnum';
import { RuoloAPIEnum } from '@app/model/ruoloAPIEnum';

export class ServizioApiCreate {

    id_api: string | null = null;
    nome: string | null = null;
    versione: number | null = null;
    id_servizio: string | null = null;
    ruolo: RuoloAPIEnum | null = null;
    protocollo: ProtocolloEnum | null = null;
    specifica?: DocumentoCreate;
    dati_erogazione?: APIErogazione;
    descrizione: string | null = null;
    codice_asset: string | null = null;

    filename: string | null = null;
    estensione: string | null = null;
    content: string | null = null;
    uuid: string | null = null;

    url_produzione: string | null = null;
    url_collaudo: string | null = null;

    proprieta_custom: any[] | null = null;

    nome_gateway: string | null = null;
    versione_gateway: string | null = null;

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
