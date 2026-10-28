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
import { Observable, Subject, defer, merge, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

/** Una pagina di risultati: elementi e numero totale di pagine (se noto). */
export interface PaginaTypeahead<T> {
  items: T[];
  totalPages?: number | null;
}

export interface PagedTypeaheadOptions<T> {
  /** Elementi in testa alla lista senza ricerca (es. il valore gia` selezionato); richiede `chiave`. */
  iniziali?: T[];
  /** Chiave per riconoscere un elemento gia` presente. */
  chiave?: (item: T) => any;
  debounce?: number;
  /** Lunghezza minima del termine: sotto questa soglia la lista resta vuota e non si interroga il BE. */
  minTermLength?: number;
}

/** Risposta paginata del BE (`content` + `page.totalPages`) nella forma attesa dal typeahead. */
export function paginaDaRisposta<T = any>(resp: any): PaginaTypeahead<T> {
  return { items: resp?.content || [], totalPages: resp?.page?.totalPages ?? null };
}

/**
 * Typeahead paginato per `ng-select`: un nuovo termine riparte dalla prima pagina,
 * `loadMore()` (da `scrollToEnd`) accoda la pagina successiva finche` ce ne sono.
 * Uso: `[items]="x.items$ | async"`, `[typeahead]="x.input$"`, `[loading]="x.loading"`,
 * `(scrollToEnd)="x.loadMore()"`.
 */
export class PagedTypeahead<T = any> {
  readonly input$ = new Subject<string>();
  readonly items$: Observable<T[]>;
  loading: boolean = false;

  private readonly _more$ = new Subject<void>();
  private _term: string = '';
  private _page: number = 0;
  private _totalPages: number | null = null;
  private _items: T[] = [];

  constructor(
    private readonly fetch: (term: string, page: number) => Observable<PaginaTypeahead<T>>,
    private readonly options: PagedTypeaheadOptions<T> = {}
  ) {
    const _termini$ = this.input$.pipe(
      startWith(''),
      map((term: string | null) => (term || '').trim()),
      debounceTime(options.debounce ?? 300),
      distinctUntilChanged(),
      map((term: string) => ({ term, page: 0 }))
    );
    const _altre$ = this._more$.pipe(map(() => ({ term: this._term, page: this._page + 1 })));

    const _minimo = options.minTermLength ?? 0;

    this.items$ = defer(() => merge(_termini$, _altre$).pipe(
      tap((req: { term: string; page: number }) => this.loading = req.term.length >= _minimo),
      switchMap((req: { term: string; page: number }) => (req.term.length < _minimo
        ? of({ items: [], totalPages: 0 } as PaginaTypeahead<T>)
        : this.fetch(req.term, req.page)
      ).pipe(
        catchError(() => of({ items: [], totalPages: req.page } as PaginaTypeahead<T>)),
        map((pagina: PaginaTypeahead<T>) => this._applica(req, pagina))
      )),
      startWith(options.iniziali || [])
    )).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  /** True se ci sono altre pagine da caricare per il termine corrente. */
  get hasMore(): boolean {
    return this._totalPages !== null && this._page + 1 < this._totalPages;
  }

  loadMore(): void {
    if (this.loading || !this.hasMore) { return; }
    this._more$.next();
  }

  private _applica(req: { term: string; page: number }, pagina: PaginaTypeahead<T>): T[] {
    this.loading = false;
    this._term = req.term;
    this._page = req.page;
    this._totalPages = pagina.totalPages ?? (pagina.items.length ? req.page + 2 : req.page + 1);
    if (req.page === 0) {
      this._items = req.term ? pagina.items : this._conIniziali(pagina.items);
    } else {
      this._items = [...this._items, ...pagina.items.filter((item: T) => !this._presente(item))];
    }
    return this._items;
  }

  private _conIniziali(items: T[]): T[] {
    const _chiave = this.options.chiave;
    if (!_chiave) { return items; }
    const _iniziali = (this.options.iniziali || []).filter((ini: T) => !items.some((item: T) => _chiave(item) === _chiave(ini)));
    return [..._iniziali, ...items];
  }

  private _presente(item: T): boolean {
    const _chiave = this.options.chiave;
    return !!_chiave && this._items.some((i: T) => _chiave(i) === _chiave(item));
  }
}
