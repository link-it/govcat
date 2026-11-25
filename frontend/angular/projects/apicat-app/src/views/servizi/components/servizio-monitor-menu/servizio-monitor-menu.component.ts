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
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthenticationService } from '@app/services/authentication.service';
import { NavigationService } from '@app/services/navigation.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { Grant } from '@app/model/grant';

import { MonitorDropdwnComponent } from '../monitor-dropdown/monitor-dropdown.component';
import { QUERY_PARAM_AMBIENTE } from '../../ambiente-servizio';

/** Menu del servizio (comunicazioni, monitoraggio, gestione e vetrina) per le pagine collegate al servizio, come in vetrina. */
@Component({
    selector: 'app-servizio-monitor-menu',
    standalone: true,
    imports: [MonitorDropdwnComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (visibile()) {
            <app-monitor-dropdown
                [service_id]="servizio()?.id_servizio"
                [showComunications]="comunicazioni()"
                [showMonitoring]="monitoraggio()"
                [showManagement]="gestione()"
                [showVetrina]="true"
                [currentAction]="paginaCorrente()"
                (action)="onAction($event)">
            </app-monitor-dropdown>
        }
    `
})
export class ServizioMonitorMenuComponent {

    readonly servizio = input<any>(null);
    /** Voce del menu della pagina corrente (`transazioni`, `statistiche`, `audit`, `comunicazioni`, ...). */
    readonly paginaCorrente = input<string | null>(null);
    /** Ambiente della pagina corrente, con cui si aprono vetrina e monitoraggio. */
    readonly ambiente = input<string | null>(null);

    private readonly apiService = inject(OpenAPIService);
    private readonly authenticationService = inject(AuthenticationService);
    private readonly navigationService = inject(NavigationService);

    private readonly idServizio = computed<string | null>(() => this.servizio()?.id_servizio || null);

    /** Ruoli dell'utente sul servizio (grant), `null` finché non sono caricati. */
    private readonly ruoli = toSignal(
        toObservable(this.idServizio).pipe(switchMap((id: string | null) => this._loadRuoli(id))),
        { initialValue: null }
    );

    readonly comunicazioni = computed<boolean>(() => {
        const _ruoli = this.ruoli();
        return !!_ruoli && this.authenticationService.canManagementComunicazioni('servizio', 'servizio', this.servizio()?.stato, _ruoli);
    });

    readonly monitoraggio = computed<boolean>(() => {
        const _ruoli = this.ruoli();
        return !!_ruoli && this.authenticationService.canMonitoraggio(_ruoli);
    });

    readonly gestione = computed<boolean>(() => {
        const _ruoli = this.ruoli();
        if (!_ruoli) { return false; }
        return this.servizio()?.package
            ? this.authenticationService.isGestore(_ruoli)
            : this.authenticationService.canManagement('servizio', 'servizio', this.servizio()?.stato, _ruoli);
    });

    /** Con i permessi caricati c'è almeno la voce della vetrina. */
    readonly visibile = computed<boolean>(() => !!this.ruoli());

    onAction(event: any) {
        const _id = this.idServizio();
        if (!_id || !event?.action) { return; }
        let _route: any[];
        switch (event.action) {
            case 'gestione':
                _route = ['servizi', _id];
                break;
            case 'vetrina':
                localStorage.setItem('SERVIZI_VIEW', 'TRUE');
                _route = ['servizi', _id, 'view'];
                break;
            default:
                _route = ['servizi', _id, event.action];
        }
        const _ambiente = this.ambiente();
        if (_ambiente && event.action !== 'gestione' && event.action !== 'comunicazioni') {
            this.navigationService.navigateWithEvent(event?.event, _route, { [QUERY_PARAM_AMBIENTE]: _ambiente });
        } else {
            this.navigationService.navigateWithEvent(event?.event, _route);
        }
    }

    private _loadRuoli(id: string | null): Observable<string[] | null> {
        if (!id) { return of(null); }
        return this.apiService.getDetails('servizi', id, 'grant').pipe(
            map((grant: Grant) => grant?.ruoli || []),
            catchError(() => of(null))
        );
    }
}
