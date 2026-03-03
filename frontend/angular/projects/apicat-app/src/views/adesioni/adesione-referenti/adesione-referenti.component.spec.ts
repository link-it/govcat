import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError, EMPTY } from 'rxjs';
import { AdesioneReferentiComponent } from './adesione-referenti.component';
import { Tools } from '@linkit/components';

describe('AdesioneReferentiComponent', () => {
  let component: AdesioneReferentiComponent;

  const mockRoute = { params: of({ id: 'ade-1' }), parent: { params: of({ id: 'ade-1' }) }, data: of({}) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    getElementRelated: vi.fn().mockReturnValue(of({ content: [] })),
    getDetails: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    getUtenti: vi.fn().mockReturnValue(of([])),
  } as any;
  const mockAuthService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    canChangeStatus: vi.fn().mockReturnValue(false),
    _getClassesNotModifiable: vi.fn().mockReturnValue([]),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Tools, 'ScrollTo').mockImplementation(() => {});
    vi.spyOn(Tools, 'ScrollElement').mockImplementation(() => {});
    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});
    vi.spyOn(Tools, 'showMessage').mockImplementation(() => {});
    component = new AdesioneReferentiComponent(
      mockRoute, mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService, mockAuthService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(AdesioneReferentiComponent.Name).toBe('AdesioneReferentiComponent');
  });

  // -------- Constructor / default values --------

  it('should initialize default property values', () => {
    expect(component.model).toBe('adesioni');
    expect(component.id).toBe(0);
    expect(component.adesione).toBeNull();
    expect(component.adesionereferenti).toEqual([]);
    expect(component._grant).toBeNull();
    expect(component._isEdit).toBe(false);
    expect(component._editCurrent).toBeNull();
    expect(component._hasFilter).toBe(false);
    expect(component._filterData).toEqual([]);
    expect(component._preventMultiCall).toBe(false);
    expect(component._spin).toBe(false);
    expect(component._useRoute).toBe(false);
    expect(component._useDialog).toBe(true);
    expect(component._error).toBe(false);
    expect(component.showHistory).toBe(true);
    expect(component.showSearch).toBe(true);
    expect(component.showSorting).toBe(true);
    expect(component.sortField).toBe('date');
    expect(component.sortDirection).toBe('asc');
    expect(component.minLengthTerm).toBe(1);
    expect(component.referentiLoading).toBe(false);
    expect(component.referentiFilter).toBe('');
    expect(component.referentiTipo).toBeNull();
  });

  it('should set config from configService in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
    expect(component.config).toEqual({ AppConfig: {} });
  });

  it('should subscribe to route.data in constructor', () => {
    const bcData = {
      serviceBreadcrumbs: {
        service: { id_servizio: 99 },
        breadcrumbs: [{ label: 'Servizi', url: '/servizi', type: 'link' }]
      }
    };
    const routeWithData = { params: of({}), data: of(bcData) } as any;
    const routerWithNav = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
    const comp = new AdesioneReferentiComponent(
      routeWithData, routerWithNav, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService, mockAuthService
    );
    expect(comp._serviceBreadcrumbs).toEqual(bcData.serviceBreadcrumbs);
  });

  it('should pick up adesione from navigation state if available', () => {
    const routerWithState = {
      navigate: vi.fn(),
      getCurrentNavigation: vi.fn().mockReturnValue({
        extras: { state: { service: { id: 1, nome: 'TestAdesione' }, grant: { ruoli: ['gestore'] } } }
      })
    } as any;
    const comp = new AdesioneReferentiComponent(
      mockRoute, routerWithState, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService, mockUtilService, mockAuthService
    );
    expect(comp.adesione).toEqual({ id: 1, nome: 'TestAdesione' });
    expect(comp._grant).toEqual({ ruoli: ['gestore'] });
  });

  // -------- _initSearchForm --------

  it('_initSearchForm should create a form with expected controls', () => {
    component._initSearchForm();
    expect(component._formGroup.get('organizationTaxCode')).toBeTruthy();
    expect(component._formGroup.get('creationDateFrom')).toBeTruthy();
    expect(component._formGroup.get('creationDateTo')).toBeTruthy();
    expect(component._formGroup.get('fileName')).toBeTruthy();
    expect(component._formGroup.get('status')).toBeTruthy();
    expect(component._formGroup.get('type')).toBeTruthy();
  });

  // -------- _initEditForm --------

  it('_initEditForm should create form with tipo and id_utente controls', () => {
    component._initEditForm();
    expect(component._editFormGroup.get('tipo')).toBeTruthy();
    expect(component._editFormGroup.get('id_utente')).toBeTruthy();
    expect(component._editFormGroup.get('id_utente')?.disabled).toBe(true);
  });

  // -------- f getter --------

  it('f getter should return _editFormGroup controls', () => {
    component._initEditForm();
    expect(component.f['tipo']).toBeTruthy();
    expect(component.f['id_utente']).toBeTruthy();
  });

  // -------- _hasControlError --------

  it('_hasControlError should return false when control is untouched', () => {
    component._initEditForm();
    expect(component._hasControlError('tipo')).toBe(false);
  });

  it('_hasControlError should return true when control is touched and invalid', () => {
    component._initEditForm();
    const ctrl = component._editFormGroup.get('tipo');
    ctrl?.markAsTouched();
    ctrl?.updateValueAndValidity();
    expect(component._hasControlError('tipo')).toBe(true);
  });

  it('_hasControlError should return false when control is touched and valid', () => {
    component._initEditForm();
    const ctrl = component._editFormGroup.get('tipo');
    ctrl?.setValue('referente');
    ctrl?.markAsTouched();
    ctrl?.updateValueAndValidity();
    expect(component._hasControlError('tipo')).toBe(false);
  });

  // -------- _setErrorMessages --------

  it('_setErrorMessages should set error messages when true', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
  });

  it('_setErrorMessages should reset error messages when false', () => {
    component._error = true;
    component._message = 'some error';
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  // -------- _initBreadcrumb --------

  it('_initBreadcrumb should build breadcrumbs with adesione data', () => {
    component.adesione = {
      id_adesione: 'A1',
      soggetto: { organizzazione: { nome: 'TestOrg' } },
      servizio: { nome: 'TestSvc', versione: '1.0' }
    };
    component._serviceBreadcrumbs = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Subscriptions');
    expect(component.breadcrumbs[1].label).toBe('TestOrg - TestSvc v. 1.0');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceReferents');
  });

  it('_initBreadcrumb should use id when adesione is null', () => {
    component.adesione = null;
    component.id = 42;
    component._serviceBreadcrumbs = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('42');
  });

  it('_initBreadcrumb should prepend serviceBreadcrumbs when present', () => {
    component.adesione = {
      id_adesione: 'A2',
      soggetto: { organizzazione: { nome: 'OrgX' } },
      servizio: { nome: 'SvcX', versione: '2.0' }
    };
    component._serviceBreadcrumbs = {
      service: { id_servizio: 200 },
      breadcrumbs: [{ label: 'Servizi', url: '/servizi', type: 'link' }]
    } as any;
    component._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('Servizi');
    expect(component.breadcrumbs[1].url).toContain('/servizi/200/adesioni');
    expect(component.breadcrumbs[2].label).toBe('OrgX');
  });

  // -------- onBreadcrumb --------

  it('onBreadcrumb should navigate to provided url', () => {
    component.onBreadcrumb({ url: '/adesioni/42' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni/42']);
  });

  // -------- onActionMonitor --------

  it('onActionMonitor should navigate to ../view on backview', () => {
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['../view'], { relativeTo: mockRoute });
  });

  it('onActionMonitor should do nothing for unknown action', () => {
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // -------- _timestampToMoment --------

  it('_timestampToMoment should return Date for valid timestamp', () => {
    const ts = 1704067200000; // 2024-01-01
    const result = component._timestampToMoment(ts);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(ts);
  });

  it('_timestampToMoment should return null for falsy value', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  // -------- _onNew --------

  it('_onNew should call _addReferente when _useDialog is true', () => {
    component._useDialog = true;
    component.referentiConfig = { details: [] };
    // _addReferente will call loadAnagrafiche + _initReferentiSelect + _initEditForm + modalService.show
    component._onNew();
    expect(mockModalService.show).toHaveBeenCalled();
  });

  it('_onNew should set _isEdit when _useDialog is false', () => {
    component._useDialog = false;
    component._onNew();
    expect(component._isEdit).toBe(true);
    expect(component._editCurrent).toBeNull();
  });

  // -------- _onEdit --------

  it('_onEdit should set _editCurrent and _isEdit when not using dialog', () => {
    component._useDialog = false;
    const param = { id: 1, source: { tipo: 'referente' } };
    component._onEdit({}, param);
    expect(component._editCurrent).toBe(param);
    expect(component._isEdit).toBe(true);
  });

  it('_onEdit should do nothing visible when using dialog', () => {
    component._useDialog = true;
    component._isEdit = false;
    component._onEdit({}, { id: 1 });
    expect(component._isEdit).toBe(false);
  });

  // -------- _onCloseEdit --------

  it('_onCloseEdit should set _isEdit to false', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  // -------- _onSearch / _resetForm --------

  it('_onSearch should set filterData and call _loadAdesioneReferenti', () => {
    component.id = 5;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    const values = [{ field: 'status', value: 'active' }];
    component._onSearch(values);
    expect(component._filterData).toEqual(values);
    expect(mockApiService.getDetails).toHaveBeenCalled();
  });

  it('_resetForm should clear filterData and reload', () => {
    component.id = 5;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    component._filterData = [{ field: 'x', value: 'y' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  // -------- _resetScroll --------

  it('_resetScroll should call Tools.ScrollElement', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  // -------- loadAnagrafiche --------

  it('loadAnagrafiche should populate anagrafiche with tipo-referente', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toEqual([
      { nome: 'referente', filter: '' },
      { nome: 'referente_tecnico', filter: '' }
    ]);
  });

  // -------- onChangeTipo --------

  it('onChangeTipo should set referentiFilter, referentiTipo, and enable id_utente', () => {
    component._initEditForm();
    component.onChangeTipo({ nome: 'referente', filter: 'ref_filter' });
    expect(component.referentiFilter).toBe('ref_filter');
    expect(component.referentiTipo).toBe('referente');
    expect(component._editFormGroup.get('id_utente')?.disabled).toBe(false);
  });

  it('onChangeTipo should handle null event', () => {
    component._initEditForm();
    component.onChangeTipo(null);
    expect(component.referentiFilter).toBeNull();
    expect(component.referentiTipo).toBeNull();
  });

  // -------- _onChangeTipoReferente --------

  it('_onChangeTipoReferente should set filter for referent', () => {
    component._onChangeTipoReferente(true);
    expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
  });

  it('_onChangeTipoReferente should clear filter for non-referent', () => {
    component._onChangeTipoReferente(false);
    expect(component.referentiFilter).toBe('');
  });

  // -------- _hasActions --------

  it('_hasActions should return true when isGestore', () => {
    component._grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._hasActions()).toBe(true);
  });

  it('_hasActions should check canChangeStatus when not gestore', () => {
    component._grant = { ruoli: ['referente'] } as any;
    component.adesione = { stato: 'bozza' };
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(true);
    expect(component._hasActions()).toBe(true);
    expect(mockAuthService.canChangeStatus).toHaveBeenCalledWith('adesione', 'bozza', 'stato_successivo', { ruoli: ['referente'] });
  });

  it('_hasActions should return false when no adesione and not gestore', () => {
    component._grant = null;
    component.adesione = null;
    mockAuthService.isGestore.mockReturnValue(false);
    expect(component._hasActions()).toBe(false);
  });

  // -------- _canAddMapper --------

  it('_canAddMapper should return true when no classes are not modifiable and hasActions', () => {
    mockAuthService._getClassesNotModifiable.mockReturnValue([]);
    component.adesione = { stato: 'bozza' };
    component._grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._canAddMapper()).toBe(true);
  });

  it('_canAddMapper should return false when referente is not modifiable and no actions', () => {
    mockAuthService._getClassesNotModifiable.mockReturnValue(['referente']);
    component.adesione = { stato: 'bozza' };
    component._grant = null;
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.canChangeStatus.mockReturnValue(false);
    expect(component._canAddMapper()).toBe(false);
  });

  it('_canAddMapper should return true when both referente and referente_superiore are modifiable', () => {
    mockAuthService._getClassesNotModifiable.mockReturnValue([]);
    component.adesione = { stato: 'bozza' };
    component._grant = { ruoli: ['gestore'] } as any;
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._canAddMapper()).toBe(true);
  });

  // -------- __loadMoreData --------

  it('__loadMoreData should call _loadAdesioneReferenti when next link exists', () => {
    component.id = 5;
    component._links = { next: { href: '/next-page' } };
    component._preventMultiCall = false;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    component.__loadMoreData();
    // _preventMultiCall is set to true then reset to false after response
    expect(component._preventMultiCall).toBe(false);
    expect(mockApiService.getDetails).toHaveBeenCalled();
  });

  it('__loadMoreData should not call when _preventMultiCall is true', () => {
    component._links = { next: { href: '/next-page' } };
    component._preventMultiCall = true;
    component.__loadMoreData();
    // getDetails may have been called from constructor's data subscription, but not from __loadMoreData
    const callCount = mockApiService.getDetails.mock.calls.length;
    expect(callCount).toBe(0);
  });

  it('__loadMoreData should not call when no next link', () => {
    component._links = {};
    component._preventMultiCall = false;
    component.__loadMoreData();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  // -------- _loadAdesioneReferenti --------

  it('_loadAdesioneReferenti should process response content', () => {
    component.id = 5;
    component.referentiConfig = {
      itemRow: {
        primaryText: '${utente.nome}',
        secondaryText: '${tipo}',
        metadata: { text: '${utente.email}', label: '' },
        secondaryMetadata: ''
      },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('formatted');
    mockApiService.getDetails.mockReturnValue(of({
      content: [{ id: 1, utente: { nome: 'Test' }, tipo: 'referente' }],
      page: { totalElements: 1 }
    }));
    component._loadAdesioneReferenti();
    expect(component.adesionereferenti.length).toBe(1);
    expect(component._spin).toBe(false);
  });

  it('_loadAdesioneReferenti should handle error', () => {
    component.id = 5;
    mockApiService.getDetails.mockReturnValue(throwError(() => ({ error: 'fail' })));
    component._loadAdesioneReferenti();
    expect(component._error).toBe(true);
    expect(component._spin).toBe(false);
  });

  it('_loadAdesioneReferenti should do nothing when id is 0', () => {
    component.id = 0;
    component._loadAdesioneReferenti();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('_loadAdesioneReferenti should clear list when no url provided', () => {
    component.id = 5;
    component.adesionereferenti = [{ id: 1 }];
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    component._loadAdesioneReferenti(null, '');
    expect(component.adesionereferenti).toEqual([]);
  });

  // -------- saveModal --------

  it('saveModal should call postElementRelated and reload on success', () => {
    component.id = 5;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    const mockHide = vi.fn();
    component._modalEditRef = { hide: mockHide } as any;
    mockApiService.postElementRelated.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    component.saveModal({ tipo: 'referente', id_utente: 'U1' });
    expect(mockApiService.postElementRelated).toHaveBeenCalledWith('adesioni', 5, 'referenti', { tipo: 'referente', id_utente: 'U1' });
    expect(mockHide).toHaveBeenCalled();
  });

  // -------- closeModal --------

  it('closeModal should hide the modal', () => {
    const mockHide = vi.fn();
    component._modalEditRef = { hide: mockHide } as any;
    component.closeModal();
    expect(mockHide).toHaveBeenCalled();
  });

  // -------- _deleteReferente --------

  it('_deleteReferente should show confirmation dialog', () => {
    const data = { source: { utente: { id_utente: 'U1' }, tipo: 'referente' } };
    const mockOnClose = of(true);
    mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });
    component.id = 5;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    vi.spyOn(Tools, 'simpleItemFormatter').mockReturnValue('');
    mockApiService.deleteElementRelated.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {} }));
    component._deleteReferente(data);
    expect(mockModalService.show).toHaveBeenCalled();
    expect(mockApiService.deleteElementRelated).toHaveBeenCalledWith('adesioni', 5, 'referenti/U1?tipo_referente=referente');
  });

  it('_deleteReferente should handle delete error', () => {
    const data = { source: { utente: { id_utente: 'U1' }, tipo: 'referente' } };
    const mockOnClose = of(true);
    mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });
    component.id = 5;
    component.referentiConfig = {
      itemRow: { primaryText: '', secondaryText: '', metadata: { text: '', label: '' }, secondaryMetadata: '' },
      options: null
    };
    mockApiService.deleteElementRelated.mockReturnValue(throwError(() => ({ error: 'fail' })));
    component._deleteReferente(data);
    expect(component._error).toBe(true);
    expect(Tools.showMessage).toHaveBeenCalledWith('APP.MESSAGE.ERROR.NoDeleteReferent', 'danger', true);
  });

  it('_deleteReferente should not delete when dialog is cancelled', () => {
    const data = { source: { utente: { id_utente: 'U1' }, tipo: 'referente' } };
    const mockOnClose = of(false); // user cancels
    mockModalService.show.mockReturnValue({ content: { onClose: mockOnClose } });
    component._deleteReferente(data);
    expect(mockApiService.deleteElementRelated).not.toHaveBeenCalled();
  });

  // -------- __loadAdesione (double underscore variant) --------

  it('__loadAdesione should load adesione details', () => {
    component.id = 5;
    component.adesione = { id: 'old' };
    const response = {
      id_adesione: 'A1',
      soggetto: { organizzazione: { nome: 'Org' } },
      servizio: { nome: 'Svc', versione: '1.0' }
    };
    mockApiService.getDetails.mockReturnValue(of(response));
    component.__loadAdesione();
    expect(component.adesione).toEqual(response);
  });

  it('__loadAdesione should do nothing when id is 0', () => {
    component.id = 0;
    component.__loadAdesione();
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('__loadAdesione should call OnError on failure', () => {
    component.id = 5;
    mockApiService.getDetails.mockReturnValue(throwError(() => ({ error: 'fail' })));
    component.__loadAdesione();
    expect(Tools.OnError).toHaveBeenCalled();
  });

  // -------- ngOnDestroy --------

  it('ngOnDestroy should not throw', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // -------- _onSort --------

  it('_onSort should not throw', () => {
    expect(() => component._onSort({ field: 'date', direction: 'asc' })).not.toThrow();
  });
});
