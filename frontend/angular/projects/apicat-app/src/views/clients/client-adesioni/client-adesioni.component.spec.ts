import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClientAdesioniComponent } from './client-adesioni.component';

describe('ClientAdesioniComponent', () => {
  let component: ClientAdesioniComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [], page: {} }));
    mockTranslate.instant.mockImplementation((k: string) => k);
    component = new ClientAdesioniComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClientAdesioniComponent.Name).toBe('ClientAdesioniComponent');
  });

  it('should have model set to client', () => {
    expect(component.model).toBe('client');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(false);
    expect(component.client).toBeNull();
    expect(component._error).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._preventMultiCall).toBe(false);
    expect(component._useRoute).toBe(false);
    expect(component._useDialog).toBe(true);
  });

  it('should have empty clientadesioni by default', () => {
    expect(component.clientadesioni).toEqual([]);
  });

  it('should have empty breadcrumbs by default', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should have default sort settings', () => {
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should init search form in constructor', () => {
    expect(component._formGroup).toBeTruthy();
    expect(component._formGroup.get('fileName')).toBeTruthy();
    expect(component._formGroup.get('status')).toBeTruthy();
    expect(component._formGroup.get('type')).toBeTruthy();
  });

  it('should have default messages', () => {
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should set error messages when error is true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('should reset error messages when error is false', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should reset filter data on _resetForm', () => {
    component._filterData = [{ field: 'q', value: 'test' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/client' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/client']);
  });

  it('should init breadcrumb when client is available', () => {
    component.client = { nome: 'MyClient' };
    component.id = 10;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(4);
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Client');
    expect(component.breadcrumbs[2].label).toBe('MyClient');
    expect(component.breadcrumbs[3].label).toBe('APP.TITLE.Adesioni');
  });

  it('should prepare list adesioni from data', () => {
    component.adesioniConfig = {
      itemRow: {
        primaryText: [{ field: 'nome', type: 'text' }],
        secondaryText: [{ field: 'descrizione', type: 'text' }],
        metadata: { text: [{ field: 'stato', type: 'text' }], label: [] },
        secondaryMetadata: [],
      },
      options: null,
    };
    const data = {
      content: [
        { id_adesione: 1, nome: 'Test', descrizione: 'Desc', stato: 'attivo' }
      ],
      page: { totalElements: 1 },
      _links: null,
    };
    component._prepareListAdesioni(data);
    expect(component.clientadesioni.length).toBe(1);
    expect(component.clientadesioni[0].id).toBe(1);
  });

  it('should handle null data in _prepareListAdesioni', () => {
    component.clientadesioni = [{ id: 1 }] as any;
    component._prepareListAdesioni(null);
    expect(component.clientadesioni).toEqual([]);
  });

  it('should close edit state on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should load anagrafiche with tipo-referente', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
  });

  it('should have selectedAdesione as null by default', () => {
    expect(component._selectedAdesione).toBeNull();
  });

  it('should have showHistory and showSearch as true by default', () => {
    expect(component.showHistory).toBe(true);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
  });
});
