import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Tools } from './tools.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private config: any;

  private hubconfig: any;

  // Cache
  public CacheConfig: any = {};

  constructor(
    private http: HttpClient
  ) { }

  load(url: string) {
    return new Promise<void>((resolve) => {
      this.http.get(url)
        .subscribe(config => {
          this.config = config;
        
          if(this.config.AppConfig.STANDALONE == false){
            this.loadRemoteConfig(resolve)
          }else{

            const _currentTheme = this.config.AppConfig.CurrentThems;
            const _theme = this.config.AppConfig.Themes.find((theme: any) => theme.Name === _currentTheme);
            Tools.SetThemeColors(_theme || null);
            resolve();
          }
        });
    });
  }

  loadRemoteConfig(resolve: any) {
    const api_url = this.config.AppConfig.GOVAPI.GOVHUB;
    this.http.get(`${api_url}/assets/config/app-config.json`).subscribe(
      {
        next: (response: any) => {        
          this.hubconfig = response
          const _currentTheme = this.hubconfig.AppConfig.CurrentThems;
          const _theme = this.hubconfig.AppConfig.Themes.find((theme: any) => theme.Name === _currentTheme);
          Tools.SetThemeColors(_theme || null);
          resolve();
        },
        error: (error:any)=>{
          const _currentTheme = this.config.AppConfig.CurrentThems;
          const _theme = this.config.AppConfig.Themes.find((theme: any) => theme.Name === _currentTheme);
          Tools.SetThemeColors(_theme || null);
          resolve();
        }
      }
    );
  }

  _generateCustomFieldLabel(config: any) {
    const _customFields: any[] = [];
    config.servizio.api.proprieta_custom.forEach((pc: any) => {
      pc.proprieta.forEach((field: any) => {
        const _label = `${pc.nome_gruppo}.${field.nome}`;
        _customFields.push({
          label: _label,
          value: field.etichetta
        });
      });
    });
    Tools.CustomFieldsLabel = _customFields;
  }

  getConfiguration() {
    return this.config;
  }

  getAppConfig() {
    return this.config.AppConfig;
  }

  getHubConfig() {
    return this.hubconfig?.AppConfig || null;
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
