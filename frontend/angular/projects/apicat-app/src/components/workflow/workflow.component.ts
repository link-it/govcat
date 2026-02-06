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

  @Input() data: any = null;
  @Input() module: string = '';
  @Input() grant: Grant | null = null;
  @Input() config: any = null;
  @Input() workflow: any = null;
  @Input() showStatus: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();
  
  _currentStatus: string = '';
  _previousStatus: any = null;
  _configStatus: any = null;
  _cambioStato: any = null;

  _statoArchiviato: any = {
      nome: 'archiviato',
      ruoli_abilitati: []
    };

  constructor(private readonly authenticationService: AuthenticationService) { }

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

  canArchiviare() {
    return this.authenticationService.canArchiviare(this.module, this.data.stato, this.grant?.ruoli);
  }

  _isActionEnabledMapper = (type: string, statusName: string = ''): boolean => {
    return this.authenticationService.canChangeStatus(this.module, this.data.stato, type, this.grant?.ruoli, statusName);
  }

  _isGestoreMapper = (): boolean => {
    return this.authenticationService.isGestore(this.grant?.ruoli);
  }

  _canArchiviareMapper = (): boolean => {
    return this.authenticationService.canArchiviare(this.module, this.data.stato, this.grant?.ruoli);
  }

  _hasActions() {
    if (this.authenticationService.isGestore(this.grant?.ruoli)) { return true; }
    const _statoPrecedetene: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stato_precedente', this.grant?.ruoli);
    const _statoSuccessivo: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stato_successivo', this.grant?.ruoli);
    const _statiUlteriori: boolean = this.authenticationService.canChangeStatus(this.module, this.data.stato, 'stati_ulteriori', this.grant?.ruoli);
    const _canArchiviare: boolean = this.authenticationService.canArchiviare(this.module, this.data.stato, this.grant?.ruoli);
    return (_statoPrecedetene || _statoSuccessivo || _statiUlteriori || _canArchiviare);
  }
}
