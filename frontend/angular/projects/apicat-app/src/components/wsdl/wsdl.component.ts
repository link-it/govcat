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
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { Tools } from '@linkit/components';

import { OpenAPIService } from '@app/services/openAPI.service';
import { etichettaUrlInvocazione, URL_INVOCAZIONE_DEFAULT } from '@app/views/servizi/servizio-api-url-invocazione';

/** Riga dell'elenco URL di un port type: etichetta configurata oppure chiave i18n di ripiego. */
export interface WsdlUrlRiga {
  etichetta: string | null;
  etichettaKey: string;
  url: string;
}

@Component({
  selector: 'ui-wsdl',
  templateUrl: './wsdl.component.html',
  styleUrls: ['./wsdl.component.scss'],
  standalone: true,
  imports: [CommonModule, TooltipModule, TranslateModule]
})
export class WsdlComponent implements OnChanges {

  @Input() api: any = null;
  @Input() environment: string = '';
  /**
   * Issue #332: nasconde il blocco "Url invocazione" per port_type quando l'URL
   * è già mostrato dal contenitore (barra unificata con pulsante Copia).
   */
  @Input() hideUrlInvocazione: boolean = false;
  
  // @ViewChild('wsdlui') wsdlDom!: ElementRef<HTMLDivElement>;

  _currentStatus: string = '';
  _configStatus: any = null;
  _cambioStato: any = null;

  _hasSpecifica: boolean = false;
  _risorse: any = null;

  _loading: boolean = false;

  _error: boolean = false;
  _errorMsg: string = '';

  /** Riga copiata di recente, come `<indice port type>-<indice riga>`. */
  _urlCopiata: string | null = null;

  apiService = inject(OpenAPIService);
  private readonly clipboard = inject(Clipboard);

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
          },
          id_api: this.api.id_api,
          ambiente: this.environment
        };
  
        this._loading = true;
        this.apiService.saveElement('tools/lista-operazioni-wsdl', _body).subscribe({
            next: (response: any) => {
              this._risorse = Array.isArray(response)
                ? response.map((item: any) => ({ ...item, _urlRighe: this._urlRighe(item) }))
                : response;
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

  /**
   * URL di invocazione del port type: la prima (che puo` non essere la predefinita) e le
   * aggiuntive con la propria etichetta. L'etichetta della prima si ricava dalla selezione
   * dell'API quando disponibile (dettaglio), altrimenti resta generica.
   */
  _urlRighe(item: any): WsdlUrlRiga[] {
    if (!item?.url_invocazione) { return []; }
    const ambiente = this.environment === 'produzione' ? 'produzione' : 'collaudo';
    const configurazione = ambiente === 'collaudo' ? this.api?.configurazione_collaudo : this.api?.configurazione_produzione;
    const primo: string | null = configurazione?.url_invocazione?.[0] || null;
    const righe: WsdlUrlRiga[] = [{
      etichetta: primo ? etichettaUrlInvocazione(primo, ambiente) : null,
      etichettaKey: primo === URL_INVOCAZIONE_DEFAULT ? 'APP.LABEL.UrlPredefinita' : 'APP.WSDL.LABEL.UrlInvocazione',
      url: item.url_invocazione
    }];
    (item.url_invocazione_aggiuntive || []).filter((u: any) => !!u?.url_invocazione).forEach((u: any) => {
      righe.push({
        etichetta: u.etichetta || etichettaUrlInvocazione(u.identificativo, ambiente),
        etichettaKey: 'APP.WSDL.LABEL.UrlInvocazione',
        url: u.url_invocazione
      });
    });
    return righe;
  }

  copyUrl(url: string, chiave: string) {
    this.clipboard.copy(url);
    this._urlCopiata = chiave;
    setTimeout(() => { if (this._urlCopiata === chiave) { this._urlCopiata = null; } }, 3000);
  }
}
