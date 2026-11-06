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
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TranslateModule } from '@ngx-translate/core';
import { COMPONENTS_IMPORTS, ConfigService } from '@linkit/components';

import { Grant } from '@app/model/grant';

import { AuthenticationService } from '@app/services/authentication.service';
import { StoricoStatiDialogComponent } from '@app/components/storico-stati/storico-stati-dialog.component';
import { risorsaStoricoStati, storicoStatiAttivo, storicoStatiMockAttivo } from '@app/components/storico-stati/storico-stati';

@Component({
  selector: 'ui-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
  standalone: true,
  imports: [CommonModule, TooltipModule, TranslateModule, ...COMPONENTS_IMPORTS]
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

  /** Voce "Storico degli stati" in fondo al menu, se abilitata nella configurazione. */
  _storicoAttivo: boolean = false;

  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly configService: ConfigService,
    private readonly modalService: BsModalService
  ) { }

  ngOnInit() {
    this._storicoAttivo = storicoStatiAttivo(this.configService.getConfiguration()) && !!risorsaStoricoStati(this.module, this.data);
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

  /** Voci di cambio di stato presenti nel menu, prima dello storico. */
  get _haCambiStato(): boolean {
    return (this._currentStatus !== this._statoArchiviato.nome && !!this._cambioStato) || this._currentStatus === this._statoArchiviato.nome;
  }

  apriStorico() {
    this.modalService.show(StoricoStatiDialogComponent, {
      class: 'modal-drawer-end',
      ignoreBackdropClick: false,
      initialState: {
        modulo: this.module as any,
        data: this.data,
        sottotitolo: this._sottotitoloStorico(),
        stati: this.config?.options?.status?.values || {},
        workflow: this.workflow,
        mock: storicoStatiMockAttivo(this.configService.getConfiguration())
      }
    });
  }

  private _sottotitoloStorico(): string {
    if (this.module === 'adesione') {
      const _servizio = this.data?.servizio;
      return [this.data?.soggetto?.nome, _servizio ? `${_servizio.nome} v. ${_servizio.versione}` : ''].filter(Boolean).join(' · ');
    }
    return this.data?.nome ? `${this.data.nome} v. ${this.data.versione}` : '';
  }

  /**
   * La scelta collaudo vs salta-collaudo (flag `data.skip_collaudo`) deve
   * riflettersi nelle transizioni offerte (adesioni e servizi).
   */
  _isTransitionVisible = (nome: string): boolean => {
    return this.authenticationService.isTransitionVisibleForSkipCollaudo(this._cambioStato, nome, !!this.data?.skip_collaudo);
  };

  /** `stati_ulteriori` filtrati in base a `skip_collaudo` (vedi
   *  `_isTransitionVisible`). */
  get _visibleStatiUlteriori(): any[] {
    return (this._cambioStato?.stati_ulteriori || []).filter((s: any) => this._isTransitionVisible(s?.nome));
  }

  /**
   * Profili dei client richiesti dell'entita` (adesione), usati per il gate
   * `profili` sulle transizioni (Issue #322). Vuoto per moduli/entita` senza
   * `client_richiesti` -> nessun vincolo.
   */
  private _requiredProfiles(): string[] {
    return this.authenticationService.getRequiredProfiles(this.data);
  }

  isActionEnabled(type: string) {
    return this.authenticationService.canChangeStatus(this.module, this.data.stato, type, this.grant?.ruoli, '', this._requiredProfiles());
  }
  
  isGestore() {
    return this.authenticationService.isGestore(this.grant?.ruoli);
  }

  canArchiviare() {
    return this.authenticationService.canArchiviare(this.module, this.data.stato, this.grant?.ruoli);
  }

  _isActionEnabledMapper = (type: string, statusName: string = ''): boolean => {
    return this.authenticationService.canChangeStatus(this.module, this.data.stato, type, this.grant?.ruoli, statusName, this._requiredProfiles());
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
