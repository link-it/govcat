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
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** URL di invocazione aggiuntiva dell'API (configurazione, non risolta). */
export interface UrlInvocazioneAggiuntiva {
    etichetta: string;
    template_url?: string | null;
    url_prefix_collaudo?: string | null;
    url_prefix_produzione?: string | null;
}

/** URL di invocazione aggiuntiva risolta per un ambiente. */
export interface UrlInvocazioneAggiuntivaRisolta {
    etichetta: string;
    url_invocazione: string;
}

export const MAX_URL_AGGIUNTIVE = 10;

export type RigaUrlAggiuntiva = FormGroup<{
    etichetta: FormControl<string | null>;
    template_url: FormControl<string | null>;
    url_prefix_collaudo: FormControl<string | null>;
    url_prefix_produzione: FormControl<string | null>;
}>;

/** Etichette obbligatorie e univoche (case-insensitive) e numero massimo di righe. */
export const urlAggiuntiveValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const _righe = (control as FormArray).controls || [];
    const _visti = new Map<string, number>();
    const _duplicate: number[] = [];
    _righe.forEach((riga: AbstractControl, index: number) => {
        const _etichetta = (riga.get('etichetta')?.value || '').trim().toLowerCase();
        if (!_etichetta) { return; }
        if (_visti.has(_etichetta)) {
            _duplicate.push(index);
        } else {
            _visti.set(_etichetta, index);
        }
    });
    const _errors: ValidationErrors = {};
    if (_duplicate.length) { _errors['etichettaDuplicata'] = _duplicate; }
    if (_righe.length > MAX_URL_AGGIUNTIVE) { _errors['maxUrlAggiuntive'] = { max: MAX_URL_AGGIUNTIVE }; }
    return Object.keys(_errors).length ? _errors : null;
};

export function creaRigaUrlAggiuntiva(item?: Partial<UrlInvocazioneAggiuntiva> | null): RigaUrlAggiuntiva {
    return new FormGroup({
        etichetta: new FormControl<string | null>(item?.etichetta ?? null, [Validators.required, Validators.maxLength(255)]),
        template_url: new FormControl<string | null>(item?.template_url ?? null, [Validators.maxLength(255)]),
        url_prefix_collaudo: new FormControl<string | null>(item?.url_prefix_collaudo ?? null, [Validators.maxLength(255)]),
        url_prefix_produzione: new FormControl<string | null>(item?.url_prefix_produzione ?? null, [Validators.maxLength(255)])
    });
}

export function creaUrlAggiuntiveFormArray(items?: UrlInvocazioneAggiuntiva[] | null): FormArray<RigaUrlAggiuntiva> {
    return new FormArray<RigaUrlAggiuntiva>((items || []).map((item) => creaRigaUrlAggiuntiva(item)), [urlAggiuntiveValidator]);
}

/** Valori del form nel formato del BE: testi ripuliti, campi opzionali vuoti a null. */
export function urlAggiuntiveDaForm(valori: any[] | null | undefined): UrlInvocazioneAggiuntiva[] {
    const _testo = (valore: any): string | null => {
        const _v = (typeof valore === 'string') ? valore.trim() : '';
        return _v || null;
    };
    return (valori || []).map((valore: any) => ({
        etichetta: _testo(valore?.etichetta) || '',
        template_url: _testo(valore?.template_url),
        url_prefix_collaudo: _testo(valore?.url_prefix_collaudo),
        url_prefix_produzione: _testo(valore?.url_prefix_produzione)
    }));
}
