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
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import { Tools } from '@linkit/components';

import { OpenAPIService } from '@app/services/openAPI.service';

@Component({
  selector: 'ui-wsdl',
  templateUrl: './wsdl.component.html',
  styleUrls: ['./wsdl.component.scss'],
  standalone: false
})
export class WsdlComponent implements OnInit {

  @Input('api') api: any = null;
  @Input('environment') environment: string = '';
  
  // @ViewChild('wsdlui') wsdlDom!: ElementRef<HTMLDivElement>;

  _currentStatus: string = '';
  _configStatus: any = null;
  _cambioStato: any = null;

  _hasSpecifica: boolean = false;
  _risorse: any = null;

  _loading: boolean = false;

  _error: boolean = false;
  _errorMsg: string = '';

  constructor(
    private elementRef: ElementRef,
    public apiService: OpenAPIService
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.api) {
      this.api = changes.api.currentValue;
      this._initWsdl();
    }
  }

  _initWsdl() {
    console.log('_initWsdl', this.api);
    const configurazione = this.environment === 'collaudo' ? this.api?.configurazione_collaudo : this.api?.configurazione_produzione;
    if (configurazione) {
      this._error = false;
      const _apiType: string = configurazione.protocollo;
      const _uuid: string = configurazione.specifica.uuid;
      if (_apiType) {
        this._hasSpecifica = true;
        const _body: any = {
          api_type: _apiType,
          document: {
            type: 'uuid',
            uuid: _uuid
          }
        };
  
        this._loading = true;
        this.apiService.saveElement('tools/lista-operazioni-wsdl', _body).subscribe({
            next: (response: any) => {
              this._risorse = response;
              this._loading = false;
            },
            error: (error: any) => {
              this._error = true;
              this._errorMsg = Tools.GetErrorMsg(error);
              this._risorse = [];
              this._loading = false;
            }
          });
      }
    }
  }
}
