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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';

import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { RegistrazioneService } from '@app/services/registrazione.service';
import { ItemOrganizzazione } from '@app/model/itemOrganizzazione';

import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

/**
 * Issue 229 — Step opzionale del wizard di registrazione per
 * scegliere un'organizzazione a cui essere associato.
 *
 * UX:
 * - se l'utente ha gia` selezionato un'org (caso rientro nel
 *   wizard, `organizzazioneRichiesta` valorizzato): mostriamo
 *   una card riassuntiva con bottoni "Cambia" / "Rimuovi";
 * - altrimenti: `<ng-select>` con typeahead full-text via `q`
 *   (debounce 300ms) sul backend `GET /registrazione/organizzazioni`;
 * - footer: "Salta" (sempre visibile) + "Conferma e registra"
 *   (disabled finche` no selezione).
 *
 * I/O verso il parent:
 * - `(skip)` -> chiama `completaRegistrazione` senza POST.
 * - `(confirm)` -> POST `/registrazione/organizzazione` poi
 *   `completaRegistrazione`.
 * - `(remove)` -> DELETE `/registrazione/organizzazione`,
 *   poi rinfresca la card riassuntiva.
 */
@Component({
  selector: 'app-step-seleziona-organizzazione',
  templateUrl: './step-seleziona-organizzazione.component.html',
  styleUrls: ['./step-seleziona-organizzazione.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgSelectModule, LnkButtonComponent]
})
export class StepSelezionaOrganizzazioneComponent implements OnInit {

  /** Organizzazione gia` selezionata dall'utente (ritorno da
   *  rientro nel wizard / restore da `/registrazione/stato`). */
  @Input() organizzazioneRichiesta: ItemOrganizzazione | null = null;
  /** Spinner durante operazioni asincrone (skip/confirm/remove). */
  @Input() loading: boolean = false;

  @Output() skip = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();
  @Output() remove = new EventEmitter<void>();

  /** Org selezionata in `<ng-select>` (non ancora confermata).
   *  Two-way bound a `[(ngModel)]`. */
  _selected: ItemOrganizzazione | null = null;

  /** Stream del typeahead di ng-select (input dell'utente). */
  readonly typeahead$ = new Subject<string>();
  /** Lista risultati emessa a `[items]` di ng-select. */
  items$!: Observable<ItemOrganizzazione[]>;
  /** Loading visibile in `[loading]` di ng-select. */
  readonly searching$ = new BehaviorSubject<boolean>(false);

  /**
   * `[searchFn]` di ng-select: disabilita il filtro client-side.
   * La ricerca e` gia` fatta server-side via `typeahead` + `q`,
   * quindi vogliamo che ng-select mostri tutti gli items emessi
   * senza ri-filtrarli localmente per `bindLabel`.
   */
  readonly trueFn = (): boolean => true;

  /** True quando esiste gia` una scelta valorizzata (mostra
   *  la card riassuntiva al posto della search). */
  get _hasExistingSelection(): boolean {
    return !!this.organizzazioneRichiesta?.id_organizzazione;
  }

  /** True quando il bottone "Conferma e registra" puo` partire. */
  get _canConfirm(): boolean {
    if (this.loading) { return false; }
    if (this._hasExistingSelection) { return true; }
    return !!this._selected?.id_organizzazione;
  }

  constructor(private readonly registrazioneService: RegistrazioneService) {}

  ngOnInit(): void {
    this.items$ = this.typeahead$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching$.next(true)),
      switchMap(term => this.registrazioneService.listOrganizzazioni({ q: term || undefined, page: 0, size: 20 }).pipe(
        catchError(() => of(null))
      )),
      map((response: any) => {
        // Il BE puo` rispondere con `content`/`items`/array
        // diretto; normalizziamo.
        if (Array.isArray(response?.content)) { return response.content as ItemOrganizzazione[]; }
        if (Array.isArray(response?.items)) { return response.items as ItemOrganizzazione[]; }
        if (Array.isArray(response)) { return response as ItemOrganizzazione[]; }
        return [] as ItemOrganizzazione[];
      }),
      tap(() => this.searching$.next(false))
    );
  }

  /**
   * Handler ausiliario per `(change)` di ng-select: lasciamo
   * a `[(ngModel)]` l'aggiornamento di `_selected`. Qui solo
   * normalizziamo un eventuale evento di clear (`undefined`).
   */
  onSelect(item: ItemOrganizzazione | null | undefined): void {
    this._selected = item ?? null;
  }

  onSkip(): void {
    this.skip.emit();
  }

  onConfirm(): void {
    const id = this._selected?.id_organizzazione
      ?? this.organizzazioneRichiesta?.id_organizzazione;
    if (!id) { return; }
    this.confirm.emit(id);
  }

  onChange(): void {
    // L'utente vuole modificare la selezione: pulisce la card
    // riassuntiva localmente e mostra la search. Il parent
    // chiamera` `rimuoviOrganizzazione` quando la nuova
    // selezione sara` confermata (oppure resta lo skip).
    this.organizzazioneRichiesta = null;
    this._selected = null;
  }

  onRemove(): void {
    this.remove.emit();
  }
}
