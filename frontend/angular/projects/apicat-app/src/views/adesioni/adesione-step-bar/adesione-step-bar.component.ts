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
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface StepWizardItem {
  code: string;
  descrizione: string;
  stati_adesione: string[];
  /** Opzionale: usato solo dalla step-bar principale per pilotare le sezioni
   *  attive del wizard. Non significativo per le step-bar interne di sezione. */
  sezioni_attive?: string[];
}

/**
 * `final` è una variante di `current` riservata al caso in cui l'adesione
 * ha raggiunto lo stato terminale del percorso (es. `pubblicato_produzione`):
 * lo step resta "corrente" concettualmente ma viene reso come traguardo
 * completato (non "ancora da fare"). Vedi `_buildItems()` per la regola.
 */
type StepState = 'completed' | 'current' | 'pending' | 'final';

interface StepBarItem {
  code: string;
  label: string;
  state: StepState;
  index: number;
  clickable: boolean;
  /** True se l'indice dell'item coincide con lo step reale dell'adesione
   *  (derivato da `currentState`), a prescindere dallo step selezionato. */
  isReal: boolean;
}

export type StepBarVariant = 'circles' | 'chevron';

/**
 * Componente step-bar a tappe per visualizzare l'avanzamento di un'adesione.
 * Riutilizzato sia per la step-bar principale (pilotata da
 * `adesione.step_wizard`) sia per le step-bar interne di sezione
 * (collaudo/produzione, pilotate da `adesione.step_wizard_sezione`).
 *
 * Lo step "reale" (`currentState`) è quello il cui array `stati_adesione`
 * contiene lo stato dell'adesione. Opzionalmente può essere selezionato uno
 * step precedente via `selectedCode` per mostrarne le sezioni attive senza
 * modificare lo stato reale dell'adesione.
 *
 * Regola "empty": uno step con `stati_adesione` vuoto viene sempre reso come
 * `completed` e funge da terminale di fase; quando lo stato corrente non
 * matcha alcuno step esplicito, gli step precedenti all'empty vengono
 * anch'essi marcati completed (catch-all oltre-fase).
 *
 * Interattività: controllata da `interactive` (default `true`). In modalità
 * interattiva tutti gli step con indice ≤ indice reale sono cliccabili (step
 * precedenti + step reale per tornare alla vista di default); il click emette
 * `stepClick` col codice dello step. In modalità non interattiva nessuno step
 * è cliccabile e l'evento non viene emesso.
 */
@Component({
  selector: 'app-adesione-step-bar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './adesione-step-bar.component.html',
  styleUrls: ['./adesione-step-bar.component.scss']
})
export class AdesioneStepBarComponent implements OnChanges {

  @Input() steps: StepWizardItem[] = [];
  @Input() currentState: string | null = null;
  /**
   * Code dello step selezionato dall'utente (override). Se null o non presente
   * negli step, viene usato lo step derivato da `currentState`.
   */
  @Input() selectedCode: string | null = null;
  /**
   * Mostra/nasconde i badge pill testuali ("Attuale" / "Anteprima") sotto
   * le label. Di default sono nascosti: la distinzione visiva tra step
   * reale e step in anteprima resta comunque garantita dal pallino verde
   * sul cerchio reale e dal bordo tratteggiato sullo step in anteprima.
   */
  @Input() showStateBadges: boolean = false;
  /**
   * Variante grafica della step-bar:
   * - 'circles': visualizzazione classica con cerchi e connettori (default)
   * - 'chevron': blocchi orizzontali a freccia/chevron
   */
  @Input() variant: StepBarVariant = 'chevron';
  /**
   * Posizione della label nella variante circles:
   * - 'bottom': sotto il cerchio (default)
   * - 'right': a destra del cerchio
   */
  @Input() circlesLabelPosition: 'bottom' | 'right' = 'bottom';
  /**
   * Modalità interattiva: quando `false`, nessuno step è cliccabile,
   * `stepClick` non viene emesso e gli elementi non espongono role/tabindex
   * di pulsante. Usato dalle step-bar interne di sezione (collaudo/produzione)
   * che sono puramente informative.
   */
  @Input() interactive: boolean = true;
  /**
   * Prefisso i18n per le label degli step. Il componente cerca la chiave
   * `<prefix>.<step.code>` e ricade sulla `descrizione` del config se manca.
   * Default compatibile con la step-bar principale.
   */
  @Input() i18nPrefix: string = 'APP.ADESIONI.STEP_WIZARD';
  /**
   * Elenco ordinato cronologicamente di tutti gli stati del workflow
   * dell'adesione (tipicamente derivato da `adesione.workflow.stati` o, in
   * mancanza, concatenando gli `stati_adesione` della step-bar principale).
   * Serve alle step-bar interne per capire se l'adesione è "oltre-fase":
   * quando lo stato corrente è posizionato nel workflow DOPO tutti gli stati
   * mappati negli step di questa bar, tutti gli step vengono marcati come
   * completed (la fase rappresentata dalla bar è conclusa).
   * Se omesso la logica "oltre-fase" non scatta e si ricade sul
   * comportamento classico (pending).
   */
  @Input() workflowStati: string[] = [];

  @Output() stepClick = new EventEmitter<string>();

  items: StepBarItem[] = [];

  constructor(private readonly translate: TranslateService) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.items = this._buildItems();
  }

  private _buildItems(): StepBarItem[] {
    if (!this.steps || this.steps.length === 0) return [];

    const realIndex = this.currentState
      ? this.steps.findIndex(s => s.stati_adesione?.includes(this.currentState!))
      : -1;

    const selectedIndex = this.selectedCode
      ? this.steps.findIndex(s => s.code === this.selectedCode)
      : -1;

    // Se la selezione è valida e ≤ indice reale, la usiamo come riferimento
    // visivo; altrimenti ricadiamo sull'indice reale.
    const displayIndex = (selectedIndex !== -1 && selectedIndex <= realIndex)
      ? selectedIndex
      : realIndex;

    // Fallback "oltre-fase": se lo stato corrente non matcha alcuno step
    // esplicito e la config include uno step terminale con stati_adesione
    // vuoto (regola "empty = completed"), questo rappresenta il punto di
    // arrivo a cui siamo giunti — gli step precedenti vengono marcati
    // completed perché di fatto già attraversati.
    let fallbackIndex = -1;
    if (displayIndex === -1) {
      for (let i = this.steps.length - 1; i >= 0; i--) {
        if (this._isEmptyStep(this.steps[i])) {
          fallbackIndex = i;
          break;
        }
      }
    }

    // Rilevamento "oltre-fase" basato su `workflowStati`: se nessun step
    // matcha lo stato corrente E lo stato corrente si posiziona nel workflow
    // DOPO tutti gli stati mappati negli step di questa bar, la fase
    // rappresentata è conclusa → tutti gli step diventano completed.
    // Tipico uso: step-bar interna di Collaudo quando l'adesione è già in
    // Produzione.
    let pastPhase = false;
    if (
      displayIndex === -1 &&
      fallbackIndex === -1 &&
      this.currentState &&
      this.workflowStati.length > 0
    ) {
      const currentIdx = this.workflowStati.indexOf(this.currentState);
      if (currentIdx !== -1) {
        let maxStepStateIdx = -1;
        for (const step of this.steps) {
          for (const st of step.stati_adesione || []) {
            const idx = this.workflowStati.indexOf(st);
            if (idx > maxStepStateIdx) maxStepStateIdx = idx;
          }
        }
        if (maxStepStateIdx !== -1 && currentIdx > maxStepStateIdx) {
          pastPhase = true;
        }
      }
    }

    // Stato terminale: se ci troviamo sul LAST step del percorso E lo stato
    // corrente è l'ULTIMO stato della sua lista `stati_adesione`, trattiamo
    // il passo come "final" (non come "current"). Visivamente si rende come
    // traguardo raggiunto, evitando di suggerire che ci sia ancora qualcosa
    // da fare. La promozione è fatta dopo il calcolo base.
    const lastIndex = this.steps.length - 1;
    const lastStep = this.steps[lastIndex];
    const lastStatesOfLastStep = lastStep?.stati_adesione || [];
    const terminalState = lastStatesOfLastStep.length > 0
      ? lastStatesOfLastStep[lastStatesOfLastStep.length - 1]
      : null;

    return this.steps.map((step, index) => {
      const isEmpty = this._isEmptyStep(step);
      let state: StepState;
      if (displayIndex !== -1 && index === displayIndex) {
        state = 'current';
      } else if (isEmpty) {
        state = 'completed';
      } else if (displayIndex !== -1 && index < displayIndex) {
        state = 'completed';
      } else if (fallbackIndex !== -1 && index < fallbackIndex) {
        state = 'completed';
      } else if (pastPhase) {
        state = 'completed';
      } else {
        state = 'pending';
      }

      // Promozione a 'final': solo sul last step, solo se è davvero lo step
      // reale (nessuna navigazione-preview), e solo se lo stato corrente è
      // l'ultimo della sua stati_adesione (stato terminale del percorso).
      if (
        state === 'current' &&
        index === lastIndex &&
        index === realIndex &&
        terminalState !== null &&
        this.currentState === terminalState
      ) {
        state = 'final';
      }

      // Un passo è cliccabile solo in modalità interattiva e se si trova
      // entro l'indice reale: gli step precedenti e lo step reale stesso
      // (per tornare alla vista di default dopo aver esplorato una tappa
      // passata). Le step-bar non interattive disabilitano il click.
      const clickable = this.interactive && realIndex !== -1 && index <= realIndex;

      return {
        code: step.code,
        label: this._resolveLabel(step),
        state,
        index,
        clickable,
        isReal: index === realIndex
      };
    });
  }

  private _isEmptyStep(step: StepWizardItem): boolean {
    return !step.stati_adesione || step.stati_adesione.length === 0;
  }

  onStepClick(item: StepBarItem): void {
    if (!item.clickable) return;
    this.stepClick.emit(item.code);
  }

  /**
   * Prova a tradurre la descrizione dello step via i18n usando `i18nPrefix`
   * (default `APP.ADESIONI.STEP_WIZARD`); se la chiave non esiste, ritorna
   * la descrizione testuale presente nel config.
   */
  private _resolveLabel(step: StepWizardItem): string {
    const key = `${this.i18nPrefix}.${step.code}`;
    const translated = this.translate.instant(key);
    if (translated && translated !== key) return translated;
    return step.descrizione || step.code;
  }
}
