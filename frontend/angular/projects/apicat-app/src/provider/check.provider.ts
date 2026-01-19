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
import { Injectable } from '@angular/core';

export enum ClassiEnum {
    GENERALE = 'generale',
    IDENTIFICATIVO = 'identificativo',
    REFERENTI = 'referenti',
    COLLAUDO = 'collaudo',
    PRODUZIONE = 'produzione',
    EROGAZIONI = 'erogazioni',
    CONFIGURAZIONI = 'configurazioni',
    PROFILO = 'Profilo',
    // Nuova struttura
    API = 'API',
    TASSONOMIA = 'tassonomia',
    CLIENT = 'client',
    EROGAZIONE = 'erogazione',
    CONFIGURAZIONE_GRUPPO = 'configurazione_gruppo',
    CONFIGURAZIONE_VALORE = 'configurazione_valore',
}

export interface CheckStructure {
    [key: string]: any;
};

export interface Sottotipo {
    tipo: string;
    identificativo: string;
};

export interface Campo {
    nome_campo: string;
    custom: boolean;
};

export interface Errore {
    dato: string;
    sottotipo?: Sottotipo[];
    params?: Record<string, string>;
    campi?: Campo[];
};

export interface DataStructure {
    esito: string;
    errori?: Errore[];
};

@Injectable({
    providedIn: 'root',
})
export class CkeckProvider {

    getObjectByDato(data: DataStructure, datoValue: string): Errore | undefined {
        return data?.errori?.find((obj: any) => obj.dato.includes(datoValue));
    }

    getObjectByDatoAndSottotipo(data: DataStructure, datoValue: string, sottotipo: Sottotipo): Errore | undefined {
        return data?.errori?.find(
            (obj: any) =>
                obj.dato.includes(datoValue) &&
                obj.sottotipo?.some(
                    (sub: any) => sub.tipo.toUpperCase() === sottotipo.tipo.toUpperCase()
                )
        );
    }

    getObjectByDatoAndTipoIdentificativo(data: DataStructure, datoValue: string, sottotipo: Sottotipo): Errore | undefined {
        return data?.errori?.find(
            (obj: any) =>
                obj.dato.includes(datoValue) &&
                obj.sottotipo?.some(
                    (sub: any) => (sub.tipo.toUpperCase() === sottotipo.tipo.toUpperCase()) && (sub.identificativo.toUpperCase() === sottotipo.identificativo.toUpperCase())
                )
        );
    }

    isSottotipoGroupCompleted(data: DataStructure, datoValue: string, sottotipo: string): boolean {
        // console.group('isSottotipoGroupCompleted');
        // console.log('datoValue', datoValue);
        // console.log('sottotipo', sottotipo);
        // console.log('getObjectByDatoAndSottotipo', this.getObjectByDatoAndSottotipo(data, datoValue, { tipo: sottotipo, identificativo: '' }));
        // console.groupEnd();
        return data?.esito === 'ok' || this.getObjectByDatoAndSottotipo(data, datoValue, { tipo: sottotipo, identificativo: '' }) === undefined;
    }

    isSottotipoCompleted(data: DataStructure, datoValue: string, tipo: string, identificativo: string): boolean {
        const obj = this.getObjectByDatoAndTipoIdentificativo(data, datoValue, { tipo: tipo, identificativo: identificativo });
        const sottotipoObj = obj?.sottotipo?.find((sub: any) => sub.identificativo === identificativo);
        // console.group('isSottotipoCompleted');
        // console.log('datoValue', datoValue);
        // console.log('tipo', tipo);
        // console.log('identificativo', identificativo);
        // console.log('getObjectByDatoAndTipoIdentificativo', obj);
        // console.log('sottotipoObj', sottotipoObj);
        // console.groupEnd();
        return data?.esito === 'ok' || sottotipoObj === undefined;
    }

}
