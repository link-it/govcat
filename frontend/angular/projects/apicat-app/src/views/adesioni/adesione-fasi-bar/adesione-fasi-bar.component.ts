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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { StepWizardItem } from '../adesione-step-bar/adesione-step-bar.component';

/**
 * Stato visivo di una card-fase nella step-bar 3-fasi del nuovo layout.
 *  - `completed`: la fase risulta gia` conclusa (lo stato corrente
 *    dell'adesione e` posizionato in una fase successiva, oppure tutti
 *    gli stati della fase sono stati attraversati);
 *  - `current`: lo stato corrente dell'adesione vive in questa fase
 *    (workflow position);
 *  - `pending`: la fase non e` ancora stata raggiunta (futura).
 *  - `final`: lo stato corrente e` l'ultimo stato dell'ultima fase
 *    (traguardo terminale del workflow). Reso come fase `done`.
 *  - `skipped`: la fase e` esplicitamente saltata (es. Collaudo quando
 *    l'adesione ha `skip_collaudo`). Non cliccabile e resa attenuata.
 */
type FaseState = 'completed' | 'current' | 'pending' | 'final' | 'skipped';

export interface FasiBarItem {
    code: string;
    label: string;
    /** Numero della fase ("01", "02", "03"). Calcolato da index+1, 0-padded. */
    numberLabel: string;
    state: FaseState;
    index: number;
    clickable: boolean;
    /** True se l'indice corrisponde alla fase reale corrente del workflow,
     *  a prescindere da `selectedCode` (per disambiguare current vs viewing). */
    isReal: boolean;
    /** True se la fase e` esplicitamente bloccata (es. produzione
     *  prima che il servizio sia pubblicato). Distinto da `pending`
     *  per dare uno stile dedicato e supportare tooltip. */
    disabled?: boolean;
}

/**
 * Step-bar 3-fasi del nuovo layout (Issue 254 NEW LAYOUT, rev. 4.8).
 *
 * Differenze rispetto a `<app-adesione-step-bar>`:
 *  - rendering visivo a 3 card (`.gstepper > .gstep`) anziche` cerchi o
 *    chevron;
 *  - sempre interattiva (le 3 fasi sono sempre cliccabili come tab —
 *    anche le fasi future, per anteprima);
 *  - distinzione fra `is-current` (workflow position, rosso) e
 *    `is-viewing` (selezione utente, sfondo + outline + barra colorata
 *    sotto). Implementata con due classi CSS distinte sul `.gstep`.
 *
 * La logica di derivazione stato dagli `stati_adesione` di ogni step e
 * dal `currentState` (= `adesione.stato`) e` la stessa di
 * `<app-adesione-step-bar>` ma semplificata: niente regola "empty"
 * (non rilevante per la step-bar a fasi che e` sempre 3 step concreti)
 * e niente `selectedCode` constraint (qui qualsiasi fase e` cliccabile).
 *
 * I markup CSS sono dichiarati dal parent (wizard) sotto `:host(.lnk-wizard)`
 * — questo componente e` puro structural template, non porta SCSS.
 */
@Component({
    selector: 'app-adesione-fasi-bar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslateModule],
    templateUrl: './adesione-fasi-bar.component.html',
    styleUrls: ['./adesione-fasi-bar.component.scss'],
})
export class AdesioneFasiBarComponent implements OnChanges {

    /**
     * Lista delle fasi (3 elementi) — pilotata da `adesione.step_wizard`
     * del config (chiavi: code, descrizione, stati_adesione,
     * sezioni_attive). Stessa source data della step-bar principale.
     */
    @Input() steps: StepWizardItem[] = [];

    /** Stato corrente dell'adesione (`adesione.stato`). Usato per
     *  determinare quale fase e` `current`/`final` e quali sono
     *  `completed`/`pending`. */
    @Input() currentState: string | null = null;

    /** Code della fase selezionata dall'utente via click (override visivo
     *  `is-viewing`). Se null o non in lista, ricade sulla fase reale. */
    @Input() selectedCode: string | null = null;

    /** Elenco ordinato cronologicamente di tutti gli stati workflow.
     *  Identico a quello della step-bar principale. Usato per il
     *  rilevamento "oltre-fase" (la fase rappresentata e` conclusa
     *  perche` lo stato corrente e` posizionato dopo tutti i suoi stati). */
    @Input() workflowStati: string[] = [];

    /** Prefisso i18n per le label delle fasi.
     *  Default: `APP.ADESIONI.STEP_WIZARD` (allineato alla step-bar
     *  principale — chiavi `info_generali`, `collaudo`, `produzione`). */
    @Input() i18nPrefix: string = 'APP.ADESIONI.STEP_WIZARD';

    /** Codici di fase da rendere non cliccabili (es. `produzione`
     *  quando il servizio non e` ancora `pubblicato_produzione`).
     *  L'item resta visibile con stile `.is-disabled`. */
    @Input() disabledCodes: string[] = [];

    /** Codici di fase da marcare come "saltate" (es. `collaudo` quando
     *  l'adesione ha `skip_collaudo`). Non cliccabili, stile dedicato
     *  `.is-skipped`. */
    @Input() skippedCodes: string[] = [];

    /** Offset del numero di fase mostrato ("FASE {n}"). Default `1`
     *  (comportamento storico: prima fase = "FASE 1"). La form di
     *  creazione passa `0` per numerare da "FASE 0 Creazione". */
    @Input() numberOffset: number = 1;

    @Output() stepClick = new EventEmitter<string>();

    items: FasiBarItem[] = [];

    constructor(private readonly translate: TranslateService) {}

    ngOnChanges(_changes: SimpleChanges): void {
        this.items = this._buildItems();
    }

    private _buildItems(): FasiBarItem[] {
        if (!this.steps || this.steps.length === 0) { return []; }

        // Indice della fase reale (workflow position): step il cui array
        // `stati_adesione` contiene lo stato corrente.
        const realIndex = this.currentState
            ? this.steps.findIndex(s => s.stati_adesione?.includes(this.currentState!))
            : -1;

        // Rilevamento "oltre-fase": stato corrente posizionato nel workflow
        // dopo TUTTI gli stati di TUTTE le fasi della bar. Marcatutte le
        // fasi `completed` (raro per la 3-fasi: succede solo se l'adesione
        // ha uno stato esotico non mappato).
        let pastPhase = false;
        if (realIndex === -1 && this.currentState && this.workflowStati.length > 0) {
            const currentIdx = this.workflowStati.indexOf(this.currentState);
            if (currentIdx !== -1) {
                let maxStepStateIdx = -1;
                for (const step of this.steps) {
                    for (const st of step.stati_adesione || []) {
                        const idx = this.workflowStati.indexOf(st);
                        if (idx > maxStepStateIdx) { maxStepStateIdx = idx; }
                    }
                }
                if (maxStepStateIdx !== -1 && currentIdx > maxStepStateIdx) {
                    pastPhase = true;
                }
            }
        }

        // Stato terminale: ultima fase, ultimo stato della sua lista,
        // coincidente con `currentState`. Promuove `current` -> `final`.
        const lastIndex = this.steps.length - 1;
        const lastStep = this.steps[lastIndex];
        const lastStatesOfLastStep = lastStep?.stati_adesione || [];
        const terminalState = lastStatesOfLastStep.length > 0
            ? lastStatesOfLastStep[lastStatesOfLastStep.length - 1]
            : null;

        return this.steps.map((step, index) => {
            let state: FaseState;
            if (pastPhase) {
                state = 'completed';
            } else if (realIndex !== -1 && index === realIndex) {
                state = 'current';
            } else if (realIndex !== -1 && index < realIndex) {
                state = 'completed';
            } else {
                state = 'pending';
            }

            // Promozione a `final` se siamo sull'ultima fase, e` la fase
            // reale, e lo stato corrente e` il terminale.
            if (
                state === 'current' &&
                index === lastIndex &&
                index === realIndex &&
                terminalState !== null &&
                this.currentState === terminalState
            ) {
                state = 'final';
            }

            // Numero della fase: di default "1", "2", "3" (no
            // zero-padding — feedback utente rev. 4.12). `numberOffset`
            // permette di partire da 0 (form creazione: "FASE 0").
            // Fase saltata (es. Collaudo con `skip_collaudo`): sovrascrive
            // lo stato calcolato e la rende non cliccabile.
            const isSkipped = this.skippedCodes.includes(step.code);
            if (isSkipped) { state = 'skipped'; }

            const numberLabel = String(index + this.numberOffset);
            // Disabilita esplicita via `disabledCodes` (es. fase
            // "produzione" finche` il servizio non e` pubblicato).
            const isDisabled = this.disabledCodes.includes(step.code);
            return {
                code: step.code,
                label: this._resolveLabel(step),
                numberLabel,
                state,
                index,
                // Le fasi `pending` (lock) e `skipped` NON sono cliccabili —
                // il workflow non le ha raggiunte / sono saltate. Le altre
                // (current/completed/final) sono cliccabili come tab.
                // Bloccati anche i code presenti in `disabledCodes`.
                clickable: !isSkipped && state !== 'pending' && !isDisabled,
                isReal: index === realIndex,
                disabled: isDisabled,
            } as FasiBarItem;
        });
    }

    /** True se la fase con questo code e` quella attualmente selezionata
     *  (sia per click utente che, in fallback, per workflow position). */
    isViewing(item: FasiBarItem): boolean {
        if (this.selectedCode) {
            return item.code === this.selectedCode;
        }
        return item.isReal;
    }

    onStepClick(item: FasiBarItem): void {
        if (!item.clickable) { return; }
        this.stepClick.emit(item.code);
    }

    /**
     * Risolve la label della fase via i18n usando `i18nPrefix`. Fallback
     * alla `descrizione` testuale del config se la chiave non esiste.
     */
    private _resolveLabel(step: StepWizardItem): string {
        const key = `${this.i18nPrefix}.${step.code}`;
        const translated = this.translate.instant(key);
        return translated && translated !== key ? translated : (step.descrizione || step.code);
    }
}
