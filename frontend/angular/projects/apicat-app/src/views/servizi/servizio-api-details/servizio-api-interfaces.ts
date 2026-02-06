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
export interface Profile {
    auth_type: string;
    codice_interno: string;
    domini: string[];
    etichetta: string;
}

export interface CustomProperty {
    nome: string;
    etichetta: string;
    tipo: 'text' | 'select';
    required: boolean;
    valori?: {
        nome: string;
        etichetta: string;
        default?: boolean;
    }[];
    regular_expression?: string;
    vetrina?: {
        label: string;
        template: string;
    }
}
export interface CustomPropertyDefinition {
    nome_gruppo: string;
    label_gruppo: string;
    classe_dato: 'collaudo' | 'produzione' | 'generico';
    id_correlazione?: string;
    auth_type?: string[];
    profili?: string[];
    proprieta: CustomProperty[];
}

export interface IHistory {
    uuid: string;
    content_type: string;
    filename: string;
    versione: number;
}

export interface ApiAuthTypeGroup {
    resources: string[];
    profilo: string;
    note: string;
}

export interface ApiCustomProperty {
    gruppo: string;
    proprieta: {
        nome: string;
        valore: string;
    }[];
}

export interface ApiDefinitionUpdateWithReference {
    tipo_documento: 'uuid' | 'uuid_copia';
    uuid: string;
}

export interface ApiDefinitionUpdateWithFile {
    tipo_documento: 'nuovo',
    content_type: string;
    filename: string;
    content: string;
}

export interface ApiDefintionCreate {
    content_type: string;
    content: string;
    filename: string;
}

export interface ApiErogationData {
    url?: string;
    url_prefix?: string;
    nome_gateway?: string;
    versione_gateway?: number;
}

export interface ApiConfiguration {
    protocollo?: string;
    dati_erogazione: ApiErogationData;
    specifica?: ApiDefintionCreate | ApiDefinitionUpdateWithReference | ApiDefinitionUpdateWithFile | null;
}

export interface ApiCreateRequest {
    nome: string;
    versione: number;
    id_servizio: string;
    ruolo: string;
    descrizione: string;
    codice_asset: string;
    configurazione_collaudo: ApiConfiguration;
    configurazione_produzione?: ApiConfiguration;
    proprieta_custom: ApiCustomProperty[];
    gruppi_auth_type: ApiAuthTypeGroup[];
}

export interface ApiUpdateRequest {
    identificativo?: {
        nome: string;
        versione: number;
        ruolo: string;
    };
    dati_generici?: {
        descrizione: string;
        codice_asset: string;
        url_invocazione?: string;
    };
    dati_specifica?: {
        gruppi_auth_type: ApiAuthTypeGroup[];
    };
    dati_custom?: {
        proprieta_custom: ApiCustomProperty[];
    };
    configurazione_collaudo?: ApiConfiguration;
    configurazione_produzione?: ApiConfiguration;
}

export interface ApiDefintionRead {
    content_type: string;
    uuid: string;
    filename: string;
    versione: number;
    storico: IHistory[];
}

export interface ApiConfigurationRead {
    protocollo_dettaglio: string;
    protocollo: string;
    dati_erogazione: ApiErogationData;
    specifica?: ApiDefintionRead;
}

export interface ApiReadDetails {
    codice_asset: string;
    configurazione_collaudo?: ApiConfigurationRead;
    configurazione_produzione?: ApiConfigurationRead;
    descrizione: string;
    gruppi_auth_type?: ApiAuthTypeGroup[];
    id_api: string;
    nome: string;
    proprieta_custom: ApiCustomProperty[];
    ruolo: string;
    versione: number;
}