import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { AdesioniSearchFormComponent, StatoConfigurazione } from './adesioni-search-form.component';

describe('AdesioniSearchFormComponent', () => {
  let component: AdesioniSearchFormComponent;
  const mockConfigService = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockAuthService = {
    isGestore: vi.fn().mockReturnValue(false),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockAuthService.isGestore.mockReturnValue(false);
    Tools.Configurazione = { adesione: { configurazione_automatica: ['profilo1'] } } as any;
    component = new AdesioniSearchFormComponent(
      mockConfigService, mockApiService, mockAuthService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default historyStore', () => {
    expect(component.historyStore).toBe('dashboard-adesioni');
  });

  it('should initialize form with controls', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('id_servizio')).toBeTruthy();
    expect(component._formGroup.get('id_organizzazione')).toBeTruthy();
    expect(component._formGroup.get('id_soggetto')).toBeTruthy();
    expect(component._formGroup.get('id_client')).toBeTruthy();
    expect(component._formGroup.get('stato_configurazione_automatica')).toBeTruthy();
  });

  it('should have configStatusList with 5 entries', () => {
    expect(component.configStatusList.length).toBe(5);
    expect(component.configStatusList[0].value).toBe(StatoConfigurazione.FALLITA);
  });

  it('should populate configStatusEnum', () => {
    expect(Object.keys(component.configStatusEnum).length).toBe(5);
    expect(component.configStatusEnum[StatoConfigurazione.OK]).toBe('APP.STATUS.ok');
  });

  it('should have searchFields', () => {
    expect(component.searchFields.length).toBeGreaterThan(0);
    expect(component.searchFields[0].field).toBe('q');
  });

  it('should return isGestore from authService', () => {
    expect(component.isGestore).toBe(false);
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component.isGestore).toBe(true);
  });

  it('should return hasConfigurazioneAutomatica', () => {
    expect(component.hasConfigurazioneAutomatica).toBe(true);
    Tools.Configurazione = { adesione: { configurazione_automatica: [] } } as any;
    expect(component.hasConfigurazioneAutomatica).toBe(false);
  });

  it('should emit search on _onSearch', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    component._onSearch({ q: 'test' });
    expect(spy).toHaveBeenCalledWith({ q: 'test' });
  });

  it('should update organizzazione on dropdown change', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    const org = { id_organizzazione: 'o1', multi_soggetto: true };
    component.onChangeOrganizzazioneDropdwon(org);
    expect(component._organizzazioneSelected).toBe(org);
    expect(component.showSoggetto).toBe(true);
  });

  it('should hide soggetto when org has no multi_soggetto', () => {
    component.searchBarForm = { setNotCloseForm: vi.fn() } as any;
    component.onChangeOrganizzazioneDropdwon({ id_organizzazione: 'o1' });
    expect(component.showSoggetto).toBe(false);
  });

  it('should getData from API', () => {
    component.getData('servizi', 'test').subscribe((data) => {
      expect(data).toEqual([]);
    });
    expect(mockApiService.getList).toHaveBeenCalled();
  });
});
