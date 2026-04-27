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
 * Componente condiviso (Issue #237 Passo 2) per la configurazione di
 * autenticazione di un Client. Usato sia dalla dialog del wizard adesioni
 * (`ModalEditClientComponent`) sia dalla pagina `ClientDetailsComponent`.
 *
 * E' un componente *presentational*: non fa chiamate API, non possiede
 * il FormGroup (lo riceve in input), non decide le regole di
 * scenario/authType (guidato da `FormConfig` fornita dal parent via
 * `computeFormConfig`).
 *
 * Slot gestiti:
 * - Selettore credenziali (toggle / dropdown) + lista client riusabili.
 * - (opzionale) Dropdown `auth_type` quando `config.fields.auth_type.visible`.
 * - Blocchi certificato autenticazione e firma (fornito / richiesto_cn /
 *   richiesto_csr) con upload via `ui-file-dropzone`.
 * - Campi specifici auth type: http_basic username, pdnd client_id, oauth
 *   urls, ecc.
 * - Rate limiting, finalita, ip_fruizione, nome, descrizione.
 *
 * Slot specifici del contesto pagina (opzionali):
 * - Upload "certificato generato" post-CN/CSR (4 varianti: auth-cn,
 *   auth-csr, firma-cn, firma-csr). Non visualizzati se il corrispondente
 *   `descrittoreCtrlCertGenerato*` non e' fornito.
 */

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { COMPONENTS_IMPORTS } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';

import { AuthType, FormConfig } from '@app/views/adesioni/adesione-configurazione-wizard/adesione-lista-clients/client-dialog-state';
import { SelectedClientEnum } from '@app/views/adesioni/adesione-configurazioni/adesione-configurazioni.component';

/**
 * Input contract del componente condiviso. Non dipende dal contesto
 * (dialog adesione o pagina client): il parent costruisce l'oggetto
 * dai propri dati.
 */
export interface ClientAuthFormInput {
    /** FormGroup posseduto dal parent. */
    formGroup: FormGroup;
    /** Configurazione calcolata dal parent via `computeFormConfig()`. */
    formConfig: FormConfig;

    /** Lista client riusabili per il dropdown / toggle "Client gia' censito". */
    clientsRiuso: Array<{ id_client: any; nome: string }>;
    /** Opzioni del dropdown "tipo certificato" (e firma). */
    tipiCertificato: Array<{ nome: string; valore: string }>;
    /** Opzioni del dropdown "periodo" rate-limiting. */
    ratePeriods: Array<{ value: any; label: string }>;

    /** Lista opzioni `auth_type` — usata solo se `formConfig.fields.auth_type.visible`. */
    authTypes?: Array<string>;

    // ---- Stato UI ----
    saving: boolean;
    error: boolean;
    errorMsg: string;

    // ---- Certificati gia' caricati (mostrati come download, non upload) ----
    certificatoFornito: any;
    certificatoCN: any;
    certificatoCSR: any;
    moduloRichiestaCSR: any;
    certificatoFornitoFirma: any;
    certificatoCNFirma: any;
    certificatoCSRFirma: any;
    moduloRichiestaCSRFirma: any;
    moduloRichiestaCSRFirmaCertificato: any;
    /**
     * Cert generato dal gestore post richiesta CSR (auth). Usato solo
     * nel contesto pagina (dialog non lo espone).
     */
    certificatoCertGeneratoCsr?: any;
    /** Cert generato dal gestore post richiesta CSR (firma). */
    certificatoCertGeneratoCsrFirma?: any;

    // ---- Descrittori upload: 6 standard (parent-owned FormControl) ----
    descrittoreCtrl: FormControl;
    descrittoreCtrlCsr: FormControl;
    descrittoreCtrlCsrModulo: FormControl;
    descrittoreCtrlFirma: FormControl;
    descrittoreCtrlCsrFirma: FormControl;
    descrittoreCtrlCsrModuloFirma: FormControl;

    // ---- Descrittori upload extra (opzionali, solo contesto pagina) ----
    /** Upload cert emesso dal gestore post richiesta CN (auth). */
    descrittoreCtrlCertGeneratoCn?: FormControl;
    /** Upload cert emesso dal gestore post richiesta CSR (auth). */
    descrittoreCtrlCertGeneratoCsr?: FormControl;
    /** Upload cert emesso dal gestore post richiesta CN (firma). */
    descrittoreCtrlCertGeneratoCnFirma?: FormControl;
    /** Upload cert emesso dal gestore post richiesta CSR (firma). */
    descrittoreCtrlCertGeneratoCsrFirma?: FormControl;

    // ---- Flag contestuali ----
    ipRichiesto: boolean;
    /** Usato dal download: se il valore di `credenziali` corrisponde al client corrente. */
    currentServiceClient?: any;
    /**
     * Se `true`, in scenario editabile (new/edit non readonly) mostra
     * sempre la dropzone di upload anche quando un certificato e' gia'
     * caricato, permettendo all'utente di sostituirlo. Usato dalla pagina
     * `client-details`; nella dialog del wizard resta `false` (default)
     * e quando un cert e' caricato si mostra solo il pulsante Download.
     */
    allowCertReplace?: boolean;

    // ---- Metadata per costruire URL di download (dialog) ----
    adesioneId?: number;
    environment?: string;
    authType?: string;
    codiceInternoProfilo?: any;
    client?: any;
}

/** Layout del form: verticale (default) o orizzontale su 2 colonne. */
export type ClientAuthFormLayout = 'vertical' | 'horizontal';

@Component({
    selector: 'app-client-auth-form',
    templateUrl: './client-auth-form.component.html',
    styleUrls: ['./client-auth-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        ...COMPONENTS_IMPORTS,
        ...APP_COMPONENTS_IMPORTS,
        TooltipModule,
        NgSelectModule,
        MarkAsteriskDirective,
    ],
})
export class ClientAuthFormComponent {
    @Input({ required: true }) input!: ClientAuthFormInput;
    @Input() layout: ClientAuthFormLayout = 'vertical';

    @Output() changeAuthType = new EventEmitter<any>();
    @Output() selectCredenziali = new EventEmitter<SelectedClientEnum>();
    @Output() changeCredenziali = new EventEmitter<any>();
    @Output() changeTipoCertificato = new EventEmitter<any>();
    @Output() changeTipoCertificatoFirma = new EventEmitter<any>();
    @Output() descriptorChange = new EventEmitter<{ value: any; type: string }>();
    @Output() descriptorChangeFirma = new EventEmitter<{ value: any; type: string }>();
    @Output() downloadCertificato = new EventEmitter<string>();
    @Output() downloadAllegato = new EventEmitter<any>();

    readonly SelectedClientEnum = SelectedClientEnum;

    get f(): { [key: string]: AbstractControl } {
        return this.input?.formGroup?.controls ?? {};
    }

    get fRate(): { [key: string]: AbstractControl } {
        const rate = this.input?.formGroup?.get('rate_limiting');
        return (rate as FormGroup)?.controls ?? {};
    }

    _hasControlError(name: string): boolean {
        const ctrl = this.f[name];
        return !!(ctrl && ctrl.errors && ctrl.touched);
    }

    /**
     * True quando il parent consente la sostituzione del cert gia' caricato
     * (contesto pagina in edit mode). Usata dal template per mostrare la
     * dropzone al posto del pulsante Download.
     */
    get _allowCertReplaceNow(): boolean {
        return !!this.input?.allowCertReplace
            && this.input?.formConfig?.scenario?.kind !== 'readonly';
    }

    /**
     * True se il pulsante di download del certificato va abilitato.
     * - Nella dialog (toggle credenziali visibile): abilita solo quando
     *   `currentServiceClient` combacia col valore di `credenziali`
     *   (evita download "incrociati" fra toggle new/esistente).
     * - Nella pagina client-details (toggle nascosto): il concetto non
     *   si applica, download sempre abilitato quando il cert e' presente.
     */
    _downloadsEnabled(): boolean {
        if (!this.input?.formConfig?.fields?.credenziali?.visible) {
            return true;
        }
        return this.input?.currentServiceClient === this.f['credenziali']?.value;
    }

    /** Lista client reali (esclude meta-voci del toggle). */
    get managedClients(): Array<{ id_client: any; nome: string }> {
        return (this.input?.clientsRiuso ?? []).filter((c) =>
            c.id_client !== SelectedClientEnum.NuovoCliente
            && c.id_client !== SelectedClientEnum.UsaClientEsistente
            && c.id_client !== null
            && c.id_client !== undefined
        );
    }

    /** True quando il toggle "Client gia' censito" e' selezionato. */
    get isClientGiaCensitoSelected(): boolean {
        return this.f['credenziali']?.value === SelectedClientEnum.UsaClientEsistente
            || this.managedClients.some((c) => c.id_client === this.f['credenziali']?.value);
    }
}
