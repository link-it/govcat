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
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { Router } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ConfigService, EventType, EventsManagerService } from '@linkit/components';

import { AuthenticationService } from '@services/authentication.service';
import { OrganizationContextService } from '@services/organization-context.service';
import { ItemOrganizzazione } from '../../model/itemOrganizzazione';
import { RuoloOrganizzazioneEnum } from '../../model/ruoloOrganizzazioneEnum';
import { UtenteOrganizzazione } from '../../model/utenteOrganizzazione';
import { OrganizationManageDialogComponent } from './organization-manage-dialog.component';

@Component({
    selector: 'app-organization-switcher',
    templateUrl: './organization-switcher.component.html',
    styleUrls: ['./organization-switcher.component.scss'],
    standalone: true,
    imports: [CommonModule, TranslateModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationSwitcherComponent implements OnInit, OnDestroy {

    organizzazioni: UtenteOrganizzazione[] = [];
    current: UtenteOrganizzazione | null = null;

    showWhenSingle = false;

    private readonly authenticationService = inject(AuthenticationService);
    private readonly organizationContextService = inject(OrganizationContextService);
    private readonly configService = inject(ConfigService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly modalService = inject(BsModalService);
    private readonly eventsManagerService = inject(EventsManagerService);
    private readonly router = inject(Router);

    private _sub: Subscription | null = null;

    ngOnInit(): void {
        const cfg = this.configService.getConfiguration();
        this.showWhenSingle = !!cfg?.AppConfig?.Organization?.ContextSelector?.showWhenSingle;
        this._reloadFromUser();
        this._sub = this.organizationContextService.current$.subscribe(ctx => {
            this.current = ctx;
            this.cdr.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    /**
     * Visibilita' del selettore:
     * - 0 organizzazioni: nascosto;
     * - 1 organizzazione: visibile solo se `showWhenSingle === true`;
     * - 2+ organizzazioni: sempre visibile.
     */
    get visible(): boolean {
        const n = this.organizzazioni.length;
        if (n === 0) { return false; }
        if (n === 1) { return this.showWhenSingle; }
        return true;
    }

    get currentLabel(): string {
        return this.current?.organizzazione?.nome || '';
    }

    isCurrent(org: UtenteOrganizzazione): boolean {
        return org?.organizzazione?.id_organizzazione === this.current?.organizzazione?.id_organizzazione;
    }

    roleLabelKey(org: UtenteOrganizzazione): string | null {
        switch (org?.ruolo_organizzazione) {
            case RuoloOrganizzazioneEnum.AmministratoreOrganizzazione:
                return 'APP.RUOLI.AmministratoreOrganizzazione';
            case RuoloOrganizzazioneEnum.OperatoreApi:
                return 'APP.RUOLI.OperatoreApi';
            default:
                return null;
        }
    }

    /**
     * Vero se l'utente ha ruolo `amministratore_organizzazione` per
     * la voce passata: solo allora mostriamo il pulsante "Gestisci".
     */
    canManage(org: UtenteOrganizzazione): boolean {
        return org?.ruolo_organizzazione === RuoloOrganizzazioneEnum.AmministratoreOrganizzazione;
    }

    onManage(org: UtenteOrganizzazione, event: Event): void {
        event.stopPropagation();
        if (!this.canManage(org)) { return; }
        this.modalService.show(OrganizationManageDialogComponent, {
            class: 'modal-lg',
            ignoreBackdropClick: true,
            initialState: { organizzazione: org.organizzazione }
        });
    }

    onSelect(org: UtenteOrganizzazione): void {
        if (this.isCurrent(org)) { return; }
        this.organizationContextService.setCurrent(org);
        // Live refresh: emettiamo un evento globale (per i componenti
        // che vogliono reagire selettivamente) e ri-navighiamo alla
        // rotta corrente per forzare il riavvio del navigation cycle
        // (resolver, guard, ngOnInit dei children) senza un full reload.
        // Il trick di passare per `/` con `skipLocationChange` evita
        // di toccare la history del browser.
        this.eventsManagerService.broadcast(EventType.ORGANIZATION_CONTEXT_CHANGED, org);
        const currentUrl = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true })
            .then(() => this.router.navigateByUrl(currentUrl));
    }

    private _reloadFromUser(): void {
        const utente: any = this.authenticationService.getUser();
        const orgs: UtenteOrganizzazione[] = Array.isArray(utente?.organizzazioni) ? utente.organizzazioni : [];
        if (orgs.length === 0 && utente?.organizzazione?.id_organizzazione) {
            // Retrocompat: utente legacy con singola `organizzazione`.
            const legacy: ItemOrganizzazione = {
                id_organizzazione: utente.organizzazione.id_organizzazione,
                nome: utente.organizzazione.nome,
                descrizione: utente.organizzazione.descrizione
            };
            this.organizzazioni = [{ organizzazione: legacy, ruolo_organizzazione: null }];
        } else {
            this.organizzazioni = orgs;
        }
        this.current = this.organizationContextService.getCurrent();
    }
}
