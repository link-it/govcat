import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EMPTY, of } from 'rxjs';
import { ServizioGruppiComponent } from './servizio-gruppi.component';

describe('ServizioGruppiComponent', () => {
  let component: ServizioGruppiComponent;

  const mockRoute = {
    data: of({}),
    params: of({}),
    queryParams: of({})
  } as any;

  const mockRouter = {
    navigate: vi.fn(),
    getCurrentNavigation: vi.fn().mockReturnValue(null)
  } as any;

  const mockModalService = {
    show: vi.fn().mockReturnValue({ content: { onClose: EMPTY } })
  } as any;

  const mockTranslate = {
    instant: vi.fn().mockImplementation((key: string) => key)
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        GOVAPI: { HOST: 'http://localhost' },
        Services: { hideVersions: false }
      }
    }),
    getConfig: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockTools = {} as any;

  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
    postElementRelated: vi.fn().mockReturnValue(of({})),
    deleteElementRelated: vi.fn().mockReturnValue(of({}))
  } as any;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    getAnagrafiche: vi.fn().mockReturnValue({}),
    getUtenti: vi.fn().mockReturnValue(of([]))
  } as any;

  const mockAuthenticationService = {
    isAnonymous: vi.fn().mockReturnValue(false),
    hasPermission: vi.fn().mockReturnValue(true),
    _getConfigModule: vi.fn().mockReturnValue({}),
    isGestore: vi.fn().mockReturnValue(false),
    getRole: vi.fn().mockReturnValue('referente_servizio'),
    _getClassesNotModifiable: vi.fn().mockReturnValue([])
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ServizioGruppiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ServizioGruppiComponent.Name).toBe('ServizioGruppiComponent');
  });

  it('should have model set to servizi', () => {
    expect(component.model).toBe('servizi');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://localhost');
  });

  it('should set hideVersions from config', () => {
    expect(component.hideVersions).toBe(false);
  });

  it('should set service from router state', () => {
    expect(component.service).toBeNull();
  });

  it('should set service and grant from router state when available', () => {
    mockRouter.getCurrentNavigation.mockReturnValue({
      extras: { state: { service: { id_servizio: '1', nome: 'Test' }, grant: { ruoli: ['referente'] } } }
    });
    const comp = new ServizioGruppiComponent(
      mockRoute,
      mockRouter,
      mockModalService,
      mockTranslate,
      mockConfigService,
      mockTools,
      mockApiService,
      mockUtilService,
      mockAuthenticationService
    );
    expect(comp.service).toEqual({ id_servizio: '1', nome: 'Test' });
    expect(comp._grant).toEqual({ ruoli: ['referente'] });
  });

  it('should subscribe to route.data in constructor', () => {
    expect(component._componentBreadcrumbs).toBeNull();
  });

  it('should set error messages correctly', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');

    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should initialize breadcrumbs with service data', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    component._componentBreadcrumbs = null;
    component.hideVersions = false;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
    expect(component.breadcrumbs[1].label).toBe('TestService v. 1');
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.ServiceGroups');
  });

  it('should initialize breadcrumbs with hideVersions', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    component._componentBreadcrumbs = null;
    component.hideVersions = true;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[1].label).toBe('TestService');
  });

  it('should initialize breadcrumbs from dashboard', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = true;
    component._componentBreadcrumbs = null;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
  });

  it('should initialize breadcrumbs with componentBreadcrumbs', () => {
    component.service = { nome: 'TestService', versione: '1', stato: 'pubblicato' };
    component.id = 42;
    component._fromDashboard = false;
    component._componentBreadcrumbs = {
      service: { id_servizio: '10', nome: 'ParentService', versione: '1' },
      breadcrumbs: [{ label: 'APP.TITLE.Services', url: '/servizi', type: 'link' }]
    } as any;
    (component as any)._initBreadcrumb();
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Services');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Components');
  });

  it('should navigate on onBreadcrumb', () => {
    component.onBreadcrumb({ url: '/servizi' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi'], expect.anything());
  });

  it('should close edit on _onCloseEdit', () => {
    component._isEdit = true;
    component._onCloseEdit({});
    expect(component._isEdit).toBe(false);
  });

  it('should set _useDialog to true by default', () => {
    expect(component._useDialog).toBe(true);
  });

  it('should reset form', () => {
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });

  it('should convert timestamp to date', () => {
    const result = component._timestampToMoment(1609459200000);
    expect(result).toBeInstanceOf(Date);
  });

  it('should return null for zero timestamp', () => {
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should check _hasControlError', () => {
    component._editFormGroup = {
      controls: {
        testField: { errors: { required: true }, touched: true }
      }
    } as any;
    expect(component._hasControlError('testField')).toBeTruthy();
  });

  it('should return false for missing field in _hasControlError', () => {
    component._editFormGroup = { controls: {} } as any;
    expect(component._hasControlError('missingField')).toBeFalsy();
  });

  it('should init edit form with disabled id_utente', () => {
    component._initEditForm();
    expect(component._editFormGroup.controls.tipo).toBeDefined();
    expect(component._editFormGroup.controls.id_utente).toBeDefined();
    expect(component._editFormGroup.controls.id_utente.disabled).toBe(true);
  });

  it('should check _canAddMapper returns true when no classes restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue([]);
    expect(component._canAddMapper()).toBe(true);
  });

  it('should check _canAddMapper returns false when both classes restricted', () => {
    component.service = { stato: 'pubblicato' };
    mockAuthenticationService._getClassesNotModifiable.mockReturnValue(['referente', 'referente_superiore']);
    expect(component._canAddMapper()).toBe(false);
  });

  it('should call openChoiceGroupModal on _onNew with dialog', () => {
    component._useDialog = true;
    // openChoiceGroupModal calls modalService.show
    component._onNew();
    expect(mockModalService.show).toHaveBeenCalled();
  });

  it('should set _isEdit on _onNew without dialog', () => {
    component._useDialog = false;
    component._onNew();
    expect(component._isEdit).toBe(true);
    expect(component._editCurrent).toBeNull();
  });

  it('should handle loadAnagrafiche', () => {
    component.loadAnagrafiche();
    expect(component.anagrafiche['tipo-referente']).toBeDefined();
    expect(component.anagrafiche['tipo-referente'].length).toBe(2);
    expect(component.anagrafiche['tipo-referente'][0].nome).toBe('referente');
    expect(component.anagrafiche['tipo-referente'][1].nome).toBe('referente_tecnico');
  });

  it('should handle onChangeTipo', () => {
    component._initEditForm();
    component.onChangeTipo({ nome: 'referente', filter: 'referente_servizio,gestore,coordinatore' });
    expect(component.gruppiFilter).toBe('referente_servizio,gestore,coordinatore');
    expect(component._editFormGroup.controls.id_utente.enabled).toBe(true);
  });

  it('should handle onChangeUser', () => {
    component._errorSave = true;
    component._errorSaveMsg = 'error';
    component.onChangeUser({});
    expect(component._errorSave).toBe(false);
    expect(component._errorSaveMsg).toBe('');
  });

  it('should handle _onChangeTipoReferente', () => {
    component._onChangeTipoReferente(true);
    expect(component.gruppiFilter).toBe('referente_servizio,gestore,coordinatore');
    component._onChangeTipoReferente(false);
    expect(component.gruppiFilter).toBe('');
  });

  it('should handle onActionMonitor backview', () => {
    component.service = { id_servizio: '42' };
    component.onActionMonitor({ action: 'backview' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/42/view']);
  });

  it('should handle onActionMonitor default (no-op)', () => {
    component.service = { id_servizio: '42' };
    mockRouter.navigate.mockClear();
    component.onActionMonitor({ action: 'unknown' });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should handle closeModal', () => {
    component._modalEditRef = { hide: vi.fn() } as any;
    component._errorSave = true;
    component._errorSaveMsg = 'error';
    component.closeModal();
    expect(component._errorSave).toBe(false);
    expect(component._errorSaveMsg).toBe('');
    expect(component._modalEditRef.hide).toHaveBeenCalled();
  });

  it('should initialize search form', () => {
    expect(component._formGroup).toBeDefined();
    // The search form has specific controls from _initSearchForm
    expect(component._formGroup.get('status')).toBeTruthy();
  });
});
