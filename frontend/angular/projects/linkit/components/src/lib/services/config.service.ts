import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthConfig, OAuthErrorEvent, OAuthService } from 'angular-oauth2-oidc';

import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';

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
          Tools.SetThemeColors(_theme || null);

          // OAUTH2
          const _oauthConfig = this.config.AppConfig.AUTH_SETTINGS.OAUTH;
          const cfg: any = {
            issuer: (_oauthConfig.Issuer || ''),
            redirectUri: (_oauthConfig.RedirectUri || ''),
            postLogoutRedirectUri: (_oauthConfig.LogoutRedirectUri || ''),
            clientId: (_oauthConfig.ClientId || ''),
            responseType: (_oauthConfig.ResponseType || 'code'),
            scope: (_oauthConfig.Scope || 'openid profile email offline_access'),
            requireHttps: false
          };
          if (!_oauthConfig.BackdoorOAuth) {
            const authCodeFlowConfig: AuthConfig = new AuthConfig(cfg);
            this.oauthService.configure(authCodeFlowConfig);
            this.oauthService.setupAutomaticSilentRefresh();
            this.oauthService.loadDiscoveryDocument().then(() => {
              this.oauthService.tryLogin().then(() => {
                if (this.oauthService.getAccessToken()) {
                  this._tokenLoaded();
                } else {
                  // console.log('Autenticazione fallita');
                  Tools.LoginAccess();
                }
              }).catch((error: any) => {
                // console.log('catch Autenticazione fallita');
                Tools.LoginAccess();
              });
            });
            this.oauthService.events.subscribe(event => {
              if (!(event instanceof OAuthErrorEvent)) {
                if (event.type === 'session_terminated') {
                  this._sessionTerminated();
                }
                // if (event.type === 'token_received') {
                //   this._tokenLoaded(resolve);
                // }
              } else {
                if (event && event.reason) {
                  // Tools.OnError(event.reason);
                  console.warn(event.reason);
                }
              }
            });
          } else {
            Tools.LoginAccess();
          }

          // if (this.config.AppConfig.ANONYMOUS_ACCESS) {
          //   this.loadRemoteConfig(resolve);
          // } else {
            resolve();
          // }

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
    if (config.servizio && config.servizio.api && config.servizio.api.proprieta_custom) {
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
    if (config.adesione && config.adesione.proprieta_custom) {
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
}
