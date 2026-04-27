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
 * Preset mock (dev-only) per la dialog di configurazione autenticazione client.
 * Usati dal pannello debug del wizard per provare tutte le combinazioni di
 * scenario/authType/certificato senza avere dati reali.
 */

import { FormControl, FormGroup } from '@angular/forms';

import { ModalEditClientInput, ModalEditClientLayout } from './modal-edit-client/modal-edit-client.component';
import {
    AuthType,
    CertificateMode,
    CredentialsMode,
    FormConfig,
    Scenario,
    computeFormConfig,
} from './client-dialog-state';

export interface DialogMockPreset {
    id: string;
    label: string;
    description?: string;
    scenario: Scenario;
    authType: AuthType;
    certAuth?: CertificateMode;
    certSign?: CertificateMode;
    credentialsMode?: CredentialsMode;
    layout?: ModalEditClientLayout;
    /** Valori pre-popolati nel FormGroup. */
    values?: Partial<Record<string, any>>;
    /** Numero di client riusabili da mostrare nel dropdown. */
    clientsRiusoCount?: number;
    showIpFruizione?: boolean;
    showRateLimiting?: boolean;
    showFinalita?: boolean;
}

// nome = chiave i18n lower-case (il template usa `'APP.CLIENT.LABEL.' + nome`).
const MOCK_TIPI_CERTIFICATO = [
    { nome: 'fornito', valore: 'fornito' },
    { nome: 'richiesto_cn', valore: 'richiesto_cn' },
    { nome: 'richiesto_csr', valore: 'richiesto_csr' },
];

const MOCK_RATE_PERIODS = [
    { value: 'giorno', label: 'APP.LABEL.Giorno' },
    { value: 'ora', label: 'APP.LABEL.Ora' },
    { value: 'minuti', label: 'APP.LABEL.Minuto' },
];

function certModeToValore(mode: CertificateMode | undefined): string | null {
    if (!mode || mode.kind === 'none') return null;
    return mode.kind;
}

function buildMockFormGroup(preset: DialogMockPreset): FormGroup {
    const v = preset.values ?? {};
    // Se il preset definisce certAuth/certSign e non ha un override esplicito
    // su `values.tipo_certificato(_firma)`, precompiliamo il FormControl con
    // la variante corrispondente — altrimenti il dropdown apparirebbe vuoto.
    const tipoCert = v.tipo_certificato ?? certModeToValore(preset.certAuth);
    const tipoCertFirma = v.tipo_certificato_firma ?? certModeToValore(preset.certSign);
    // Con credentialsMode='dropdown' pre-selezioniamo "Client gia' censito"
    // altrimenti all'apertura verrebbe mostrato solo il toggle.
    const credenzialiDefault = preset.credentialsMode === 'dropdown'
        ? 'usaClientEsistente'
        : null;
    return new FormGroup({
        credenziali: new FormControl(v.credenziali ?? credenzialiDefault),
        nome_proposto: new FormControl(v.nome_proposto ?? null),
        nome: new FormControl(v.nome ?? null),
        tipo_certificato: new FormControl(tipoCert),
        tipo_certificato_firma: new FormControl(tipoCertFirma),

        filename: new FormControl(v.filename ?? null),
        estensione: new FormControl(v.estensione ?? null),
        content: new FormControl(v.content ?? null),
        uuid: new FormControl(v.uuid ?? null),

        filename_firma: new FormControl(v.filename_firma ?? null),
        estensione_firma: new FormControl(v.estensione_firma ?? null),
        content_firma: new FormControl(v.content_firma ?? null),
        uuid_firma: new FormControl(v.uuid_firma ?? null),

        filename_csr: new FormControl(v.filename_csr ?? null),
        estensione_csr: new FormControl(v.estensione_csr ?? null),
        content_csr: new FormControl(v.content_csr ?? null),
        uuid_csr: new FormControl(v.uuid_csr ?? null),

        filename_csr_firma: new FormControl(v.filename_csr_firma ?? null),
        estensione_csr_firma: new FormControl(v.estensione_csr_firma ?? null),
        content_csr_firma: new FormControl(v.content_csr_firma ?? null),
        uuid_csr_firma: new FormControl(v.uuid_csr_firma ?? null),

        cn: new FormControl(v.cn ?? null),
        cn_firma: new FormControl(v.cn_firma ?? null),
        csr: new FormControl(null),
        modulo_richiesta_csr: new FormControl(v.modulo_richiesta_csr ?? null),
        modulo_richiesta_csr_firma: new FormControl(v.modulo_richiesta_csr_firma ?? null),

        ip_fruizione: new FormControl(v.ip_fruizione ?? null),
        descrizione: new FormControl(v.descrizione ?? null),
        rate_limiting: new FormGroup({
            quota: new FormControl(v.rate_limiting_quota ?? null),
            periodo: new FormControl(v.rate_limiting_periodo ?? null),
        }),
        finalita: new FormControl(v.finalita ?? null),
        id_utente: new FormControl(null),

        url_redirezione: new FormControl(v.url_redirezione ?? null),
        url_esposizione: new FormControl(v.url_esposizione ?? null),
        help_desk: new FormControl(v.help_desk ?? null),
        nome_applicazione_portale: new FormControl(v.nome_applicazione_portale ?? null),

        client_id: new FormControl(v.client_id ?? null),
        username: new FormControl(v.username ?? null),
    });
}

function buildMockClientsRiuso(count: number): Array<{ id_client: any; nome: string }> {
    const list: Array<{ id_client: any; nome: string }> = [];
    for (let i = 1; i <= count; i++) {
        list.push({ id_client: 1000 + i, nome: `Mock client ${i}` });
    }
    return list;
}

/**
 * Oggetto "cert gia' caricato" fittizio: ha filename/content_type/content/uuid
 * coerenti con la forma attesa dal template (che usa la presenza
 * dell'oggetto come segnale per mostrare il pulsante di download).
 */
function fakeCert(filename: string): any {
    return {
        filename,
        content_type: 'application/x-pem-file',
        content: 'MOCK_BASE64_CONTENT_NOT_DOWNLOADABLE',
        uuid: `mock-${filename}`,
    };
}

function fakeModuloCsr(): any {
    return {
        filename: 'modulo-richiesta-csr.pdf',
        content_type: 'application/pdf',
        content: 'MOCK_BASE64_PDF',
        uuid: 'mock-modulo-csr',
    };
}

/**
 * True se lo scenario corrisponde a un client gia' configurato (edit /
 * readonly / referenced): in questi casi i certificati devono risultare
 * gia' caricati per mostrare il pulsante di download al posto della
 * dropzone di upload.
 */
function scenarioImpliesLoadedCerts(scenario: Scenario): boolean {
    return scenario.kind === 'edit' || scenario.kind === 'readonly' || scenario.kind === 'referenced';
}

interface CertSlots {
    certificatoFornito: any;
    certificatoCN: any;
    certificatoCSR: any;
    moduloRichiestaCSR: any;
}

/**
 * Ritorna gli slot di certificato pre-popolati in base al `CertificateMode`
 * e allo scenario. Per scenari "non configurati" (new/proposed) ritorna
 * tutto null in modo che la dropzone rimanga attiva per l'upload.
 */
function buildCertSlots(mode: CertificateMode, scenario: Scenario, prefix: string): CertSlots {
    const empty: CertSlots = {
        certificatoFornito: null,
        certificatoCN: null,
        certificatoCSR: null,
        moduloRichiestaCSR: null,
    };
    if (!scenarioImpliesLoadedCerts(scenario)) return empty;
    switch (mode.kind) {
        case 'fornito':
            return { ...empty, certificatoFornito: fakeCert(`${prefix}-cert.pem`) };
        case 'richiesto_cn':
            return { ...empty, certificatoCN: fakeCert(`${prefix}-cn-cert.pem`) };
        case 'richiesto_csr':
            return {
                ...empty,
                certificatoCSR: fakeCert(`${prefix}-csr-cert.pem`),
                moduloRichiestaCSR: fakeModuloCsr(),
            };
        default:
            return empty;
    }
}

/**
 * Mappa il `valore` restituito dall'evento `changeTipoCertificato`
 * (es. `'fornito'`) in un `CertificateMode`. Ritorna `{kind:'none'}`
 * se il valore non e' riconosciuto.
 */
export function certModeFromValore(valore: string | null | undefined): CertificateMode {
    switch (valore) {
        case 'fornito': return { kind: 'fornito' };
        case 'richiesto_cn': return { kind: 'richiesto_cn' };
        case 'richiesto_csr': return { kind: 'richiesto_csr' };
        default: return { kind: 'none' };
    }
}

/**
 * Ricalcola la `FormConfig` di un preset sostituendo le modalita'
 * certificato auth/firma. Usato dal pannello mock quando l'utente
 * cambia il dropdown tipo_certificato.
 */
export function rebuildMockFormConfig(
    preset: DialogMockPreset,
    certAuth: CertificateMode,
    certSign: CertificateMode,
): FormConfig {
    return computeFormConfig({
        scenario: preset.scenario,
        authType: preset.authType,
        certAuth,
        certSign,
        isModifiable: preset.scenario.kind !== 'readonly',
        credentialsMode: preset.credentialsMode ?? 'toggle',
        riusoObbligatorio: false,
        clientsRiusoCount: preset.clientsRiusoCount ?? 0,
        showIpFruizione: preset.showIpFruizione ?? false,
        showRateLimiting: preset.showRateLimiting ?? false,
        showFinalita: preset.showFinalita ?? false,
    });
}

/**
 * Costruisce un `ModalEditClientInput` pronto per essere passato a
 * `<app-modal-edit-client [input]="...">`. Non fa alcuna chiamata API.
 */
export function buildMockDialogInput(preset: DialogMockPreset): ModalEditClientInput {
    const formGroup = buildMockFormGroup(preset);
    const certAuth: CertificateMode = preset.certAuth ?? { kind: 'none' };
    const certSign: CertificateMode = preset.certSign ?? { kind: 'none' };
    const credentialsMode: CredentialsMode = preset.credentialsMode ?? 'toggle';
    const clientsRiusoCount = preset.clientsRiusoCount ?? 0;

    const formConfig = computeFormConfig({
        scenario: preset.scenario,
        authType: preset.authType,
        certAuth,
        certSign,
        isModifiable: preset.scenario.kind !== 'readonly',
        credentialsMode,
        riusoObbligatorio: false,
        clientsRiusoCount,
        showIpFruizione: preset.showIpFruizione ?? false,
        showRateLimiting: preset.showRateLimiting ?? false,
        showFinalita: preset.showFinalita ?? false,
    });

    const authSlots = buildCertSlots(certAuth, preset.scenario, 'auth');
    const signSlots = buildCertSlots(certSign, preset.scenario, 'firma');
    // In scenari "configurati" il pulsante di download e' abilitato quando
    // `currentServiceClient === credenziali.value`: allineiamo i due valori.
    const credenzialiValue = formGroup.get('credenziali')?.value;
    const currentServiceClient = scenarioImpliesLoadedCerts(preset.scenario)
        ? (credenzialiValue ?? 'mock-current-client')
        : null;
    if (scenarioImpliesLoadedCerts(preset.scenario) && credenzialiValue == null) {
        formGroup.get('credenziali')?.setValue('mock-current-client');
    }

    return {
        formGroup,
        formConfig,
        clientsRiuso: buildMockClientsRiuso(clientsRiusoCount),
        tipiCertificato: MOCK_TIPI_CERTIFICATO,
        saving: false,
        error: false,
        errorMsg: '',
        certificatoFornito: authSlots.certificatoFornito,
        certificatoCN: authSlots.certificatoCN,
        certificatoCSR: authSlots.certificatoCSR,
        moduloRichiestaCSR: authSlots.moduloRichiestaCSR,
        certificatoFornitoFirma: signSlots.certificatoFornito,
        certificatoCNFirma: signSlots.certificatoCN,
        certificatoCSRFirma: signSlots.certificatoCSR,
        moduloRichiestaCSRFirma: signSlots.moduloRichiestaCSR,
        moduloRichiestaCSRFirmaCertificato: null,
        ipRichiesto: preset.showIpFruizione ?? false,
        isEditClient: preset.scenario.kind === 'edit',
        currentServiceClient,
        adesioneId: 0,
        environment: 'collaudo',
        authType: preset.authType,
        codiceInternoProfilo: 'MOCK',
        client: null,
        descrittoreCtrl: new FormControl(''),
        descrittoreCtrlCsr: new FormControl(''),
        descrittoreCtrlCsrModulo: new FormControl(''),
        descrittoreCtrlFirma: new FormControl(''),
        descrittoreCtrlCsrFirma: new FormControl(''),
        descrittoreCtrlCsrModuloFirma: new FormControl(''),
        ratePeriods: MOCK_RATE_PERIODS,
    };
}

/**
 * Catalogo dei preset. Coprono gli assi principali (scenario x authType x
 * certificate mode x credentials mode). Aggiungerne altri secondo necessita'.
 */
export const DIALOG_MOCK_PRESETS: DialogMockPreset[] = [
    {
        id: 'new-no_dati',
        label: 'Nuovo / no dati',
        scenario: { kind: 'new' },
        authType: 'no_dati',
    },
    {
        id: 'new-indirizzo_ip',
        label: 'Nuovo / indirizzo IP',
        scenario: { kind: 'new' },
        authType: 'indirizzo_ip',
        showIpFruizione: true,
    },
    {
        id: 'new-http_basic',
        label: 'Nuovo / HTTP Basic',
        scenario: { kind: 'new' },
        authType: 'http_basic',
    },
    {
        id: 'new-https-fornito',
        label: 'Nuovo / mTLS (cert fornito)',
        scenario: { kind: 'new' },
        authType: 'https',
        certAuth: { kind: 'fornito' },
    },
    {
        id: 'new-https-cn',
        label: 'Nuovo / mTLS (richiesto CN)',
        scenario: { kind: 'new' },
        authType: 'https',
        certAuth: { kind: 'richiesto_cn' },
    },
    {
        id: 'new-https-csr',
        label: 'Nuovo / mTLS (richiesto CSR)',
        scenario: { kind: 'new' },
        authType: 'https',
        certAuth: { kind: 'richiesto_csr' },
    },
    {
        id: 'new-https_sign',
        label: 'Nuovo / mTLS + firma (cert fornito, firma fornita)',
        scenario: { kind: 'new' },
        authType: 'https_sign',
        certAuth: { kind: 'fornito' },
        certSign: { kind: 'fornito' },
        layout: 'horizontal',
    },
    {
        id: 'new-pdnd',
        label: 'Nuovo / PDND',
        scenario: { kind: 'new' },
        authType: 'pdnd',
        values: { client_id: '' },
    },
    {
        id: 'new-https_pdnd',
        label: 'Nuovo / mTLS + PDND',
        scenario: { kind: 'new' },
        authType: 'https_pdnd',
        certAuth: { kind: 'fornito' },
    },
    {
        id: 'new-https_pdnd_sign',
        label: 'Nuovo / mTLS + PDND + firma',
        scenario: { kind: 'new' },
        authType: 'https_pdnd_sign',
        certAuth: { kind: 'fornito' },
        certSign: { kind: 'fornito' },
        layout: 'horizontal',
    },
    {
        id: 'new-oauth_ac',
        label: 'Nuovo / OAuth Auth Code',
        scenario: { kind: 'new' },
        authType: 'oauth_authorization_code',
    },
    {
        id: 'new-oauth_cc',
        label: 'Nuovo / OAuth Client Credentials',
        scenario: { kind: 'new' },
        authType: 'oauth_client_credentials',
    },
    {
        id: 'new-sign',
        label: 'Nuovo / solo firma',
        scenario: { kind: 'new' },
        authType: 'sign',
        certSign: { kind: 'fornito' },
    },
    {
        id: 'new-sign_pdnd',
        label: 'Nuovo / firma + PDND',
        scenario: { kind: 'new' },
        authType: 'sign_pdnd',
        certSign: { kind: 'fornito' },
    },
    {
        id: 'proposed',
        label: 'Nome proposto (scenario B)',
        scenario: { kind: 'proposed' },
        authType: 'https',
        values: { nome_proposto: 'mock-client-proposto' },
    },
    {
        id: 'referenced',
        label: 'Client riferito (scenario C)',
        scenario: { kind: 'referenced', referencedClientId: 1001 },
        authType: 'https',
        certAuth: { kind: 'fornito' },
        credentialsMode: 'dropdown',
        clientsRiusoCount: 3,
        values: { credenziali: 1001, nome: 'Mock client 1', descrizione: 'Client preesistente' },
    },
    {
        id: 'edit-https',
        label: 'Edit / mTLS configurato',
        scenario: { kind: 'edit' },
        authType: 'https',
        certAuth: { kind: 'fornito' },
        values: {
            nome: 'client-mtls-01',
            descrizione: 'Client gia configurato',
            tipo_certificato: 'fornito',
        },
    },
    {
        id: 'readonly-https_sign',
        label: 'Read-only / mTLS + firma',
        scenario: { kind: 'readonly' },
        authType: 'https_sign',
        certAuth: { kind: 'fornito' },
        certSign: { kind: 'fornito' },
        values: {
            nome: 'client-rdonly',
            descrizione: 'Visualizzazione sola lettura',
        },
    },
    {
        id: 'new-dropdown-3',
        label: 'Nuovo / dropdown con 3 client riusabili',
        scenario: { kind: 'new' },
        authType: 'https',
        certAuth: { kind: 'fornito' },
        credentialsMode: 'dropdown',
        clientsRiusoCount: 3,
    },
];
