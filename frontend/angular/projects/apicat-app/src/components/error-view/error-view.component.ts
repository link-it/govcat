import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import { Tools } from 'projects/tools/src/lib/tools.service';

@Component({
  selector: 'ui-error-view',
  templateUrl: './error-view.component.html',
  styleUrls: ['./error-view.component.scss']
})
export class ErrorViewComponent implements OnInit {

  @Input('errTitle') title: string | null = null;
  @Input('errors') errors: any = null;
  
  constructor() { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.title) {
      this.title = changes.title.currentValue;
    }
    if (changes.errors) {
      this.errors = changes.errors.currentValue;
    }
  }

  _getCustomFieldLabel(field: string) {
    const _elem = Tools.CustomFieldsLabel.find((item: any) => item.label === field)
    return _elem?.value || field;
  }

  _getProfiloLabel(cod: string) {
    const _srv: any = Tools.Configurazione.servizio;
    const _profili = (_srv && _srv.api) ? _srv.api.profili : [];
    const _profilo = _profili.find((item: any) => item.codice_interno === cod);
    return _profilo ? _profilo.etichetta : cod;
  }

  _getParms(err: any) {
    const _params = err.params || {};
    switch (err.sottotipo) {
      case 'Profilo':
        _params['profilo'] = this._getProfiloLabel(_params['profilo']);
        break;
      default:
        break;
    }
    return _params;
  }
}
