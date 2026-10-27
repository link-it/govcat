import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject, of, throwError } from 'rxjs';
import { PagedTypeahead, PaginaTypeahead, paginaDaRisposta } from './paged-typeahead';

describe('PagedTypeahead', () => {
  const _pagine: Record<string, string[][]> = {
    '': [['a', 'b'], ['c', 'd'], ['e']],
    're': [['r1', 'r2'], ['r3']]
  };
  const _fetch = vi.fn((term: string, page: number) => {
    const _p = _pagine[term] || [[]];
    return of({ items: (_p[page] || []).map((id: string) => ({ id })), totalPages: _p.length } as PaginaTypeahead<any>);
  });
  const _ids = (items: any[]) => items.map((i: any) => i.id);

  beforeEach(() => { vi.useFakeTimers(); _fetch.mockClear(); });
  afterEach(() => { vi.useRealTimers(); });

  it('should load the first page and append the next ones until the last', () => {
    const t = new PagedTypeahead(_fetch);
    let _ultimi: any[] = [];
    t.items$.subscribe((items: any[]) => _ultimi = items);
    vi.advanceTimersByTime(300);
    expect(_ids(_ultimi)).toEqual(['a', 'b']);
    t.loadMore();
    t.loadMore();
    expect(_ids(_ultimi)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(t.hasMore).toBe(false);
    t.loadMore();
    expect(_fetch).toHaveBeenCalledTimes(3);
  });

  it('should restart from the first page with a new term', () => {
    const t = new PagedTypeahead(_fetch);
    let _ultimi: any[] = [];
    t.items$.subscribe((items: any[]) => _ultimi = items);
    vi.advanceTimersByTime(300);
    t.loadMore();
    t.input$.next('re');
    vi.advanceTimersByTime(300);
    expect(_ids(_ultimi)).toEqual(['r1', 'r2']);
    expect(_fetch).toHaveBeenLastCalledWith('re', 0);
    t.loadMore();
    expect(_ids(_ultimi)).toEqual(['r1', 'r2', 'r3']);
  });

  it('should keep the initial items on top of the list without search, without duplicates', () => {
    const t = new PagedTypeahead(_fetch, { iniziali: [{ id: 'e' }], chiave: (i: any) => i.id });
    let _ultimi: any[] = [];
    t.items$.subscribe((items: any[]) => _ultimi = items);
    expect(_ids(_ultimi)).toEqual(['e']);
    vi.advanceTimersByTime(300);
    expect(_ids(_ultimi)).toEqual(['e', 'a', 'b']);
    t.loadMore();
    t.loadMore();
    expect(_ids(_ultimi)).toEqual(['e', 'a', 'b', 'c', 'd']);
    t.input$.next('re');
    vi.advanceTimersByTime(300);
    expect(_ids(_ultimi)).toEqual(['r1', 'r2']);
  });

  it('should ignore loadMore while a page is loading', () => {
    const _risposta = new Subject<PaginaTypeahead<any>>();
    const _lento = vi.fn(() => _risposta);
    const t = new PagedTypeahead(_lento);
    t.items$.subscribe();
    vi.advanceTimersByTime(300);
    expect(t.loading).toBe(true);
    t.loadMore();
    expect(_lento).toHaveBeenCalledTimes(1);
    _risposta.next({ items: [{ id: 'a' }], totalPages: 2 });
    expect(t.loading).toBe(false);
    expect(t.hasMore).toBe(true);
  });

  it('should stop on error', () => {
    const t = new PagedTypeahead(() => throwError(() => new Error('ko')));
    let _ultimi: any[] = [{ id: 'x' }];
    t.items$.subscribe((items: any[]) => _ultimi = items);
    vi.advanceTimersByTime(300);
    expect(_ultimi).toEqual([]);
    expect(t.hasMore).toBe(false);
    expect(t.loading).toBe(false);
  });

  it('should not search below the minimum term length', () => {
    const t = new PagedTypeahead(_fetch, { minTermLength: 2 });
    let _ultimi: any[] = [{ id: 'x' }];
    t.items$.subscribe((items: any[]) => _ultimi = items);
    vi.advanceTimersByTime(300);
    expect(_ultimi).toEqual([]);
    t.input$.next('r');
    vi.advanceTimersByTime(300);
    expect(_fetch).not.toHaveBeenCalled();
    t.input$.next('re');
    vi.advanceTimersByTime(300);
    expect(_ids(_ultimi)).toEqual(['r1', 'r2']);
    t.loadMore();
    expect(_ids(_ultimi)).toEqual(['r1', 'r2', 'r3']);
  });

  it('should read a paged response of the backend', () => {
    expect(paginaDaRisposta({ content: [{ id: 1 }], page: { totalPages: 3 } })).toEqual({ items: [{ id: 1 }], totalPages: 3 });
    expect(paginaDaRisposta(null)).toEqual({ items: [], totalPages: null });
  });
});
