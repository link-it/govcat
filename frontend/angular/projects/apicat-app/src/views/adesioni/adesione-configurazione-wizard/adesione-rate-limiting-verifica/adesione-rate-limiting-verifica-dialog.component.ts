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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';
import { PillTab, PillTabsComponent } from '@app/components/lnk-ui/pill-tabs/pill-tabs.component';
import {
    ItemRateLimitingFruitore, RATE_LIMITING_PERIODO_LABEL, RateLimitingPeriodo, RateLimitingVerifica, RateLimitingVerificaApi, RateLimitingVerificaPeriodo
} from '@app/views/servizi/rate-limiting';
import { ColonnaFruitori, RateLimitingFruitoriComponent } from '@app/views/servizi/servizio-rate-limiting/rate-limiting-fruitori.component';

/** Resoconto della verifica del rate limiting di un'adesione da autorizzare, per API e periodo, con i fruitori. */
@Component({
    selector: 'app-adesione-rate-limiting-verifica-dialog',
    templateUrl: 'adesione-rate-limiting-verifica-dialog.component.html',
    styleUrls: ['adesione-rate-limiting-verifica-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, TranslateModule, LocaleNumberPipe, PillTabsComponent, RateLimitingFruitoriComponent]
})
export class AdesioneRateLimitingVerificaDialogComponent implements OnInit {
    // Valorizzati da `initialState` del BsModalService
    verifica: RateLimitingVerifica | null = null;
    esito: string = '';
    ambiente: 'collaudo' | 'produzione' = 'collaudo';
    sottotitolo: string = '';
    idServizio: string | null = null;
    idAdesione: string | null = null;
    mock: boolean = false;
    fruitoriMock: ItemRateLimitingFruitore[] | null = null;

    _apiSelezionata: RateLimitingVerificaApi | null = null;
    _tabs: PillTab[] = [];
    /** Colonne dei fruitori per l'API selezionata (riferimento stabile). */
    _colonne: ColonnaFruitori[] = [];

    constructor(public readonly bsModalRef: BsModalRef) {}

    ngOnInit(): void {
        const _api = this.verifica?.api || [];
        this.seleziona((_api.find((a) => this._apiCritica(a)) || _api[0])?.id_api || '');
        this._tabs = _api.map((a) => ({
            key: a.id_api,
            label: `${a.nome} v${a.versione}`,
            badge: this._apiCritica(a) ? { icon: 'bi-exclamation-triangle-fill', ariaLabel: 'APP.ADESIONI.RATE_LIMITING_VERIFICA.ChipSfora', tone: 'warning' } : undefined
        }));
    }

    /** API con almeno un periodo in cui la richiesta sfora la quota residua. */
    _apiCritica(api: RateLimitingVerificaApi): boolean {
        return api.rate_limiting.some((v) => v.sfora);
    }

    seleziona(idApi: string) {
        this._apiSelezionata = (this.verifica?.api || []).find((a) => a.id_api === idApi) || null;
        this._colonne = (this._apiSelezionata?.rate_limiting || []).map((v) => ({
            chiave: `${this._apiSelezionata!.id_api}|${v.periodo}`,
            id_api: this._apiSelezionata!.id_api,
            periodo: v.periodo,
            quota_fruitore: v.quota_fruitore
        }));
    }

    _label(periodo: RateLimitingPeriodo): string {
        return RATE_LIMITING_PERIODO_LABEL[periodo] || periodo;
    }

    /** Quota residua dopo l'autorizzazione (solo con quota totale e richiesta). */
    _residuaDopo(voce: RateLimitingVerificaPeriodo): number | null {
        return (voce.quota_residua !== undefined && voce.quota_residua !== null && voce.quota_richiesta)
            ? voce.quota_residua - voce.quota_richiesta
            : null;
    }

    get _sfora(): boolean {
        return this.verifica?.rientra === false;
    }

    chiudi() {
        this.bsModalRef.hide();
    }
}
