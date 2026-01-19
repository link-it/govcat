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
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';

import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { ConfigService } from '@linkit/components';

@Component({
  selector: 'app-accesso',
  templateUrl: 'accesso.component.html',
  styleUrls: ['accesso.component.scss'],
  standalone: false
})
export class AccessoComponent implements OnInit {

  loading: boolean = false;
  error: any = null;
  errorCode: string = '';

  signup_disabled: boolean = true;

  config: any;

  _title: string = '';
  _logo: string = '';
  _header: string = '';

  _ms: number = 1500;

  showUserRegistration: boolean = false;

  claims: any;
  scopes: any;
  authorizationHeader: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private oauthService: OAuthService,
    private authenticationService: AuthenticationService,
    private apiService: OpenAPIService,
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();
    this.showUserRegistration = this.config.AppConfig.AUTH_SETTINGS.SHOW_USER_REGISTRATION;
  }

  ngOnInit() {
    this._title = this.config.AppConfig.Layout.Login.title;
    this._logo = './assets/images/' + this.config.AppConfig.Layout.Login.logo;
    this._header = './assets/images/' + this.config.AppConfig.Layout.Login.header;

    this.claims = this.oauthService.getIdentityClaims();
    this.scopes = this.oauthService.getGrantedScopes();
    this.authorizationHeader = this.oauthService.authorizationHeader();

    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      if (!this.showUserRegistration) {
        this.gotoHome();
      } else {
        this.showData();
      }
    }, this._ms);
  }

  gotoHome() {
    this.router.navigate(['/']);
  }

  _closeAlert() {
    this.error = null;
    this.errorCode = '';
  }
  
  showData() {
    console.log(this.config);
  }

  get userName(): string | null {
    if (!this.claims) return null;
    return this.claims['given_name'];
  }

  get idToken(): string {
    return this.oauthService.getIdToken();
  }

  get accessToken(): string {
    return this.oauthService.getAccessToken();
  }

  refresh() {
    this.oauthService.refreshToken();
  }
}
