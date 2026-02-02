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
import { HttpClient } from '@angular/common/http';

import { AuthConfig, OAuthErrorEvent, OAuthService } from 'angular-oauth2-oidc';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Tools } from './tools.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config: any;

  // Cache
  public CacheConfig: any = {};

  constructor(
    private http: HttpClient,
    protected oauthService: OAuthService
  ) { }

  load(url: string) {
    return new Promise<void>((resolve) => {
      this.http.get(url)
        .subscribe(config => {
          this.config = config;
          const _currentTheme = this.config.AppConfig.CurrentThems;
          const _theme = this.config.AppConfig.Themes.find((theme: any) => theme.Name === _currentTheme);

          // Load font CSS if theme has a font configured
          this.loadThemeFont(_theme);

          Tools.SetThemeColors(_theme || null);

          // OAUTH2
          const _oauthConfig = this.config.AppConfig.AUTH_SETTINGS?.OAUTH;
          if (!_oauthConfig) {
            Tools.LoginAccess();
            resolve();
            return;
          }
          const cfg: any = {
            redirectUri: (_oauthConfig.RedirectUri || ''),
            postLogoutRedirectUri: (_oauthConfig.LogoutRedirectUri || ''),
            clientId: (_oauthConfig.ClientId || ''),
            responseType: (_oauthConfig.ResponseType || 'code'),
            scope: (_oauthConfig.Scope || 'openid profile email offline_access'),
            requireHttps: false,
            showDebugInformation: false
          };
          if (_oauthConfig.DummyClientSecret) {
            cfg.dummyClientSecret = _oauthConfig.DummyClientSecret;
          }
          const useDiscoveryDocument = !!_oauthConfig.Issuer;

          if (_oauthConfig.Issuer) {
            cfg.issuer = _oauthConfig.Issuer;
          } else {
            // Configurazione manuale degli endpoint (senza discovery document):
            cfg.loginUrl = (_oauthConfig.LoginUrl || '');
            cfg.tokenEndpoint = (_oauthConfig.TokenEndpoint || '');
            cfg.userinfoEndpoint = (_oauthConfig.UserinfoEndpoint || '');
            cfg.logoutUrl = (_oauthConfig.LogoutUrl || '');
            cfg.revocationEndpoint = (_oauthConfig.RevocationEndpoint || '');
            cfg.skipIssuerCheck = true;
            cfg.strictDiscoveryDocumentValidation = false;
          }
          if (_oauthConfig.Issuer && !_oauthConfig.StrictDiscoveryDocumentValidation) {
            cfg.strictDiscoveryDocumentValidation = _oauthConfig.StrictDiscoveryDocumentValidation;
          }
          if (!_oauthConfig.BackdoorOAuth) {
            const authCodeFlowConfig: AuthConfig = new AuthConfig(cfg);

            this.oauthService.configure(authCodeFlowConfig);
            this.oauthService.setupAutomaticSilentRefresh();

            // Con Issuer: carica discovery document e prova login
            // Senza Issuer (endpoint manuali): solo tryLogin
            const loginPromise = useDiscoveryDocument
              ? this.oauthService.loadDiscoveryDocumentAndTryLogin()
              : this.oauthService.tryLogin();

            loginPromise
              .then(() => {
                if (this.oauthService.hasValidAccessToken()) {
                  this._tokenLoaded();
                } else {
                  Tools.LoginAccess();
                }
                resolve();
              })
              .catch((error: any) => {
                console.warn('OAuth initialization error:', error);
                Tools.LoginAccess();
                resolve();
              });

            this.oauthService.events.subscribe(event => {
              if (!(event instanceof OAuthErrorEvent)) {
                if (event.type === 'session_terminated') {
                  this._sessionTerminated();
                }
              } else {
                if (event && event.reason) {
                  console.warn(event.reason);
                }
              }
            });
          } else {
            Tools.LoginAccess();
            resolve();
          }

        });
    });
  }

  _tokenLoaded() {
    Tools.OpenIDConnectTokenLoaded.next(true);
  }

  _sessionTerminated() {
    Tools.USER_LOGGED = null;
    this.oauthService.initCodeFlow();
  }

  loadRemoteConfig(resolve: any) {
    const api_url = this.config.AppConfig.GOVAPI.HOST;
    this.http.get(`${api_url}/configurazione`).subscribe(
      (response: any) => {
        Tools.Configurazione = response;
        this._generateCustomFieldLabel(response);

        if (resolve) { resolve(); }
      }
    );
  }

  _generateCustomFieldLabel(config: any) {
    const _customFields: any[] = [];
    if (config.servizio?.api?.proprieta_custom) {
      config.servizio.api.proprieta_custom.forEach((pc: any) => {
        pc.proprieta.forEach((field: any) => {
          const _label = `${pc.nome_gruppo}.${field.nome}`;
          _customFields.push({
            label: _label,
            value: field.etichetta
          });
        });
      });
    }
    if (config.adesione?.proprieta_custom) {
      config.adesione.proprieta_custom.forEach((pc: any) => {
        pc.proprieta.forEach((field: any) => {
          const _label = `${pc.nome_gruppo}.${field.nome}`;
          _customFields.push({
            label: _label,
            value: field.etichetta
          });
        });
      });
    }
    Tools.CustomFieldsLabel = _customFields;
  }

  getConfiguration() {
    return this.config;
  }

  getAppConfig() {
    return this.config.AppConfig;
  }

  getDominio() {
    const defaultDominio = '<Dominio non configurato>';
    return this.config.AppConfig.DOMINI.length == 1 ? this.config.AppConfig.DOMINI[0].label : defaultDominio;
  }

  getSessionPrefix() {
    return this.config.sessionPrefix;
  }

  // Get data

  getConfig(name: string, suffix: string = '-config') {
    if (this.CacheConfig[name]) {
      let obs = new Observable((subscriber) => {
        subscriber.next(this.CacheConfig[name]);
        subscriber.complete();
      });
      return obs;
    } else{
      return this.http.get<any>(`./assets/config/${name}${suffix}.json`)
        .pipe(
          map((response: Response) => {
            this.CacheConfig[name] = response;
            return response;
          })
        );
    }
  }

  getJson(name: string) {
    const _timeout = this.config.AppConfig.DELAY || 0;
    return this.http.get<any>(`./assets/json/${name}.json`);
  }

  getPage(name: string, folder: string = 'pages') {
    return this.http.get<any>(`./assets/${folder}/${name}.html`, { responseType: 'text' as 'json' });
  }

  /**
   * Load font CSS and apply font-family to theme
   * @param theme The theme configuration object
   */
  private loadThemeFont(theme: any): void {
    if (!theme || !theme.FontName) {
      return;
    }

    const fonts = this.config.AppConfig.Fonts;
    if (!fonts || !Array.isArray(fonts)) {
      return;
    }

    const font = fonts.find((f: any) => f.Name === theme.FontName);
    if (!font) {
      console.warn(`Font "${theme.FontName}" not found in configuration`);
      return;
    }

    // Load CSS file if specified
    if (font.CssFile) {
      this.loadFontCSS(font.CssFile);
    }

    // Apply font-family to document
    if (font.FontFamily) {
      document.documentElement.style.setProperty('--font-family-base', font.FontFamily);
      document.body.style.fontFamily = font.FontFamily;
    }
  }

  /**
   * Dynamically load a CSS file for fonts
   * @param cssPath Path to the CSS file (relative to assets)
   */
  private loadFontCSS(cssPath: string): void {
    // Check if CSS is already loaded
    const existingLink = document.getElementById('theme-font-css');
    if (existingLink) {
      existingLink.remove();
    }

    // Create and append link element
    const link = document.createElement('link');
    link.id = 'theme-font-css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `./assets/${cssPath}`;

    link.onerror = () => {
      console.error(`Failed to load font CSS: ${cssPath}`);
    };

    document.head.appendChild(link);
  }
}
