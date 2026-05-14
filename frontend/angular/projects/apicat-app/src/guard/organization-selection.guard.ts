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
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthenticationService } from '../services/authentication.service';
import { OrganizationContextService } from '../services/organization-context.service';

/**
 * Issue 270 — Guard che forza la scelta dell'organizzazione per
 * gli utenti multi-org senza contesto corrente.
 *
 * Logica:
 * - anonimo -> passa (lo gestiscono `AuthGuard` / altri);
 * - utente con 0 o 1 organizzazione -> passa (auto-select gia` in
 *   `OrganizationContextService.initFromUser`);
 * - utente con >=2 org + contesto corrente valorizzato -> passa;
 * - utente con >=2 org + contesto `null` -> redirect a
 *   `/auth/select-organization?returnUrl=<state.url>`.
 *
 * Applicato sulla rotta root protetta di `GpLayoutComponent`
 * accanto a `AuthGuard` e `RegistrazioneGuard`.
 */
@Injectable()
export class OrganizationSelectionGuard implements CanActivate {

    constructor(
        private readonly router: Router,
        private readonly authenticationService: AuthenticationService,
        private readonly organizationContextService: OrganizationContextService
    ) {}

    canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        if (this.authenticationService.isAnonymous()) {
            return true;
        }
        const user: any = this.authenticationService.getUser();
        const orgs: any[] = Array.isArray(user?.organizzazioni) ? user.organizzazioni : [];
        if (orgs.length < 2) {
            // 0 o 1 org: nessuna scelta da imporre.
            return true;
        }
        if (this.organizationContextService.getCurrentOrganization()) {
            // Contesto gia` selezionato (persistito o appena scelto).
            return true;
        }
        this.router.navigate(['/auth/select-organization'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }
}
