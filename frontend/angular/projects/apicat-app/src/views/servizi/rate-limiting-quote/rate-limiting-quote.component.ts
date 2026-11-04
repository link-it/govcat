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
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, UntypedFormArray, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import {
    RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RateLimiting, RateLimitingPeriodo, RegolaRateLimiting,
    periodiDisponibili, quotaModificabile
} from '../rate-limiting';
import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';

const QUOTA_VALIDATORS = [Validators.min(1), Validators.pattern('^[0-9]+$')];

/** Riga valida: almeno una quota e quota per fruitore non superiore alla quota totale. */
function rigaValidator(group: AbstractControl): ValidationErrors | null {
    const _valore = (group as FormGroup).getRawValue();
    const _quota = _valore.quota;
    const _fruitore = _valore.quota_fruitore;
    const _vuota = (v: any) => v === null || v === undefined || v === '';
    if (_vuota(_quota) && _vuota(_fruitore)) { return { quotaAssente: true }; }
    if (!_vuota(_quota) && !_vuota(_fruitore) && Number(_fruitore) > Number(_quota)) { return { fruitoreSuperiore: true }; }
    return null;
}

/**
 * Quote di rate limiting di un'API in un ambiente: una riga per periodo (al piu` una per periodo),
 * con quota totale e/o quota per fruitore secondo la regola dei profili dell'API.
 */
@Component({
    selector: 'app-rate-limiting-quote',
    templateUrl: 'rate-limiting-quote.component.html',
    styleUrls: ['rate-limiting-quote.component.scss'],
    standalone: true,
    imports: [LocaleNumberPipe, CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule, TooltipModule]
})
export class RateLimitingQuoteComponent implements OnChanges, OnDestroy {
    private static _seq = 0;

    @Input({ required: true }) righe!: UntypedFormArray;
    @Input({ required: true }) regola!: RegolaRateLimiting;
    @Input() isEdit: boolean = false;
    /** Ruoli dell'utente sul servizio, per le quote con `ruoli_abilitati`. */
    @Input() ruoli: string[] | null = null;

    readonly _idBase = `rate-limiting-${++RateLimitingQuoteComponent._seq}`;

    /** Periodi sceglibili per ogni riga: riferimenti stabili per `ng-select`, ricalcolati solo quando cambiano le righe. */
    _periodiRighe: RateLimitingPeriodo[][] = [];
    private _sub: Subscription | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['righe']) {
            this._sub?.unsubscribe();
            this._sub = this.righe?.valueChanges.subscribe(() => this._aggiornaPeriodi()) || null;
        }
        if (changes['righe'] || changes['regola']) {
            this._periodiRighe = [];
            this._aggiornaPeriodi();
        }
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    private _aggiornaPeriodi() {
        const _valori = this.righe?.getRawValue() || [];
        const _ammessi = this.regola?.periodi || [];
        this._periodiRighe = _valori.map((_r: any, i: number) => {
            const _nuovi = periodiDisponibili(_valori, i).filter((p: RateLimitingPeriodo) => _ammessi.includes(p));
            const _attuali = this._periodiRighe[i];
            return (_attuali && _attuali.length === _nuovi.length && _attuali.every((p, k) => p === _nuovi[k])) ? _attuali : _nuovi;
        });
    }

    /** Riga del form per le quote di un periodo. */
    static creaRiga(voce: RateLimiting | null = null): FormGroup {
        return new FormGroup({
            periodo: new FormControl<RateLimitingPeriodo | null>(voce?.periodo ?? null, [Validators.required]),
            quota: new FormControl<number | null>(voce?.quota ?? null, QUOTA_VALIDATORS),
            quota_fruitore: new FormControl<number | null>(voce?.quota_fruitore ?? null, QUOTA_VALIDATORS)
        }, { validators: rigaValidator });
    }

    /** Riempie l'elenco con le quote salvate. */
    static carica(righe: UntypedFormArray, quote: RateLimiting[] | null | undefined) {
        righe.clear({ emitEvent: false });
        [...(quote || [])]
            .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo))
            .forEach((q: RateLimiting) => righe.push(RateLimitingQuoteComponent.creaRiga(q), { emitEvent: false }));
    }

    /**
     * Abilita le righe secondo la regola e i ruoli dell'utente sul servizio: le quote non modificabili restano in
     * sola lettura; periodo, aggiunta e rimozione solo se tutte le quote previste sono modificabili.
     * Da chiamare dopo aver abilitato l'elenco (`righe.enable()`).
     */
    static applicaRegola(righe: UntypedFormArray, regola: RegolaRateLimiting, ruoli: string[] | null | undefined) {
        if (righe.disabled) { return; }
        const _totale = quotaModificabile(regola.quotaTotale, ruoli);
        const _fruitore = quotaModificabile(regola.quotaFruitore, ruoli);
        const _righe = RateLimitingQuoteComponent.righeModificabili(regola, ruoli);
        righe.controls.forEach((riga: AbstractControl) => {
            if (!_totale) { riga.get('quota')?.disable({ emitEvent: false }); }
            if (!_fruitore) { riga.get('quota_fruitore')?.disable({ emitEvent: false }); }
            if (!_righe || regola.periodi.length === 1) { riga.get('periodo')?.disable({ emitEvent: false }); }
        });
    }

    /** Si aggiungono e rimuovono righe solo se tutte le quote previste sono modificabili dall'utente. */
    static righeModificabili(regola: RegolaRateLimiting, ruoli: string[] | null | undefined): boolean {
        const _previste = [regola.quotaTotale, regola.quotaFruitore].filter(Boolean);
        return _previste.length > 0 && _previste.every((q) => quotaModificabile(q, ruoli));
    }

    get _periodoFisso(): boolean {
        return (this.regola?.periodi || []).length === 1;
    }

    _label(periodo: any): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo as RateLimitingPeriodo] || periodo;
    }

    get _puoAggiungere(): boolean {
        return this.righe.enabled
            && RateLimitingQuoteComponent.righeModificabili(this.regola, this.ruoli)
            && this.righe.length < (this.regola?.periodi || []).length;
    }

    get _puoRimuovere(): boolean {
        return this.righe.enabled && RateLimitingQuoteComponent.righeModificabili(this.regola, this.ruoli);
    }

    aggiungi() {
        if (!this._puoAggiungere) { return; }
        const _riga = RateLimitingQuoteComponent.creaRiga();
        const _liberi = periodiDisponibili(this.righe.getRawValue(), this.righe.length).filter((p) => this.regola.periodi.includes(p));
        _riga.get('periodo')?.setValue(_liberi[0] ?? null);
        if (this._periodoFisso) { _riga.get('periodo')?.disable(); }
        this.righe.push(_riga);
        this.righe.markAsDirty();
    }

    rimuovi(indice: number) {
        if (!this._puoRimuovere) { return; }
        this.righe.removeAt(indice);
        this.righe.markAsDirty();
    }

    _errore(indice: number, campo: string): boolean {
        const _ctrl = this.righe.at(indice)?.get(campo);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    /** Errore della riga (nessuna quota, quota per fruitore oltre la totale) dopo che l'utente l'ha toccata. */
    _erroreRiga(indice: number): string | null {
        const _riga = this.righe.at(indice);
        if (!_riga?.errors || !(_riga.dirty || _riga.touched)) { return null; }
        if (_riga.errors['fruitoreSuperiore']) { return 'APP.API.RATE_LIMITING.FruitoreSuperiore'; }
        if (_riga.errors['quotaAssente']) {
            if (!this.regola?.quotaFruitore) { return 'APP.API.RATE_LIMITING.QuotaTotaleAssente'; }
            if (!this.regola?.quotaTotale) { return 'APP.API.RATE_LIMITING.QuotaFruitoreAssente'; }
            return 'APP.API.RATE_LIMITING.QuotaAssente';
        }
        return null;
    }

    /** Quote salvate, per la vista in sola lettura. */
    get _quoteLette(): RateLimiting[] {
        return (this.righe.getRawValue() || []).filter((r: any) => r?.quota || r?.quota_fruitore);
    }
}
