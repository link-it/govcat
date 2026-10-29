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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

export type AzionePdnd = 'approve' | 'reject' | 'suspend' | 'unsuspend';
export type OggettoAzionePdnd = 'agreement' | 'purpose';

/** Esito della conferma: `null` se annullata. */
export interface EsitoAzionePdnd {
  reason: string;
}

const ICONE: Record<AzionePdnd, string> = {
  approve: 'bi-check-circle',
  reject: 'bi-x-circle',
  suspend: 'bi-pause-circle',
  unsuspend: 'bi-play-circle'
};

const STATO_RISULTANTE: Record<AzionePdnd, string> = {
  approve: 'ACTIVE',
  reject: 'REJECTED',
  suspend: 'SUSPENDED',
  unsuspend: 'ACTIVE'
};

// Vincolo PDND sulla motivazione del rifiuto (notificata al fruitore)
export const MOTIVAZIONE_MIN = 20;
export const MOTIVAZIONE_MAX = 1000;

/**
 * Conferma di un'operazione PDND su accordo o finalita`: riepiloga l'oggetto, l'effetto
 * (cambio di stato o di previsione di carico) e chiede la motivazione per il rifiuto.
 */
@Component({
  selector: 'app-pdnd-azione-dialog',
  templateUrl: 'pdnd-azione-dialog.component.html',
  styleUrls: ['pdnd-azione-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class PdndAzioneDialogComponent implements OnInit {
  azione: AzionePdnd = 'approve';
  oggetto: OggettoAzionePdnd = 'agreement';
  /** Nome del fruitore. */
  fruitore: string = '';
  /** Titolo della finalita` (solo per oggetto `purpose`). */
  finalita: string = '';
  statoAttuale: string = '';
  /** Previsione di carico attuale e richiesta, gia` formattate (approvazione e rifiuto di un aumento). */
  caricoAttuale: string = '';
  caricoRichiesto: string = '';
  /** Chi mantiene la propria sospensione dopo la riattivazione dell'erogatore (testo gia` tradotto). */
  altreSospensioni: string = '';
  /** Approvazione della prima versione di una finalita` (non di un aumento). */
  primaApprovazione: boolean = false;

  reason: string = '';
  readonly motivazioneMin = MOTIVAZIONE_MIN;
  readonly motivazioneMax = MOTIVAZIONE_MAX;
  _toccato: boolean = false;

  onClose: Subject<EsitoAzionePdnd | null> = new Subject();

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit() {
    this.onClose = new Subject();
  }

  get _chiave(): string {
    const _azione = this.primaApprovazione && this.azione === 'approve' ? 'approveFirst' : this.azione;
    return `APP.SUBSCRIBERS.DIALOG.${this.oggetto === 'purpose' ? 'PURPOSE' : 'AGREEMENT'}.${_azione}`;
  }

  get _icona(): string {
    return ICONE[this.azione];
  }

  get _conMotivazione(): boolean {
    return this.azione === 'reject';
  }

  /** Per gli aumenti di una finalita` l'effetto e` sul carico, altrimenti sullo stato. */
  get _mostraCarico(): boolean {
    return this.oggetto === 'purpose' && (this.azione === 'approve' || this.azione === 'reject') && !!this.caricoRichiesto;
  }

  /** Riattivazione che non riattiva: restano le sospensioni di fruitore o piattaforma. */
  get _restaSospeso(): boolean {
    return this.azione === 'unsuspend' && !!this.altreSospensioni;
  }

  get _statoRisultante(): string {
    return this._restaSospeso ? 'SUSPENDED' : STATO_RISULTANTE[this.azione];
  }

  get _tipoStato(): string {
    return this.oggetto === 'purpose' ? 'PURPOSE_STATE' : 'AGREEMENT_STATE';
  }

  /** Motivazione assente o fuori dai limiti PDND (da MOTIVAZIONE_MIN a MOTIVAZIONE_MAX caratteri). */
  get _motivazioneMancante(): boolean {
    if (!this._conMotivazione) { return false; }
    const _lunghezza = this.reason.trim().length;
    return _lunghezza < MOTIVAZIONE_MIN || _lunghezza > MOTIVAZIONE_MAX;
  }

  _onMotivazione(value: string) {
    this.reason = value;
    this._toccato = true;
  }

  conferma() {
    this._toccato = true;
    if (this._motivazioneMancante) { return; }
    this.onClose.next({ reason: this.reason.trim() });
    this.bsModalRef.hide();
  }

  annulla() {
    this.onClose.next(null);
    this.bsModalRef.hide();
  }
}
