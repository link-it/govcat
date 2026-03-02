import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { ClientsSearchFormComponent } from './clients-search-form.component';

describe('ClientsSearchFormComponent', () => {
  let component: ClientsSearchFormComponent;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockEventsManager = {
    on: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockEventsManager.on.mockImplementation(() => {});
    Tools.StatiClient = [{ value: 'attivo', label: 'Attivo' }] as any;
    Tools.StatiClientEnum = { attivo: 'Attivo' } as any;
    Tools.Configurazione = { servizio: { api: { auth_type: [{ type: 'https-basic-authentication' }] } } } as any;
    component = new ClientsSearchFormComponent(
      mockTranslate, mockConfigService, mockApiService, mockEventsManager
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default historyStore', () => {
    expect(component.historyStore).toBe('dashboard-clients');
  });

  it('should initialize form with controls', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('stato')).toBeTruthy();
    expect(component._formGroup.get('ambiente')).toBeTruthy();
    expect(component._formGroup.get('id_soggetto')).toBeTruthy();
    expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
  });

  it('should have searchFields', () => {
    expect(component.searchFields.length).toBeGreaterThan(0);
    expect(component.searchFields[0].field).toBe('q');
  });

  it('should populate statiClient on ngOnInit', () => {
    component.ngOnInit();
    expect(component._statiClient.length).toBeGreaterThan(0);
  });

  it('should populate ambiente enum on ngOnInit', () => {
    component.ngOnInit();
    expect(component._ambienteEnum).toEqual(['collaudo', 'produzione']);
  });

  it('should emit search on _onSearch', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    component._onSearch({ q: 'test' });
    expect(spy).toHaveBeenCalledWith({ q: 'test' });
  });

  it('should update selected soggetto on dropdown change', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const soggetto = { id_soggetto: 's1' };
    component.onChangeSearchDropdwon(soggetto, 'soggetto');
    expect(component._searchSoggettoSelected).toBe(soggetto);
  });

  it('should update selected organizzazione on dropdown change', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const org = { id_organizzazione: 'o1' };
    component.onChangeSearchDropdwon(org, 'organizzazione');
    expect(component._searchOrganizzazioneSelected).toBe(org);
  });

  it('should getSoggetti from API', () => {
    component.getSoggetti('test').subscribe((data) => {
      expect(data).toEqual([]);
    });
    expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', expect.objectContaining({ params: { q: 'test' } }));
  });

  it('should getSoggetti with organizzazione filter', () => {
    component._searchOrganizzazioneSelected = { id_organizzazione: 'o1' };
    component.getSoggetti('test').subscribe();
    expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { q: 'test', id_organizzazione: 'o1' } });
  });
});
