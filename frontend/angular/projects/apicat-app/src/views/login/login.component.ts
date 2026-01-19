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
import { Router, ActivatedRoute, Navigation } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';

import { ConfigService } from '@linkit/components';
import { AuthenticationService } from '../../services/authentication.service';
import { Tools } from '@linkit/components';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {

  model: any = { username: '', password: '' };
  loading: boolean = false;
  returnUrl: string = '/';
  error: any = null;
  errorCode: string = '';

  signup_disabled: boolean = true;

  config: any;

  version: string = '0.0.1';

  _formGroup: UntypedFormGroup = new UntypedFormGroup({});

  _title: string = '';
  _logo: string = '';
  _header: string = '';

  _version: string = 'v2';

  ANONYMOUS_ACCESS: boolean = false;
  AUTH_USER: boolean = false;
  OTHER_AUTHS: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private oauthService: OAuthService,
    private authenticationService: AuthenticationService,
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();
    this.ANONYMOUS_ACCESS = this.config.AppConfig.ANONYMOUS_ACCESS;
    this.AUTH_USER = this.config.AppConfig.AUTH_SETTINGS.AUTH_USER;
    this.OTHER_AUTHS = this.config.AppConfig.AUTH_SETTINGS.OTHER_AUTHS;

    const _currentNav: Navigation | null = this.router.getCurrentNavigation();
    if (_currentNav?.extras.state) {
      if (_currentNav?.extras.state.from ) {
        this.error = {
          from: _currentNav?.extras.state.from,
          message: _currentNav?.extras.state.message
        };
      }
    }
  }

  ngOnInit() {
    // reset login status
    if (this.authenticationService.isLogged()) {
      this.authenticationService.logout();
    }

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this._title = this.config.AppConfig.Layout.Login.title;
    this._logo = './assets/images/' + this.config.AppConfig.Layout.Login.logo;
    this._header = './assets/images/' + this.config.AppConfig.Layout.Login.header;

    this._initForm();

    // Clear MultiSnackbar
    Tools.MultiSnackbarDestroyAll();
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm() {
    this._formGroup = new UntypedFormGroup({
      username: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
      password: new UntypedFormControl('', [Validators.required, Validators.minLength(4)])
    });
  }

  login(value: any) {
    this.loading = true;
    this.authenticationService.login(value.username, value.password)
      .subscribe({
        next: (response: any) => {
          if (!this.returnUrl || this.returnUrl === '/') {
            this.returnUrl = '/dashboard';
          }

          this.authenticationService.setCurrentSession(response);
          this.authenticationService.reloadSession();

          Tools.MultiSnackbarDestroyAll();
          this.router.navigate([this.returnUrl]);
          this.loading = false;
        },
        error: (error: any) => {
          this.error = error;
          this.errorCode = error.error.status;
          this.loading = false;
        }
      });

    // Mockup
    // const response = {
    //   principal: '<MOCKER>',
    //   roles: ['govshell_adm']
    // };
    // this.authenticationService.setCurrentSession(response);
    // this.authenticationService.reloadSession();
    // this.router.navigate(['/']);
  }

  _closeAlert() {
    this.error = null;
    this.errorCode = '';
  }

  backToAnonymous() {
    this.router.navigate(['/']);
  }

  logidWithUrlAction(item: any) {
    if (item.signin_url) {
      window.location.href = item.signin_url;
    } else {
      switch (item.signin_action) {
        case 'oauth':
          this.authenticationService.oauthLogin();
          break;
        default:
      }
    }
  }
}
