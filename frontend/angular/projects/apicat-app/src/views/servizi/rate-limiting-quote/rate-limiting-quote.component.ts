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
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormArray, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { RATE_LIMITING_PERIODI, RATE_LIMITING_PERIODO_LABEL, RateLimiting, RateLimitingPeriodo, periodiDisponibili } from '../rate-limiting';

/**
 * Quote complessive di rate limiting di un'API in un ambiente: una riga quota + periodo per
 * ogni periodo (al piu` una per periodo). Per le API PDND una sola quota, giornaliera.
 */
@Component({
    selector: 'app-rate-limiting-quote',
    templateUrl: 'rate-limiting-quote.component.html',
    styleUrls: ['rate-limiting-quote.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgSelectModule, TooltipModule]
})
export class RateLimitingQuoteComponent implements OnChanges, OnDestroy {
    private static _seq = 0;

    @Input({ required: true }) righe!: UntypedFormArray;
    @Input() soloGiornaliero: boolean = false;
    @Input() isEdit: boolean = false;

    readonly _idBase = `rate-limiting-${++RateLimitingQuoteComponent._seq}`;

    /** Periodi sceglibili per ogni riga: riferimenti stabili per `ng-select`, ricalcolati solo quando cambiano le righe. */
    _periodiRighe: RateLimitingPeriodo[][] = [];
    private _sub: Subscription | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['righe']) {
            this._sub?.unsubscribe();
            this._sub = this.righe?.valueChanges.subscribe(() => this._aggiornaPeriodi()) || null;
            this._aggiornaPeriodi();
        }
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    private _aggiornaPeriodi() {
        const _valori = this.righe?.getRawValue() || [];
        this._periodiRighe = _valori.map((_r: any, i: number) => {
            const _nuovi = periodiDisponibili(_valori, i);
            const _attuali = this._periodiRighe[i];
            return (_attuali && _attuali.length === _nuovi.length && _attuali.every((p, k) => p === _nuovi[k])) ? _attuali : _nuovi;
        });
    }

    /** Riga del form per una quota. */
    static creaRiga(quota: RateLimiting | null = null): FormGroup {
        return new FormGroup({
            quota: new FormControl<number | null>(quota?.quota ?? null, [Validators.required, Validators.min(1), Validators.pattern('^[0-9]+$')]),
            periodo: new FormControl<RateLimitingPeriodo | null>(quota?.periodo ?? null, [Validators.required])
        });
    }

    /** Riempie l'elenco con le quote salvate. */
    static carica(righe: UntypedFormArray, quote: RateLimiting[] | null | undefined) {
        righe.clear({ emitEvent: false });
        [...(quote || [])]
            .sort((a, b) => RATE_LIMITING_PERIODI.indexOf(a.periodo) - RATE_LIMITING_PERIODI.indexOf(b.periodo))
            .forEach((q: RateLimiting) => righe.push(RateLimitingQuoteComponent.creaRiga(q), { emitEvent: false }));
    }

    _label(periodo: any): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo as RateLimitingPeriodo] || periodo;
    }

    get _maxRighe(): number {
        return this.soloGiornaliero ? 1 : RATE_LIMITING_PERIODI.length;
    }

    get _puoAggiungere(): boolean {
        return this.righe.enabled && this.righe.length < this._maxRighe;
    }

    aggiungi() {
        if (!this._puoAggiungere) { return; }
        const _riga = RateLimitingQuoteComponent.creaRiga();
        const _liberi = periodiDisponibili(this.righe.getRawValue(), this.righe.length);
        _riga.get('periodo')?.setValue(this.soloGiornaliero ? 'giorno' : (_liberi[0] ?? null));
        this.righe.push(_riga);
        this.righe.markAsDirty();
    }

    rimuovi(indice: number) {
        this.righe.removeAt(indice);
        this.righe.markAsDirty();
    }

    _errore(indice: number, campo: string): boolean {
        const _ctrl = this.righe.at(indice)?.get(campo);
        return !!(_ctrl?.invalid && (_ctrl.dirty || _ctrl.touched));
    }

    /** Quote salvate in forma leggibile (es. "300 / giorno"), per la vista in sola lettura. */
    get _quoteLette(): Array<{ quota: number; periodo: RateLimitingPeriodo }> {
        return (this.righe.getRawValue() || []).filter((r: any) => r?.quota);
    }
}
