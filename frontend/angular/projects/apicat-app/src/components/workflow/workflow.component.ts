import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Grant } from '@app/model/grant';

import { AuthenticationService } from '@app/services/authentication.service';

@Component({
  selector: 'ui-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
  standalone: false

})
export class WorkflowComponent implements OnInit {

  @Input('data') data: any = null;
  @Input('module') module: string = '';
  @Input('grant') grant: Grant | null = null;
  @Input('config') config: any = null;
  @Input('workflow') workflow: any = null;
  @Input('showStatus') showStatus: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();
  
  _currentStatus: string = '';
  _previousStatus: any = null;
  _configStatus: any = null;
  _cambioStato: any = null;

  _statoArchiviato: any = {
      nome: 'archiviato',
      ruoli_abilitati: []
    };

  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this._currentStatus = this.data.stato;
    if (this._currentStatus === this._statoArchiviato.nome) {
      this._previousStatus = { nome: this.data.stato_precedente };
    } else {
      const _index = this.workflow.cambi_stato.findIndex((item: any) => item.stato_attuale === this._currentStatus);
      this._cambioStato = (_index !== -1) ? this.workflow.cambi_stato[_index] : null;
      this._configStatus = this.config.options.status.values[this._currentStatus];
    }
  }

  onAction(action: any, status: any) {
    this.action.emit({action: action, status: status});
  }

  isActionEnabled(type: string) {
    return this.authenticationService.canChangeStatus(this.module, this.data.stato, type, this.grant?.ruoli);
  }
  
  isGestore() {
    return this.authenticationService.isGestore(this.grant?.ruoli);
  }

  _isActionEnabledMapper = (type: string, statusName: string = ''): boolean => {
    return this.authenticationService.canChangeStatus(this.module, this.data.stato, type, this.grant?.ruoli, statusName);
  }

  _isGestoreMapper = (): boolean => {
    return this.authenticationService.isGestore(this.grant?.ruoli);
  }

  _hasActions() {
    if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
    const _statoPrecedetene: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stato_precedente', this.grant?.ruoli);
    const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stato_successivo', this.grant?.ruoli);
    const _statiUlteriori: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stati_ulteriori', this.grant?.ruoli);
    return (_statoPrecedetene || _statoSuccessivo || _statiUlteriori);
  }
}
