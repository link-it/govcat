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

/**
 * Scaffold della Fase 6.0 (Issue #237) — estrazione della dialog di
 * configurazione autenticazione client in un componente standalone
 * presentational. In questo primo commit il componente NON e' ancora
 * wired-up al parent: vengono definiti solo il contratto Input/Output
 * e il guscio del template. La migrazione del markup dal parent e il
 * wiring avverranno in commit successivi (6.1, 6.2).
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { ClientAuthFormComponent } from '@app/components/client-auth-form/client-auth-form.component';

import { FormConfig } from '../client-dialog-state';
import { SelectedClientEnum } from '../../../adesione-configurazioni/adesione-configurazioni.component';

/**
 * Input contract per la dialog.
 * Il parent possiede il `FormGroup` e la logica applicativa; questo
 * componente e' puramente presentational.
 */
export interface ModalEditClientInput {
    formGroup: FormGroup;
    formConfig: FormConfig;
    clientsRiuso: Array<{ id_client: any; nome: string }>;
    tipiCertificato: Array<{ nome: string; valore: string }>;

    // Stato salvataggio / errore
    saving: boolean;
    error: boolean;
    errorMsg: string;

    // Certificato di autenticazione (slot per dati gia' caricati / upload UI)
    certificatoFornito: any;
    certificatoCN: any;
    certificatoCSR: any;
    moduloRichiestaCSR: any;

    // Certificato di firma
    certificatoFornitoFirma: any;
    certificatoCNFirma: any;
    certificatoCSRFirma: any;
    moduloRichiestaCSRFirma: any;
    moduloRichiestaCSRFirmaCertificato: any;

    // Flag contestuali
    ipRichiesto: boolean;
    isEditClient: boolean;
    currentServiceClient: any;

    // Props per download certificato (url construction)
    adesioneId: number;
    environment: string;
    authType: string;
    codiceInternoProfilo: any;
    client: any;

    // File-upload descriptor FormControls (owned by parent).
    descrittoreCtrl: FormControl;
    descrittoreCtrlCsr: FormControl;
    descrittoreCtrlCsrModulo: FormControl;
    descrittoreCtrlFirma: FormControl;
    descrittoreCtrlCsrFirma: FormControl;
    descrittoreCtrlCsrModuloFirma: FormControl;

    // Lista dei periodi per il rate-limiting dropdown.
    ratePeriods: Array<{ value: any; label: string }>;
}

/** Modalita' di layout del form della dialog. */
export type ModalEditClientLayout = 'vertical' | 'horizontal';

@Component({
    selector: 'app-modal-edit-client',
    templateUrl: './modal-edit-client.component.html',
    styleUrls: ['./modal-edit-client.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        TooltipModule,
        ClientAuthFormComponent,
    ]
})
export class ModalEditClientComponent {
    /** Unico input di configurazione/stato. */
    @Input({ required: true }) input!: ModalEditClientInput;

    /**
     * Layout del form:
     * - `vertical` (default): stack verticale, modal `modal-half-`.
     * - `horizontal`: griglia a 2 colonne per blocchi certificato e URL
     *   OAuth + modal piu' largo (parent e' responsabile di chiamare
     *   `BsModalRef.setClass('modal-xl')` in risposta a `layoutChange`).
     */
    @Input() layout: ModalEditClientLayout = 'vertical';

    /** L'utente ha cliccato il toggle di layout verticale/orizzontale. */
    @Output() layoutChange = new EventEmitter<ModalEditClientLayout>();

    /** L'utente ha cliccato uno dei toggle del selettore credenziali. */
    @Output() selectCredenziali = new EventEmitter<SelectedClientEnum>();

    /** Cambio sul dropdown del tipo certificato (auth). */
    @Output() changeTipoCertificato = new EventEmitter<any>();

    /** Cambio sul dropdown del tipo certificato (firma). */
    @Output() changeTipoCertificatoFirma = new EventEmitter<any>();

    /** Cambio sul selettore credenziali (dropdown mode). */
    @Output() changeCredenziali = new EventEmitter<any>();

    /** Cambio di un descrittore (auth cert upload). */
    @Output() descriptorChange = new EventEmitter<{ value: any; type: string }>();

    /** Cambio di un descrittore (firma cert upload). */
    @Output() descriptorChangeFirma = new EventEmitter<{ value: any; type: string }>();

    /** Click su "Salva" del footer. */
    @Output() save = new EventEmitter<void>();

    /** Click su "Chiudi" del footer. */
    @Output() close = new EventEmitter<void>();

    /** Click sul link di download del certificato (partial URL). */
    @Output() downloadCertificato = new EventEmitter<string>();

    /** Download diretto di un allegato gia' in memoria (certificato salvato). */
    @Output() downloadAllegato = new EventEmitter<any>();

    // Esposto per il template (sintassi toggle)
    readonly SelectedClientEnum = SelectedClientEnum;

    // =========================================================================
    // Helper getter / method per il template (specchio di quelli sul parent).
    // =========================================================================

    /** Controls del FormGroup (shortcut stile `f['nome']`). */
    get f(): { [key: string]: AbstractControl } {
        return this.input?.formGroup?.controls ?? {};
    }

    /** Controls del sotto-FormGroup `rate_limiting`. */
    get fRate(): { [key: string]: AbstractControl } {
        const rate = this.input?.formGroup?.get('rate_limiting');
        return (rate as FormGroup)?.controls ?? {};
    }

    /** True se il FormControl ha errori attivi e touched. */
    _hasControlError(name: string): boolean {
        const ctrl = this.f[name];
        return !!(ctrl && ctrl.errors && ctrl.touched);
    }

    /**
     * True se la selezione credenziali corrente corrisponde al client
     * attualmente riferito — abilita i pulsanti di download del certificato.
     */
    _downloadsEnabled(): boolean {
        return this.input?.currentServiceClient === this.f['credenziali']?.value;
    }

    /**
     * Lista dei client reali (esclude le meta-voci NuovoCliente /
     * UsaClientEsistente usate come label del toggle). Usata per
     * popolare il dropdown "Client già censito".
     */
    get managedClients(): Array<{ id_client: any; nome: string }> {
        return (this.input?.clientsRiuso ?? []).filter((c) =>
            c.id_client !== SelectedClientEnum.NuovoCliente
            && c.id_client !== SelectedClientEnum.UsaClientEsistente
            && c.id_client !== null
            && c.id_client !== undefined
        );
    }

    /**
     * True quando l'utente ha selezionato "Client già censito" dal toggle.
     * Fonte di verità: valore corrente del FormControl `credenziali`.
     */
    get isClientGiaCensitoSelected(): boolean {
        return this.f['credenziali']?.value === SelectedClientEnum.UsaClientEsistente
            || this.managedClients.some((c) => c.id_client === this.f['credenziali']?.value);
    }

    /** Toggle del layout: emette nuovo valore verso il parent. */
    toggleLayout(): void {
        const next: ModalEditClientLayout = this.layout === 'horizontal' ? 'vertical' : 'horizontal';
        this.layout = next;
        this.layoutChange.emit(next);
    }
}
