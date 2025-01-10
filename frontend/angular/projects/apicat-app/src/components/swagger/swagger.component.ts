import { Component, ElementRef, Input, OnInit, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { OpenAPIService } from '@app/services/openAPI.service';

import { SwaggerConfigs, SwaggerUIBundle, SwaggerUIStandalonePreset, Spec } from 'swagger-ui-dist';

import { firstValueFrom } from 'rxjs';

// import { OpenapiTest } from '../../assets/json/openapi-test.json';

@Component({
  selector: 'ui-swagger',
  templateUrl: './swagger.component.html',
  styleUrls: ['./swagger.component.scss']
})
export class SwaggerComponent implements OnInit {

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

  constructor(
    private http: HttpClient,
    private elementRef: ElementRef,
    private apiService: OpenAPIService
  ) { }

  ngOnInit() {
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
        deepLinking: true,
        filter: true,
        plugins: pins
      };
      if (this.standaloneLayout) {
        _config.presets = [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset];
        _config.layout = 'StandaloneLayout';
      }
      SwaggerUIBundle(_config);
    // }
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
