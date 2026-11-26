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
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LocaleNumberPipe } from '@app/pipes/locale-number.pipe';
import { FINALITA_ESITO_TONO, RateLimitingAdesioneFinalita, RateLimitingFinalita, finalitaLetta, finalitaNonAttiva } from '../rate-limiting';

/**
 * Finalita` PDND: quota giornaliera, quota assegnata agli aderenti autorizzati e anomalie (quota
 * superata, stato non attivo, aumento in attesa, finalita` non letta o senza quota concessa). Con
 * `esito` mostra anche il confronto con la quota dell'adesione.
 */
@Component({
    selector: 'app-rate-limiting-finalita',
    templateUrl: 'rate-limiting-finalita.component.html',
    styleUrls: ['rate-limiting-finalita.component.scss'],
    standalone: true,
    imports: [TranslateModule, LocaleNumberPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RateLimitingFinalitaComponent {

    readonly finalita = input.required<RateLimitingFinalita>();
    /** Confronto con la quota di un'adesione (verifica dell'adesione). */
    readonly esito = input<RateLimitingAdesioneFinalita | null>(null);
    /** API a cui si riferisce la finalita`, se la proprieta` e` specifica per API. */
    readonly nomeApi = input<string>('');

    readonly titolo = computed<string>(() => this.finalita().titolo || this.finalita().purpose_id);
    /** Dati della finalita` disponibili: anche non approvata o rifiutata, con la quota assente. */
    readonly letta = computed<boolean>(() => finalitaLetta(this.finalita()));
    readonly nonAttiva = computed<boolean>(() => finalitaNonAttiva(this.finalita()));
    readonly condivisa = computed<boolean>(() => this.finalita().numero_adesioni > 1);
    readonly tono = computed<string | null>(() => {
        const _esito = this.esito();
        return _esito ? FINALITA_ESITO_TONO[_esito.esito] : null;
    });
    readonly inErrore = computed<boolean>(() => this.finalita().superata || this.esito()?.esito === 'superiore');
}
