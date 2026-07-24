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
import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    Input,
    OnChanges,
    SimpleChanges,
    TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { StepWizardItem } from '../adesione-step-bar/adesione-step-bar.component';

/**
 * Stato visivo di un sub-step nella timeline (substepper di sezione).
 *  - `completed`: il sub-step e` concluso (workflow oltre questo step);
 *  - `active`: lo stato corrente dell'adesione vive in questo sub-step;
 *  - `locked`: il sub-step non e` ancora stato raggiunto (futuro).
 *
 * Equivalente semantico a `getSezioneStepStates(section)` del wizard
 * (rev. 4 e precedenti) — qui calcolato dal componente per
 * incapsulare la logica.
 */
export type SubstepState = 'completed' | 'active' | 'locked';

export interface SubstepItem {
    code: string;
    /** Label tradotta via `i18nPrefix.<code>`, fallback a `descrizione`. */
    label: string;
    /** Meta inline (sotto/accanto al label, lighter). Risolto via i18n
     *  con la chiave `<i18nPrefix>.<code>_meta`. Vuoto se la chiave
     *  non esiste — evita la ripetizione del label dello step. */
    meta: string;
    state: SubstepState;
    /** Indice 1-based per il bullet del cerchio. */
    index: number;
    /** True se il sub-step puo` essere collassato/espanso dall'utente
     *  (active o completed). I locked NON sono collassabili. */
    collapsible: boolean;
    /** True se il pannello del sub-step e` correntemente aperto. */
    open: boolean;
}

/**
 * Substepper verticale della sezione (Issue 254 NEW LAYOUT, rev. 4.10).
 *
 * Pilotato dalla stessa source data delle step-bar legacy:
 *  - `[steps]` riceve `getStepWizardSezione('collaudo')` /
 *    `getStepWizardSezione('produzione')` (array di `StepWizardItem`
 *    dal config `adesione.step_wizard_collaudo` / `_produzione`);
 *  - `[currentState]` riceve `adesione.stato`;
 *  - `[workflowStati]` riceve l'elenco ordinato cronologicamente
 *    degli stati workflow (per la regola "oltre-fase").
 *
 * Rendering: design-code `.timeline` con bullet rotondo, connettore
 * verticale, body collassabile con animazione panel-in. Stato visivo
 * derivato dal config in modo identico alla step-bar principale (vedi
 * `_buildItems()`), con la regola aggiuntiva "active+completed sono
 * collassabili, locked no".
 *
 * Content projection: il parent fornisce un `<ng-template>` di body
 * che riceve `sub: SubstepItem` come `$implicit`. Il body viene
 * renderizzato dentro il `.tl-panel` di ciascun sub-step quando
 * `open=true`. Esempio:
 *
 * ```html
 * <app-adesione-substepper [steps]="..." [currentState]="...">
 *   <ng-template let-sub>
 *     &#64;switch (sub.code) {
 *       &#64;case ('in_compilazione') { ... lista clients ... }
 *       &#64;default { ... messaggio waiting ... }
 *     }
 *   </ng-template>
 * </app-adesione-substepper>
 * ```
 *
 * State default di apertura per ogni sub-step:
 *  - `active` -> aperto;
 *  - `completed`/`locked` -> chiuso.
 * L'utente puo` overridare cliccando l'header (active/completed solo).
 */
@Component({
    selector: 'app-adesione-substepper',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TranslateModule],
    templateUrl: './adesione-substepper.component.html',
    styleUrls: ['./adesione-substepper.component.scss'],
})
export class AdesioneSubstepperComponent implements OnChanges {

    /** Lista dei sub-step (4 elementi tipici: in_compilazione,
     *  in_approvazione, in_configurazione, configurato). Pilotata da
     *  `adesione.step_wizard_collaudo` / `_produzione` del config. */
    @Input() steps: StepWizardItem[] = [];

    /** Stato corrente dell'adesione (`adesione.stato`). */
    @Input() currentState: string | null = null;

    /** Elenco ordinato cronologicamente di TUTTI gli stati workflow
     *  dell'adesione. Serve a riconoscere la condizione "oltre-fase"
     *  (lo stato corrente e` posizionato dopo TUTTI gli stati di
     *  questa sezione: tutti gli step diventano `completed`). */
    @Input() workflowStati: string[] = [];

    /** Prefisso i18n per le label dei sub-step. Default coerente con
     *  la step-bar interna del legacy (`STEP_WIZARD_SEZIONE.<code>`). */
    @Input() i18nPrefix: string = 'APP.ADESIONI.STEP_WIZARD_SEZIONE';

    /** Subtitle "PROCEDURA DI ATTIVAZIONE" / "DI CONFIGURAZIONE"
     *  sopra la timeline. Stringa gia` tradotta. Se vuota niente
     *  subtitle. */
    @Input() title: string = '';

    /** Mostra/nasconde il counter "X di Y completati" accanto al title. */
    @Input() showCounter: boolean = true;

    /** Tooltip i18n key per il badge "Bloccato" (default coerente col
     *  legacy). */
    @Input() lockedTooltipKey: string = 'APP.ADESIONI.LABEL.BloccatoTooltip';

    /**
     * Lista di sub-step `code` che devono essere forzati a stato
     * `active` quando il loro stato naturale e` `completed`.
     * Caso d'uso: i custom properties di "In compilazione" sono
     * obbligatori e non compilati ma lo stato workflow e` gia`
     * andato oltre — la UX vuole che l'utente possa tornarci a
     * compilare i dati mancanti. Lock states non vengono toccati.
     */
    @Input() forceActiveCodes: string[] = [];

    /**
     * Body content projection: il parent fornisce `<ng-template let-sub>`
     * dentro il tag `<app-adesione-substepper>...</...>`. Il template
     * riceve `sub: SubstepItem` come `$implicit` e tipicamente fa
     * dispatching su `sub.code`.
     */
    @ContentChild(TemplateRef) bodyTpl: TemplateRef<any> | null = null;

    /**
     * Override manuale di apertura/chiusura dei sub-step. Chiave: `code`.
     * Se assente, vale il default basato sullo stato.
     */
    private _userToggles = new Map<string, boolean>();

    items: SubstepItem[] = [];

    /** Done count = sub-step in stato `completed`. Esposto al template
     *  per il counter "X di Y completati". */
    doneCount = 0;
    /** Total = lunghezza degli items. */
    totalCount = 0;

    constructor(private readonly translate: TranslateService) {}

    ngOnChanges(_changes: SimpleChanges): void {
        this.items = this._buildItems();
        this.doneCount = this.items.filter(i => i.state === 'completed').length;
        this.totalCount = this.items.length;
    }

    /**
     * Costruisce la lista degli items derivando lo stato dal config.
     * Riproduce la stessa logica di `adesione-step-bar._buildItems()`
     * ma semplificata per il caso substepper (no regola "empty",
     * no `selectedCode` constraint sul click — la timeline non e`
     * cliccabile come navigazione, solo come collapse toggle).
     */
    private _buildItems(): SubstepItem[] {
        if (!this.steps || this.steps.length === 0) { return []; }

        // Indice del sub-step reale: contiene `currentState` nel suo
        // array `stati_adesione`.
        const realIndex = this.currentState
            ? this.steps.findIndex(s => s.stati_adesione?.includes(this.currentState!))
            : -1;

        // Rilevamento "oltre-fase": stato corrente posizionato nel
        // workflow DOPO tutti gli stati della sezione. Esempio: sezione
        // Collaudo quando l'adesione e` gia` in Produzione -> tutti gli
        // step `completed`.
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

        // Stato terminale: sull'ultimo step della bar, il currentState
        // coincide con l'ULTIMO `stati_adesione` dello step (es.
        // `pubblicato_collaudo` per la sezione Collaudo, `pubblicato_produzione`
        // per Produzione). In questo caso lo step e` raggiunto e
        // concluso — lo trattiamo come `completed`, non come `active`,
        // coerente col `<app-adesione-step-bar>` legacy che lo
        // promuove a `final`.
        const lastIndex = this.steps.length - 1;
        const lastStep = this.steps[lastIndex];
        const lastStatesOfLastStep = lastStep?.stati_adesione || [];
        // Terminale raggiunto se lo stato corrente e` uno QUALSIASI degli stati
        // dell'ultimo step (es. `pubblicato_produzione` o la variante
        // `..._senza_collaudo`), non solo l'ultimo elemento dell'array.
        const reachedTerminal = realIndex === lastIndex
            && !!this.currentState
            && lastStatesOfLastStep.includes(this.currentState);

        return this.steps.map((step, index) => {
            let state: SubstepState;
            if (pastPhase) {
                state = 'completed';
            } else if (reachedTerminal) {
                // Tutti gli step diventano `completed` quando il
                // workflow ha raggiunto lo stato terminale della bar.
                state = 'completed';
            } else if (realIndex !== -1 && index === realIndex) {
                state = 'active';
            } else if (realIndex !== -1 && index < realIndex) {
                state = 'completed';
            } else {
                state = 'locked';
            }

            // Override "needs attention": uno step naturalmente
            // `completed` ma con dati obbligatori incompleti viene
            // riportato a `active` per consentire all'utente di
            // tornare a compilare. Gli `locked` non sono mai
            // toccati (i dati non sono ancora rilevanti).
            if (state === 'completed' && this.forceActiveCodes.includes(step.code)) {
                state = 'active';
            }

            // Collapsible (rev. 4.24): solo gli step `active` sono
            // collassabili PER DEFAULT. Eccezione: il primo step
            // (tipicamente `in_compilazione`) e` sempre collassabile
            // anche quando completato, perche` ospita la lista
            // client/endpoint che deve restare consultabile.
            // I `locked` e i `completed` non-primi non hanno pannello
            // (chip pill di stato sulla destra, niente toggle).
            const isFirst = index === 0;
            const collapsible = state === 'active' || (state === 'completed' && isFirst);
            const userOverride = this._userToggles.get(step.code);
            const open = userOverride !== undefined ? userOverride : (state === 'active');

            return {
                code: step.code,
                label: this._resolveLabel(step),
                meta: this._resolveMeta(step, state),
                state,
                index: index + 1,
                collapsible,
                open,
            };
        });
    }

    /**
     * Toggla l'apertura del sub-step. Solo gli step collassabili
     * rispondono al click.
     */
    toggle(item: SubstepItem): void {
        if (!item.collapsible) { return; }
        const newOpen = !item.open;
        this._userToggles.set(item.code, newOpen);
        // Aggiorna in-place per evitare ri-build completo (cheap).
        item.open = newOpen;
    }

    /** Risoluzione i18n della label, con fallback alla descrizione. */
    private _resolveLabel(step: StepWizardItem): string {
        const key = `${this.i18nPrefix}.${step.code}`;
        const translated = this.translate.instant(key);
        return translated && translated !== key ? translated : (step.descrizione || step.code);
    }

    /**
     * Risoluzione i18n del meta inline. Cerca la chiave
     * `<i18nPrefix>.<code>_meta` (es. `STEP_WIZARD_SEZIONE.in_compilazione_meta`
     * = "Configura autenticazione ed endpoint"). Quando lo step e`
     * `completed` ma resta consultabile (collapsible), prova prima
     * la chiave `<code>_meta_completed` (es. "Visualizza o modifica
     * autenticazione ed endpoint") per riflettere il cambio di
     * affordance — chi ha permesso modifica, gli altri solo visione.
     * Se nessuna chiave esiste ritorna stringa vuota — evita la
     * ripetizione del label (la `descrizione` dal config tipicamente
     * coincide col label).
     */
    private _resolveMeta(step: StepWizardItem, state: SubstepState): string {
        if (state === 'completed') {
            const completedKey = `${this.i18nPrefix}.${step.code}_meta_completed`;
            const completedTr = this.translate.instant(completedKey);
            if (completedTr && completedTr !== completedKey) {
                return completedTr;
            }
        }
        const key = `${this.i18nPrefix}.${step.code}_meta`;
        const translated = this.translate.instant(key);
        return translated && translated !== key ? translated : '';
    }
}
