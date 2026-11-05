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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { HttpContext } from '@angular/common/http';
import { BsModalService } from 'ngx-bootstrap/modal';
import { catchError, forkJoin, map, of } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { DISABLE_GLOBAL_EXCEPTION_HANDLING } from '@app/lib/interceptors/error.interceptor';
import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { ItemRateLimitingFruitore, RUOLO_EROGATO_SOGGETTO_DOMINIO, RateLimitingVerifica } from '@app/views/servizi/rate-limiting';
import { fruitoriVerificaMock, verificaMock } from '@app/views/servizi/rate-limiting.mock';
import { AdesioneRateLimitingVerificaDialogComponent } from './adesione-rate-limiting-verifica-dialog.component';

/**
 * Pulsante, accanto a quelli di autorizzazione, che verifica il rate limiting dell'adesione: l'icona e il
 * tooltip segnalano se le quote richieste rientrano nella quota residua del servizio (solo un avviso:
 * l'autorizzazione resta possibile); la dialog mostra il dettaglio per API e periodo.
 */
@Component({
    selector: 'app-adesione-rate-limiting-verifica',
    templateUrl: 'adesione-rate-limiting-verifica.component.html',
    standalone: true,
    imports: [CommonModule, TranslateModule, LnkButtonComponent]
})
export class AdesioneRateLimitingVerificaComponent implements OnChanges {

    @Input() adesione: any = null;
    @Input() ambiente: 'collaudo' | 'produzione' = 'collaudo';
    /** Dati di esempio al posto della verifica del backend. */
    @Input() mock: boolean = false;
    /** Da incrementare dopo ogni modifica delle quote dell'adesione, per rifare la verifica. */
    @Input() aggiorna: number = 0;

    _verifica: RateLimitingVerifica | null = null;
    /** Fruitori di esempio, con in testa questa adesione e le sue quote richieste. */
    private _fruitoriMock: ItemRateLimitingFruitore[] | null = null;
    private _caricamento: number = 0;

    constructor(
        private readonly apiService: OpenAPIService,
        private readonly utils: UtilService,
        private readonly modalService: BsModalService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['adesione'] || changes['ambiente'] || changes['mock'] || changes['aggiorna']) && this.adesione?.id_adesione) {
            this.carica();
        }
    }

    carica() {
        const _corrente = ++this._caricamento;
        const _verifica$ = this.mock ? this._verificaMock() : this.apiService.getDetails(
            'adesioni', this.adesione.id_adesione, `${this.ambiente}/rate-limiting/verifica`,
            { context: new HttpContext().set(DISABLE_GLOBAL_EXCEPTION_HANDLING, true) }
        ).pipe(catchError(() => of(null)));
        _verifica$.subscribe((verifica: RateLimitingVerifica | null) => {
            if (_corrente !== this._caricamento) { return; }
            this._verifica = verifica?.api?.length ? verifica : null;
        });
    }

    /** Verifica di esempio sulle API del servizio e sulle quote salvate dell'adesione. */
    private _verificaMock() {
        const _params = this.utils._queryToHttpParams({ id_servizio: this.adesione?.servizio?.id_servizio, ruolo: RUOLO_EROGATO_SOGGETTO_DOMINIO, size: 100 });
        return forkJoin({
            api: this.apiService.getList('api', { params: _params }).pipe(map((r: any) => r?.content || []), catchError(() => of([]))),
            quote: this.apiService.getDetails('adesioni', this.adesione.id_adesione, `${this.ambiente}/rate-limiting`).pipe(
                map((r: any) => r?.rate_limiting || []), catchError(() => of([])))
        }).pipe(map(({ api, quote }) => {
            const _verifica = verificaMock(api, quote);
            const _corrente: ItemRateLimitingFruitore = {
                id_adesione: this.adesione.id_adesione,
                id_logico: this.adesione.id_logico || undefined,
                soggetto: this.adesione.soggetto,
                stato: this.adesione.stato,
                autorizzata: false,
                rate_limiting: _verifica.api.flatMap((a) => a.rate_limiting
                    .filter((v) => v.quota_richiesta)
                    .map((v) => ({ id_api: a.id_api, periodo: v.periodo, quota: v.quota_richiesta as number })))
            };
            this._fruitoriMock = [_corrente, ...fruitoriVerificaMock(api)];
            return _verifica;
        }));
    }

    get _icona(): string {
        return this._verifica?.rientra === false ? 'bi bi-exclamation-triangle-fill text-warning' : 'bi bi-check-circle-fill text-success';
    }

    /** Esito della verifica (tooltip del pulsante e messaggio della dialog). */
    get _esito(): string {
        return this._verifica?.rientra === false
            ? 'APP.ADESIONI.RATE_LIMITING_VERIFICA.EsitoSfora'
            : 'APP.ADESIONI.RATE_LIMITING_VERIFICA.EsitoRientra';
    }

    apri() {
        if (!this._verifica) { return; }
        const _servizio = this.adesione?.servizio;
        this.modalService.show(AdesioneRateLimitingVerificaDialogComponent, {
            class: 'modal-lg-custom modal-with-65 modal-fullscreen-sm-down',
            ignoreBackdropClick: false,
            initialState: {
                verifica: this._verifica,
                esito: this._esito,
                ambiente: this.ambiente,
                idServizio: _servizio?.id_servizio || null,
                idAdesione: this.adesione?.id_adesione || null,
                mock: this.mock,
                fruitoriMock: this.mock ? this._fruitoriMock : null,
                sottotitolo: [this.adesione?.soggetto?.nome, _servizio ? `${_servizio.nome} v. ${_servizio.versione}` : ''].filter(Boolean).join(' · ')
            }
        });
    }
}
