import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { StoricoStatiDialogComponent } from './storico-stati-dialog.component';

describe('StoricoStatiDialogComponent', () => {
  let component: StoricoStatiDialogComponent;
  let mockApi: any;
  const voce = (i: number) => ({ data: `2026-11-0${(i % 9) + 1}T10:00:00Z`, utente: { nome: 'U', cognome: `${i}` }, stato_precedente: 'bozza', stato: 'richiesto_collaudo' });

  beforeEach(() => {
    mockApi = { getDetails: vi.fn(() => of({ content: [voce(1), voce(2)], page: { totalElements: 2 } })) };
    component = new StoricoStatiDialogComponent({ hide: vi.fn() } as any, mockApi, { _queryToHttpParams: (q: any) => q, GetErrorMsg: () => 'Errore' } as any);
    component.modulo = 'adesione';
    component.data = { id_adesione: 'a1', stato: 'richiesto_collaudo' };
  });

  afterEach(() => vi.useRealTimers());

  it('should load the first page of the history of the entity', () => {
    component.ngOnInit();
    expect(mockApi.getDetails).toHaveBeenCalledWith('adesioni', 'a1', 'storico-stati', { params: { page: 0, size: 20 } });
    expect(component._voci.length).toBe(2);
    expect(component._altre).toBe(false);
    expect(component._utente(component._voci[0])).toBe('U 1');
  });

  it('should load the next page while scrolling', () => {
    mockApi.getDetails.mockReturnValueOnce(of({ content: [voce(1)], page: { totalElements: 2 } }));
    component.ngOnInit();
    expect(component._altre).toBe(true);
    component.caricaAltri();
    expect(mockApi.getDetails).toHaveBeenLastCalledWith('adesioni', 'a1', 'storico-stati', { params: { page: 1, size: 20 } });
    expect(component._voci.length).toBe(3);
  });

  it('should show the backend error', () => {
    mockApi.getDetails.mockReturnValue(throwError(() => ({ status: 403 })));
    component.ngOnInit();
    expect(component._errorMsg).toBe('Errore');
    expect(component._loading).toBe(false);
  });

  it('should use the mock history without calling the backend', () => {
    vi.useFakeTimers();
    component.mock = true;
    component.workflow = { cambi_stato: [{ stato_attuale: 'bozza', stato_successivo: { nome: 'richiesto_collaudo' } }] };
    component.ngOnInit();
    vi.advanceTimersByTime(300);
    expect(mockApi.getDetails).not.toHaveBeenCalled();
    expect(component._voci.map((v) => v.stato)).toEqual(['richiesto_collaudo', 'bozza']);
  });

  it('should take the status colors from the configuration', () => {
    component.stati = { bozza: { background: '#dbdbdb', color: '#000000' } };
    expect(component._sfondo('bozza')).toBe('#dbdbdb');
    expect(component._colore('bozza')).toBe('#000000');
    expect(component._sfondo('altro')).toBeNull();
  });
});
