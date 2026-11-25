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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Observable, catchError, delay, of, throwError } from 'rxjs';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { ItemStoricoStato, ModuloStoricoStati, nomeUtente, risorsaStoricoStati, storicoStatiMock } from './storico-stati';

const PAGE_SIZE = 20;
/** Ritardo delle pagine di esempio (ms), come una risposta del backend. */
const MOCK_RITARDO = 300;

/** Storico dei cambi di stato di un servizio o di un'adesione, dal più recente, in un pannello laterale. */
@Component({
  selector: 'app-storico-stati-dialog',
  templateUrl: 'storico-stati-dialog.component.html',
  styleUrls: ['storico-stati-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class StoricoStatiDialogComponent implements OnInit, OnDestroy {
  // Valorizzati da `initialState` del BsModalService
  modulo: ModuloStoricoStati = 'servizio';
  data: any = null;
  sottotitolo: string = '';
  /** Colori degli stati (`options.status.values` della configurazione del modulo). */
  stati: Record<string, any> = {};
  workflow: any = null;
  mock: boolean = false;

  _voci: ItemStoricoStato[] = [];
  _totale: number = 0;
  _loading: boolean = false;
  _caricato: boolean = false;
  _errorMsg: string = '';
  private _pagina: number = 0;
  private _storicoMock: ItemStoricoStato[] | null = null;

  /** Fondo dell'elenco: quando è visibile si carica la pagina successiva. */
  private _sentinellaEl: HTMLElement | null = null;
  private _observer: IntersectionObserver | null = null;

  @ViewChild('sentinella') set _sentinella(el: ElementRef<HTMLElement> | undefined) {
    const _nuovo = el?.nativeElement || null;
    if (_nuovo === this._sentinellaEl) { return; }
    this._observer?.disconnect();
    this._observer = null;
    this._sentinellaEl = _nuovo;
    if (_nuovo && typeof IntersectionObserver !== 'undefined') {
      this._observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { this.caricaAltri(); }
      });
      this._observer.observe(_nuovo);
    }
  }

  constructor(
    public readonly bsModalRef: BsModalRef,
    private readonly apiService: OpenAPIService,
    private readonly utils: UtilService
  ) {}

  ngOnInit(): void {
    this._carica();
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }

  private _richiesta(page: number): Observable<any> {
    if (this.mock) {
      this._storicoMock ??= storicoStatiMock(this.data?.stato, this.workflow, this.data?.stato_precedente || null);
      const _contenuto = this._storicoMock.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
      return of({ content: _contenuto, page: { totalElements: this._storicoMock.length } }).pipe(delay(MOCK_RITARDO));
    }
    const _risorsa = risorsaStoricoStati(this.modulo, this.data);
    if (!_risorsa) { return of({ content: [], page: { totalElements: 0 } }); }
    const _params = this.utils._queryToHttpParams({ page, size: PAGE_SIZE });
    return this.apiService.getDetails(_risorsa.model, _risorsa.id, 'storico-stati', { params: _params });
  }

  private _carica() {
    this._loading = true;
    this._errorMsg = '';
    this._richiesta(this._pagina).pipe(
      catchError((error: any) => {
        this._errorMsg = this.utils.GetErrorMsg(error);
        return throwError(() => error);
      })
    ).subscribe({
      next: (resp: any) => {
        this._voci = [...this._voci, ...(resp?.content || [])];
        this._totale = resp?.page?.totalElements ?? this._voci.length;
        this._loading = false;
        this._caricato = true;
        setTimeout(() => this._ricontrollaSentinella());
      },
      error: () => {
        this._loading = false;
        this._caricato = true;
      }
    });
  }

  get _altre(): boolean {
    return this._voci.length < this._totale;
  }

  caricaAltri() {
    if (this._loading || !this._altre || this._errorMsg) { return; }
    this._pagina++;
    this._carica();
  }

  /** Con poche voci la sentinella resta visibile: osservandola di nuovo si carica la pagina successiva. */
  private _ricontrollaSentinella() {
    if (!this._observer || !this._sentinellaEl) { return; }
    this._observer.unobserve(this._sentinellaEl);
    this._observer.observe(this._sentinellaEl);
  }

  _utente(voce: ItemStoricoStato): string {
    return nomeUtente(voce.utente);
  }

  _sfondo(stato: string | null | undefined): string | null {
    return (stato && this.stati?.[stato]?.background) || null;
  }

  _colore(stato: string | null | undefined): string | null {
    return (stato && this.stati?.[stato]?.color) || null;
  }

  chiudi() {
    this.bsModalRef.hide();
  }
}
