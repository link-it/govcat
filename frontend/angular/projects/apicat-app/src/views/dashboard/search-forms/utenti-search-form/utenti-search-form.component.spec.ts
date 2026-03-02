import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { UtentiSearchFormComponent } from './utenti-search-form.component';

describe('UtentiSearchFormComponent', () => {
  let component: UtentiSearchFormComponent;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockUtils = {
    _removeEmpty: vi.fn((v: any) => v),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    component = new UtentiSearchFormComponent(
      mockTranslate, mockConfigService, mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default historyStore', () => {
    expect(component.historyStore).toBe('dashboard-utenti');
  });

  it('should initialize form with search fields', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('email')).toBeTruthy();
    expect(component._formGroup.get('ruolo')).toBeTruthy();
    expect(component._formGroup.get('stato')).toBeTruthy();
  });

  it('should have searchFields array', () => {
    expect(component.searchFields.length).toBeGreaterThan(0);
    expect(component.searchFields[0].field).toBe('q');
  });

  it('should populate enums in constructor', () => {
    expect(Object.keys(component._enabledEnum).length).toBeGreaterThan(0);
    expect(Object.keys(component._roleEnum).length).toBeGreaterThan(0);
    expect(Object.keys(component._statoEnum).length).toBeGreaterThan(0);
  });

  it('should populate stato and ruolo arrays on ngOnInit', () => {
    component.ngOnInit();
    expect(component._statoArr.length).toBeGreaterThan(0);
    expect(component._ruoloArr.length).toBeGreaterThan(0);
  });

  it('should emit search on _onSearch', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    component._onSearch({ q: 'test' });
    expect(mockUtils._removeEmpty).toHaveBeenCalledWith({ q: 'test' });
    expect(spy).toHaveBeenCalled();
  });

  it('should update search organizzazione on dropdown change', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const org = { id_organizzazione: 'o1', nome: 'Org1' };
    component.onChangeSearchDropdwon(org);
    expect(component._searchOrganizzazioneSelected).toBe(org);
  });

  it('should getData from API', () => {
    component.getData('organizzazioni', 'test').subscribe((data) => {
      expect(data).toEqual([]);
    });
    expect(mockApiService.getList).toHaveBeenCalledWith('organizzazioni', expect.objectContaining({ params: { q: 'test' } }));
  });
});
