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

import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { OpenAPIService } from '@app/services/openAPI.service';
import { ambienteClasseDato } from './servizio-proprieta-custom';

/**
 * Disclaimer del servizio (GET /servizi/{id}/disclaimers). Stessa forma di AdesioneDisclaimer;
 * il campo `links` non e` prodotto dal BE e viene ignorato. La lista vuota e` uno stato normale.
 */
export type ServizioDisclaimerSeverity = 'INFO' | 'WARNING' | 'ERROR';
export type ServizioDisclaimerContesto = 'generale' | 'collaudo' | 'produzione';
export interface ServizioDisclaimer {
    disclaimer: string;
    contesto?: ServizioDisclaimerContesto;
    severity?: ServizioDisclaimerSeverity;
    profilo?: string;
    nome_gruppo?: string;
}

export function normalizeServizioDisclaimers(response: any): ServizioDisclaimer[] {
    if (!Array.isArray(response)) { return []; }
    return response
        .filter((d: any) => d && typeof d.disclaimer === 'string' && d.disclaimer.length > 0)
        .map((d: any) => ({
            disclaimer: d.disclaimer,
            contesto: d.contesto,
            severity: d.severity,
            profilo: d.profilo,
            nome_gruppo: d.nome_gruppo
        }));
}

/**
 * Disclaimer di un gruppo di proprieta` custom: stesso `nome_gruppo` e contesto uguale
 * all'ambiente del gruppo, oppure `generale` (valido ovunque compaia il gruppo).
 * Il `profilo` e` ignorato, come nel wizard delle adesioni.
 */
export function disclaimersDelGruppo(disclaimers: ServizioDisclaimer[] | null | undefined, nomeGruppo: string | null | undefined, ambiente: string | null | undefined): ServizioDisclaimer[] {
    if (!nomeGruppo) { return []; }
    return (disclaimers || []).filter((d: ServizioDisclaimer) => {
        if (d.nome_gruppo !== nomeGruppo) { return false; }
        const _contesto = d.contesto || 'generale';
        return _contesto === 'generale' || _contesto === ambiente;
    });
}

/**
 * Disclaimer delle proprieta` custom mostrate sotto un'intestazione di gruppo (piu' `nome_gruppo`
 * possono condividere la stessa etichetta). L'ambiente e` quello indicato o, se assente, la
 * classe dato della proprieta`. Senza duplicati, nell'ordine di arrivo.
 */
export function disclaimersDelleProprieta(disclaimers: ServizioDisclaimer[] | null | undefined, proprieta: any[] | null | undefined, ambiente?: string | null): ServizioDisclaimer[] {
    const _result: ServizioDisclaimer[] = [];
    (proprieta || []).forEach((p: any) => {
        disclaimersDelGruppo(disclaimers, p?.nome_gruppo, ambiente || ambienteClasseDato(p?.classe_dato)).forEach((d: ServizioDisclaimer) => {
            if (!_result.includes(d)) { _result.push(d); }
        });
    });
    return _result;
}

/**
 * Disclaimer di un profilo non legati a un gruppo di proprieta` custom. Contesto `generale`, uguale
 * all'ambiente indicato o, senza ambiente, qualsiasi.
 */
export function disclaimersDelProfilo(disclaimers: ServizioDisclaimer[] | null | undefined, profilo: string | null | undefined, ambiente?: string | null): ServizioDisclaimer[] {
    if (!profilo) { return []; }
    return (disclaimers || []).filter((d: ServizioDisclaimer) => {
        if (d.profilo !== profilo || d.nome_gruppo) { return false; }
        const _contesto = d.contesto || 'generale';
        return !ambiente || _contesto === 'generale' || _contesto === ambiente;
    });
}

/** Disclaimer da mostrare nel form API: senza profilo o con un profilo selezionato nel form. */
export function disclaimersDeiProfili(disclaimers: ServizioDisclaimer[] | null | undefined, profili: string[]): ServizioDisclaimer[] {
    return (disclaimers || []).filter((d: ServizioDisclaimer) => !d.profilo || profili.includes(d.profilo));
}

/**
 * Carica i disclaimer del servizio nella lingua corrente; errore o lista vuota -> [].
 * Con `profili` il BE aggiunge quelli dei profili indicati (es. scelti in un'API non ancora salvata).
 */
export function loadServizioDisclaimers(apiService: OpenAPIService, translate: TranslateService, sid: string, profili: string[] = []): Observable<ServizioDisclaimer[]> {
    const languageCode = translate.currentLang || translate.getDefaultLang() || 'it';
    const _params: { [param: string]: string | string[] } = { language_code: languageCode };
    if (profili.length) { _params['profilo'] = profili; }
    return apiService.getDetails('servizi', sid, 'disclaimers', { params: _params }).pipe(
        map((response: any) => normalizeServizioDisclaimers(response)),
        catchError(() => of([]))
    );
}
