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
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { ServizioApiPdndInformationsComponent } from '../servizio-api-pdnd-informations/servizio-api-pdnd-informations.component';
import { ServizioApiSubscribersComponent } from '../servizio-api-subscribers/servizio-api-subscribers.component';

/**
 * Dialog della vetrina che mostra, per l'API scelta nel selettore dell'header,
 * la pagina "Informazioni PDND" o "Fruitori" in modalità embedded. Le API
 * elencate sono quelle con il menù PDND abilitato (configurate correttamente).
 */
@Component({
  selector: 'app-pdnd-menu-dialog',
  templateUrl: './pdnd-menu-dialog.component.html',
  styleUrls: ['./pdnd-menu-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ...COMPONENTS_IMPORTS,
    ServizioApiPdndInformationsComponent,
    ServizioApiSubscribersComponent
  ]
})
export class PdndMenuDialogComponent {

  // Impostati via initialState di BsModalService.show(...).
  mode: 'informations' | 'subscribers' = 'informations';
  apis: any[] = [];
  sid: string | null = null;
  producerIdCollaudo: string = '';
  producerIdProduzione: string = '';

  selectedApiId: string | null = null;

  constructor(public bsModalRef: BsModalRef) { }

  get titleKey(): string {
    return this.mode === 'subscribers'
      ? 'APP.SERVICES.MENU.PDNDUsers'
      : 'APP.SERVICES.MENU.PDNDGeneralInformations';
  }

  get selectedApi(): any | null {
    return this.apis.find((a: any) => a.id_api === this.selectedApiId) || null;
  }

  /** Array a un elemento usato dal `@for` (track id_api) per ri-creare il
   *  componente figlio quando cambia l'API selezionata. */
  get selectedApiList(): any[] {
    const _api = this.selectedApi;
    return _api ? [_api] : [];
  }

  apiLabel(api: any): string {
    if (!api) { return ''; }
    return api.versione ? `${api.nome} v. ${api.versione}` : `${api.nome}`;
  }

  selectApi(api: any) {
    this.selectedApiId = api?.id_api ?? null;
  }

  closeModal() {
    this.bsModalRef.hide();
  }
}
