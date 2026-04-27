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
 * Pannello debug (solo dev) per provare la dialog di configurazione client
 * in tutte le sue combinazioni scenario/authType/certificato senza avere
 * dati reali. Il save e' simulato: logga in console e chiude la dialog.
 * Reso nel wizard solo quando `wizard_debug_switches` e' attivo.
 */

import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

import { ModalEditClientComponent, ModalEditClientInput, ModalEditClientLayout } from '../adesione-lista-clients/modal-edit-client/modal-edit-client.component';
import { CertificateMode } from '../adesione-lista-clients/client-dialog-state';
import {
    DIALOG_MOCK_PRESETS,
    DialogMockPreset,
    buildMockDialogInput,
    certModeFromValore,
    rebuildMockFormConfig,
} from '../adesione-lista-clients/client-dialog-mock';

@Component({
    selector: 'app-adesione-dialog-mock-panel',
    templateUrl: './adesione-dialog-mock-panel.component.html',
    styleUrls: ['./adesione-dialog-mock-panel.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ModalEditClientComponent,
    ],
})
export class AdesioneDialogMockPanelComponent {
    @ViewChild('mockDialog', { static: true }) mockDialog!: TemplateRef<any>;

    readonly presets: DialogMockPreset[] = DIALOG_MOCK_PRESETS;
    selectedPresetId: string = DIALOG_MOCK_PRESETS[0]?.id ?? '';

    mockInput: ModalEditClientInput | null = null;
    mockLayout: ModalEditClientLayout = 'vertical';

    private activePreset: DialogMockPreset | null = null;
    private currentCertAuth: CertificateMode = { kind: 'none' };
    private currentCertSign: CertificateMode = { kind: 'none' };
    private modalRef: BsModalRef | null = null;

    constructor(private readonly modalService: BsModalService) {}

    openMock(): void {
        const preset = this.presets.find(p => p.id === this.selectedPresetId);
        if (!preset) return;
        this.activePreset = preset;
        this.currentCertAuth = preset.certAuth ?? { kind: 'none' };
        this.currentCertSign = preset.certSign ?? { kind: 'none' };
        this.mockInput = buildMockDialogInput(preset);
        this.mockLayout = preset.layout ?? 'vertical';
        const opts: ModalOptions = {
            class: this.mockLayout === 'horizontal' ? 'modal-edit-client-horizontal' : 'modal-half-',
            ignoreBackdropClick: true,
        };
        this.modalRef = this.modalService.show(this.mockDialog, opts);
    }

    onLayoutChange(next: ModalEditClientLayout): void {
        this.mockLayout = next;
        this.modalRef?.setClass?.(next === 'horizontal' ? 'modal-edit-client-horizontal' : 'modal-half-');
    }

    // Rebuild della formConfig quando l'utente cambia il dropdown
    // tipo_certificato (auth/firma): mostra/nasconde i blocchi richiesto_cn
    // / richiesto_csr coerentemente con la scelta.
    onChangeTipoCertificato(event: any): void {
        this.currentCertAuth = certModeFromValore(event?.valore);
        this.recomputeFormConfig();
    }

    onChangeTipoCertificatoFirma(event: any): void {
        this.currentCertSign = certModeFromValore(event?.valore);
        this.recomputeFormConfig();
    }

    onMockSave(): void {
        const fg = this.mockInput?.formGroup;
        const descrittori = {
            auth_cert: this.mockInput?.descrittoreCtrl?.value ?? null,
            auth_csr: this.mockInput?.descrittoreCtrlCsr?.value ?? null,
            auth_csr_modulo: this.mockInput?.descrittoreCtrlCsrModulo?.value ?? null,
            firma_cert: this.mockInput?.descrittoreCtrlFirma?.value ?? null,
            firma_csr: this.mockInput?.descrittoreCtrlCsrFirma?.value ?? null,
            firma_csr_modulo: this.mockInput?.descrittoreCtrlCsrModuloFirma?.value ?? null,
        };
        // eslint-disable-next-line no-console
        console.log('[mock dialog] save', {
            preset: this.activePreset?.id,
            scenario: this.activePreset?.scenario,
            authType: this.activePreset?.authType,
            certAuth: this.currentCertAuth,
            certSign: this.currentCertSign,
            form: fg?.getRawValue(),
            descrittori,
        });
        this.closeModal();
    }

    onMockClose(): void {
        this.closeModal();
    }

    private recomputeFormConfig(): void {
        if (!this.mockInput || !this.activePreset) return;
        this.mockInput = {
            ...this.mockInput,
            formConfig: rebuildMockFormConfig(this.activePreset, this.currentCertAuth, this.currentCertSign),
        };
    }

    private closeModal(): void {
        this.modalRef?.hide();
        this.modalRef = null;
        this.mockInput = null;
        this.activePreset = null;
    }
}
