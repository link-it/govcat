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
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';

import { ItemOrganizzazione } from '../../model/itemOrganizzazione';
import { OrganizzazioneUtentiListComponent } from '../../views/organizzazioni/organizzazione-details/organizzazione-utenti-list/organizzazione-utenti-list.component';

/**
 * Dialog "Gestisci organizzazione" aperta dal selettore organizzazione
 * quando l'utente e' amministratore dell'organizzazione. Mostra in
 * intestazione i dati dell'organizzazione (sola lettura) e nel corpo
 * la lista utenti con CRUD (riusa `OrganizzazioneUtentiListComponent`).
 */
@Component({
    selector: 'app-organization-manage-dialog',
    templateUrl: './organization-manage-dialog.component.html',
    standalone: true,
    imports: [CommonModule, TranslateModule, LnkButtonComponent, OrganizzazioneUtentiListComponent]
})
export class OrganizationManageDialogComponent {

    /** Organizzazione da gestire (passata via `initialState`). */
    organizzazione: ItemOrganizzazione | null = null;

    private readonly modalRef = inject(BsModalRef);

    get idOrganizzazione(): string | null {
        return this.organizzazione?.id_organizzazione || null;
    }

    close(): void {
        this.modalRef.hide();
    }
}
