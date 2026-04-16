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
  sezioni_attive: string[];
}

type StepState = 'completed' | 'current' | 'pending';

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
 * Componente step-bar a tappe per visualizzare l'avanzamento di un'adesione,
 * guidato dalla configurazione `adesione.step_wizard`.
 *
 * Lo step "reale" (`currentState`) è quello il cui array `stati_adesione`
 * contiene lo stato dell'adesione. Opzionalmente può essere selezionato uno
 * step precedente via `selectedCode` per mostrarne le sezioni attive senza
 * modificare lo stato reale dell'adesione.
 *
 * Interattività: tutti gli step con indice ≤ indice reale sono cliccabili
 * (step precedenti + step reale per tornare alla vista di default). Gli step
 * futuri non sono cliccabili. Il click emette `stepClick` col codice dello
 * step, che il parent userà per calcolare le sezioni da mostrare.
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

    return this.steps.map((step, index) => {
      let state: StepState;
      if (displayIndex === -1) {
        state = 'pending';
      } else if (index < displayIndex) {
        state = 'completed';
      } else if (index === displayIndex) {
        state = 'current';
      } else {
        state = 'pending';
      }

      // Un passo è cliccabile se si trova entro l'indice reale: gli step
      // precedenti e lo step reale stesso (per tornare alla vista di default
      // dopo aver esplorato una tappa passata).
      const clickable = realIndex !== -1 && index <= realIndex;

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

  onStepClick(item: StepBarItem): void {
    if (!item.clickable) return;
    this.stepClick.emit(item.code);
  }

  /**
   * Prova a tradurre la descrizione dello step via i18n (APP.ADESIONI.STEP_WIZARD.<code>);
   * se la chiave non esiste, ritorna la descrizione testuale presente nel config.
   */
  private _resolveLabel(step: StepWizardItem): string {
    const key = `APP.ADESIONI.STEP_WIZARD.${step.code}`;
    const translated = this.translate.instant(key);
    if (translated && translated !== key) return translated;
    return step.descrizione || step.code;
  }
}
