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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { EnvToggleComponent, EnvValue } from '@app/components/vetrina/env-toggle.component';
import { ServizioRateLimitingRiepilogoComponent } from './servizio-rate-limiting-riepilogo.component';

/** Dialog del rate limiting del servizio, aperta dalla vetrina da chi gestisce il servizio. */
@Component({
    selector: 'app-servizio-rate-limiting-dialog',
    templateUrl: 'servizio-rate-limiting-dialog.component.html',
    styleUrls: ['servizio-rate-limiting-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, TranslateModule, EnvToggleComponent, ServizioRateLimitingRiepilogoComponent]
})
export class ServizioRateLimitingDialogComponent {
    // Valorizzati da `initialState` del BsModalService
    idServizio: string | null = null;
    nomeServizio: string = '';
    ambiente: EnvValue = 'collaudo';
    collaudoDisabled: boolean = false;
    ruoli: string[] | null = null;
    mock: boolean = false;

    constructor(public readonly bsModalRef: BsModalRef) {}

    onAmbiente(env: EnvValue) {
        if (env === 'collaudo' && this.collaudoDisabled) { return; }
        this.ambiente = env;
    }

    chiudi() {
        this.bsModalRef.hide();
    }
}
