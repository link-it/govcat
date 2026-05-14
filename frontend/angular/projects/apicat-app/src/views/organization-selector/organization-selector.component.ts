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
import { ActivatedRoute, Router } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { ConfigService, COMPONENTS_IMPORTS } from '@linkit/components';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { AuthenticationService } from '@app/services/authentication.service';
import { OrganizationContextService } from '@app/services/organization-context.service';

import { UtenteOrganizzazione } from '../../model/utenteOrganizzazione';
import { RuoloOrganizzazioneEnum } from '../../model/ruoloOrganizzazioneEnum';

/**
 * Issue 270 — Selettore organizzazione post-login per utenti
 * multi-org.
 *
 * Mostrato nei seguenti casi:
 * - utente loggato + `utente.organizzazioni.length >= 2` + nessun
 *   contesto org corrente (es. primo login, dopo logout, dopo
 *   clear del contesto).
 *
 * Skip automatico (redirect a `returnUrl` o `/dashboard`) se:
 * - utente con 0 / 1 org (in 1-org `initFromUser` ha gia` settato
 *   il contesto silenziosamente);
 * - utente con contesto gia` selezionato (es. navigazione diretta
 *   alla pagina selector da utente con persistenza valida).
 *
 * Layout: card cliccabili sotto `SimpleLayoutComponent` (stesso
 * frame della login). Conferma -> `setCurrent` + redirect.
 * Esci -> `authenticationService.logout` + redirect a `/auth/login`.
 */
@Component({
  selector: 'app-organization-selector',
  templateUrl: 'organization-selector.component.html',
  styleUrls: ['organization-selector.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...COMPONENTS_IMPORTS,
    LnkButtonComponent
  ]
})
export class OrganizationSelectorComponent implements OnInit {
  static readonly Name = 'OrganizationSelectorComponent';

  organizzazioni: UtenteOrganizzazione[] = [];
  _selected: UtenteOrganizzazione | null = null;
  _returnUrl: string = '/dashboard';

  /**
   * Path del logo da mostrare in testa alla card. Letto dalla
   * stessa config usata dalla login
   * (`AppConfig.Layout.Login.logo`) per coerenza visiva: chi
   * personalizza il tema vede lo stesso brand sia in login che
   * nel selettore.
   */
  _logo: string = '';

  readonly RuoloOrganizzazione = RuoloOrganizzazioneEnum;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authenticationService: AuthenticationService,
    private readonly organizationContextService: OrganizationContextService,
    private readonly configService: ConfigService
  ) {}

  ngOnInit(): void {
    this._returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';

    // Logo da `AppConfig.Layout.Login.logo` (stessa fonte della
    // pagina di login). Fallback assente se config mancante.
    const cfg: any = this.configService.getConfiguration();
    const logoName = cfg?.AppConfig?.Layout?.Login?.logo;
    this._logo = logoName ? `./assets/images/${logoName}` : '';

    const user: any = this.authenticationService.getUser();
    this.organizzazioni = Array.isArray(user?.organizzazioni) ? user.organizzazioni : [];

    // Skip se l'utente non e` multi-org o ha gia` selezionato: la
    // pagina non ha senso d'essere mostrata.
    if (this.organizzazioni.length < 2) {
      this._redirectToReturnUrl();
      return;
    }
    if (this.organizationContextService.getCurrentOrganization()) {
      this._redirectToReturnUrl();
      return;
    }
  }

  /** Click su una card -> selezione (non ancora confermata). */
  selectOrg(uo: UtenteOrganizzazione): void {
    this._selected = uo;
  }

  /** Conferma: persiste l'org corrente e prosegue alla return URL. */
  confirm(): void {
    if (!this._selected) { return; }
    this.organizationContextService.setCurrent(this._selected);
    this._redirectToReturnUrl();
  }

  /** Esce dalla sessione e torna alla pagina di login. */
  logout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/auth/login']);
  }

  /** Label i18n del ruolo per il chip nella card. */
  roleLabelKey(uo: UtenteOrganizzazione): string {
    switch (uo?.ruolo_organizzazione) {
      case RuoloOrganizzazioneEnum.AmministratoreOrganizzazione:
        return 'APP.RUOLI.AmministratoreOrganizzazione';
      case RuoloOrganizzazioneEnum.OperatoreApi:
        return 'APP.RUOLI.OperatoreApi';
      default:
        return 'APP.ORGANIZATION_SWITCHER.NoRole';
    }
  }

  private _redirectToReturnUrl(): void {
    // `navigateByUrl` accetta path + query, utile se la returnUrl
    // contiene anche query params dalla rotta originale.
    this.router.navigateByUrl(this._returnUrl);
  }
}
