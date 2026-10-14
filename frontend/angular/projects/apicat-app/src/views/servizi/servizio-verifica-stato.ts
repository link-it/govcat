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
/** Esito del check-dati del servizio per uno stato (`GET /servizi/{id}/check-dati/{stato}`). */
export interface EsitoVerificaServizio {
    esito: 'ok' | 'ko';
    errori: any[];
}

/** Transizione da verificare: la principale, coerente con `skip_collaudo`. */
export function transizioneDaVerificare(cambioStato: any, skipCollaudo: boolean): { nome: string; tipo: 'stato_successivo' | 'stati_ulteriori'; ruoli: string[] } | null {
    const _successivo = cambioStato?.stato_successivo || null;
    let _stato: any = _successivo;
    let _tipo: 'stato_successivo' | 'stati_ulteriori' = 'stato_successivo';
    if (skipCollaudo && !_successivo?.nome?.includes('senza_collaudo')) {
        const _senzaCollaudo = (cambioStato?.stati_ulteriori || []).find((s: any) => s?.nome?.includes('senza_collaudo'));
        if (_senzaCollaudo) {
            _stato = _senzaCollaudo;
            _tipo = 'stati_ulteriori';
        }
    }
    if (!_stato?.nome) { return null; }
    return { nome: _stato.nome, tipo: _tipo, ruoli: _stato.ruoli_abilitati || [] };
}

function _errori(esito: EsitoVerificaServizio | null): any[] {
    return esito?.esito === 'ko' ? (esito.errori || []) : [];
}

// Classi dato che riguardano le API (anche senza sottotipo, es. nessuna API definita)
const DATI_API = ['api', 'specifica', 'collaudo', 'produzione', 'collaudo_configurato', 'produzione_configurato', 'collaudo_pdnd', 'produzione_pdnd'];

function _isErroreApi(errore: any): boolean {
    return (errore?.sottotipo || []).some((s: any) => s?.tipo === 'api') || DATI_API.includes(errore?.dato);
}

/** Sezione della fase Informazioni generali con dati da completare. */
export function sezioneDaCompletare(esito: EsitoVerificaServizio | null, sezione: 'info_generali' | 'referenti'): boolean {
    const _dati = (sezione === 'referenti') ? ['referenti'] : ['identificativo', 'generico'];
    return _errori(esito).some((e: any) => _dati.includes(e?.dato) && !_isErroreApi(e));
}

/** Almeno un'API (o l'elenco delle API) con dati da completare. */
export function apiSezioneDaCompletare(esito: EsitoVerificaServizio | null): boolean {
    return _errori(esito).some((e: any) => _isErroreApi(e));
}

/** API con dati da completare. */
export function apiDaCompletare(esito: EsitoVerificaServizio | null, idApi: string | null | undefined): boolean {
    if (!idApi) { return false; }
    return _errori(esito).some((e: any) => (e?.sottotipo || []).some((s: any) => s?.tipo === 'api' && s?.identificativo === idApi));
}
