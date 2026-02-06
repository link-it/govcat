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
export interface DominioCreateUpdateRequest {
    nome: string;
    visibilita: string;
    classi?: Classi[];
    id_soggetto_referente: string;
    soggetto_referente?: Soggettoreferente;
    id_dominio?: string;
    descrizione?: string;
    tag?: string;
    deprecato: boolean;
    url_invocazione?: string;
    url_prefix_collaudo?: string;
    url_prefix_produzione?: string;
    skip_collaudo: boolean;
}

export interface Classi {
    id_classe_utente: string;
    nome: string;
    descrizione: string;
}

export interface Soggettoreferente {
    id_soggetto: string;
    nome: string;
    descrizione: string;
    organizzazione: Organizzazione;
    referente: boolean;
    aderente: boolean;
    nome_gateway: string;
    tipo_gateway: string;
    url_invocazione?: string;
    url_prefix_collaudo?: string;
    url_prefix_produzione?: string;
}

export interface Organizzazione {
    id_organizzazione: string;
    nome: string;
    descrizione: string;
    codice_ente: string;
    codice_fiscale_soggetto: string;
    id_tipo_utente: string;
    soggetto_default: Soggettodefault;
    referente: boolean;
    aderente: boolean;
    multi_soggetto: boolean;
    esterna: boolean;
}

export interface Soggettodefault {
    id_soggetto: string;
    nome: string;
    descrizione: string;
    referente: boolean;
    aderente: boolean;
    nome_gateway: string;
    tipo_gateway: string;
}

