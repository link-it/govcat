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
import { StepWizardItem } from '@app/views/adesioni/adesione-step-bar/adesione-step-bar.component';

/**
 * MOCK della configurazione remota del wizard servizio (Parte B).
 *
 * Ipotesi frontend in attesa dell'estensione backend di
 * `Configurazione.servizio` (vedi NOTE-CLAUDE/WIZARD-NUOVO-SERVIZIO §5.1).
 * Usata come FALLBACK quando `Tools.Configurazione.servizio.step_wizard` non e`
 * ancora fornito dal backend.
 *
 * NOTA: il campo degli stati e` denominato `stati_adesione` (non
 * `stati_servizio`) per poter riusare `AdesioneFasiBarComponent` senza
 * modificarlo (evita regressioni sul wizard adesioni). L'unificazione della
 * chiave su un nome neutro (`stati`) e` rimandata alla fase di estrazione dei
 * componenti condivisi.
 */
export const STEP_WIZARD_SERVIZIO_FALLBACK: StepWizardItem[] = [
    {
        code: 'info_generali',
        descrizione: 'Informazioni Generali',
        stati_adesione: [],
        sezioni_attive: ['info_generali', 'api', 'allegati', 'referenti', 'gruppi', 'categorie']
    },
    {
        code: 'collaudo',
        descrizione: 'Collaudo',
        stati_adesione: [
            'bozza',
            'richiesto_collaudo',
            'autorizzato_collaudo',
            'in_configurazione_collaudo',
            'pubblicato_collaudo'
        ],
        sezioni_attive: ['collaudo']
    },
    {
        code: 'produzione',
        descrizione: 'Produzione',
        stati_adesione: [
            'pubblicato_collaudo',
            'richiesto_produzione',
            'autorizzato_produzione',
            'in_configurazione_produzione',
            'pubblicato_produzione',
            // percorso senza collaudo (skip_collaudo): bozza -> produzione
            'richiesto_produzione_senza_collaudo',
            'autorizzato_produzione_senza_collaudo',
            'in_configurazione_produzione_senza_collaudo',
            'pubblicato_produzione_senza_collaudo'
        ],
        sezioni_attive: ['produzione']
    }
];

/** Sotto-step della fase Collaudo (mock; chiave `stati_adesione` per riuso di
 *  `AdesioneSubstepperComponent`). */
export const STEP_WIZARD_COLLAUDO_SERVIZIO: StepWizardItem[] = [
    { code: 'in_compilazione', descrizione: 'In Compilazione', stati_adesione: ['bozza'] },
    { code: 'in_approvazione', descrizione: 'In Approvazione', stati_adesione: ['richiesto_collaudo'] },
    { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_collaudo', 'in_configurazione_collaudo'] },
    { code: 'configurato', descrizione: 'Pubblicato in Collaudo', stati_adesione: ['pubblicato_collaudo'] }
];

/** Sotto-step della fase Produzione (mock). Mappa sia il percorso normale
 *  (da `pubblicato_collaudo`) sia quello "senza collaudo" (da `bozza`, quando
 *  `skip_collaudo`). */
export const STEP_WIZARD_PRODUZIONE_SERVIZIO: StepWizardItem[] = [
    { code: 'in_compilazione', descrizione: 'In Compilazione', stati_adesione: ['pubblicato_collaudo', 'bozza'] },
    { code: 'in_approvazione', descrizione: 'In Approvazione', stati_adesione: ['richiesto_produzione', 'richiesto_produzione_senza_collaudo'] },
    { code: 'in_configurazione', descrizione: 'In Configurazione', stati_adesione: ['autorizzato_produzione', 'in_configurazione_produzione', 'autorizzato_produzione_senza_collaudo', 'in_configurazione_produzione_senza_collaudo'] },
    { code: 'configurato', descrizione: 'Pubblicato in Produzione', stati_adesione: ['pubblicato_produzione', 'pubblicato_produzione_senza_collaudo'] }
];

/** Elenco ordinato di tutti gli stati del workflow servizio (per il
 *  rilevamento "oltre-fase" della fasi-bar). Fonte: `servizi-config.json`. */
export const WORKFLOW_STATI_SERVIZIO: string[] = [
    'bozza',
    'richiesto_collaudo',
    'autorizzato_collaudo',
    'in_configurazione_collaudo',
    'pubblicato_collaudo',
    'richiesto_produzione',
    'autorizzato_produzione',
    'in_configurazione_produzione',
    'pubblicato_produzione',
    'richiesto_produzione_senza_collaudo',
    'autorizzato_produzione_senza_collaudo',
    'in_configurazione_produzione_senza_collaudo',
    'pubblicato_produzione_senza_collaudo',
    'archiviato'
];
