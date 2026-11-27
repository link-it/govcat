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
import { Component, ElementRef, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { OpenAPIService } from '@app/services/openAPI.service';

import type { SwaggerConfigs, Spec } from 'swagger-ui-dist';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';
import SwaggerUIStandalonePreset from 'swagger-ui-dist/swagger-ui-standalone-preset';

import { firstValueFrom } from 'rxjs';

// import { OpenapiTest } from '../../assets/json/openapi-test.json';

@Component({
  selector: 'ui-swagger',
  templateUrl: './swagger.component.html',
  styleUrls: ['./swagger.component.scss'],
  standalone: true,
  imports: [CommonModule, TooltipModule, TranslateModule]
})
export class SwaggerComponent implements OnInit, OnDestroy {

  @Input('url') url: any = null;
  @Input('standaloneLayout') standaloneLayout: boolean = false;
  @Input('allowTryIt') allowTryIt: boolean = false;
  @Input('showAuthorizeBtn') showAuthorizeBtn: boolean = false;
  
  // @ViewChild('swaggerui') swaggerDom!: ElementRef<HTMLDivElement>;

  _currentStatus: string = '';
  _configStatus: any = null;
  _cambioStato: any = null;

  loading: boolean = false;
  error: boolean = false;
  message: string = '';

  private _observer: MutationObserver | null = null;

  constructor(
    private http: HttpClient,
    private elementRef: ElementRef,
    private apiService: OpenAPIService
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.url) {
      this.url = changes.url.currentValue;
      this._initSwagger();
    }
  }

  async _initSwagger() {
    const content = await this.getApiSpec(this.url);
    const spec: Spec = JSON.parse(content);

    // if (this.swaggerDom) {
      const DisableTryItOutPlugin = () => {
        return {
          statePlugins: {
            spec: {
              wrapSelectors: {
                allowTryItOutFor: () => () => false
              }
            }
          }
        };
      };
      const DisableAuthorizePlugin = () => {
        return {
          wrapComponents: {
            authorizeBtn: () => () => null
          }
        };
      };
      let pins: any[] = [];
      if (!this.allowTryIt) {
        pins = [ ...pins, DisableTryItOutPlugin ];
      }
      if (!this.showAuthorizeBtn) {
        pins = [ ...pins, DisableAuthorizePlugin ];
      }
      const _config: SwaggerConfigs = {
        spec: spec,
        url: this.url,
        // dom_id: '#swaggerui',
        domNode: this.elementRef.nativeElement, // this.swaggerDom.nativeElement
        // i collegamenti profondi mettono un link dentro il pulsante dell'operazione (controlli annidati)
        deepLinking: false,
        filter: true,
        plugins: pins
      };
      if (this.standaloneLayout) {
        _config.presets = [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset];
        _config.layout = 'StandaloneLayout';
      }
      SwaggerUIBundle(_config);
      this._completaAccessibilita();
    // }
  }

  /** Swagger UI ridisegna il proprio DOM: i nomi mancanti si aggiungono a ogni modifica. */
  private _completaAccessibilita(): void {
    this._observer?.disconnect();
    const root: HTMLElement = this.elementRef.nativeElement;
    const applica = () => {
      // lo sprite delle icone e' decorativo
      root.querySelectorAll('svg.svg-assets:not([aria-hidden])').forEach((svg: Element) => svg.setAttribute('aria-hidden', 'true'));
      root.querySelectorAll('select#servers:not([aria-label])').forEach((select: Element) => {
        const titolo = root.querySelector('.servers-title')?.textContent?.trim();
        select.setAttribute('aria-label', titolo || 'Servers');
      });
      // il titolo della specifica sta sotto il titolo della pagina: livello 2, prima dei tag (h3)
      root.querySelectorAll('.info h1:not([aria-level])').forEach((h: Element) => h.setAttribute('aria-level', '2'));
    };
    applica();
    this._observer = new MutationObserver(applica);
    this._observer.observe(root, { childList: true, subtree: true });
  }

  async getApiSpec(url: string) {
    this.error = false;
    this.loading = true;
    // url = '/assets/json/openapi-test.json';
    try {
      const response: any = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
      const blob = new Blob([response], { type: 'text/plain; charset=utf-8' });
      const text: any = await blob.text();
      this.loading = false;
      return text;
    } catch (error) {
      console.error('getApiSpec error', error);
      this.error = true;
      this.loading = false;
      return undefined;
    }
  }
}
