import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { OrganizzazioneDetailsComponent } from './organizzazione-details.component';
import { Tools } from '@linkit/components';

describe('OrganizzazioneDetailsComponent', () => {
  let component: OrganizzazioneDetailsComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k), onLangChange: of() } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn() } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockTranslate.instant.mockImplementation((k: string) => k);
    Tools.Configurazione = {
      organizzazione: {
        codice_ente_abilitato: false,
        codice_fiscale_ente_abilitato: false,
        id_tipo_utente_abilitato: false,
      }
    };
    component = new OrganizzazioneDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockTools, mockEventsManager, mockApiService, mockUtils
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(OrganizzazioneDetailsComponent.Name).toBe('OrganizzazioneDetailsComponent');
  });

  it('should have model set to organizzazioni', () => {
    expect(component.model).toBe('organizzazioni');
  });

  it('should have default values', () => {
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._isDetails).toBe(true);
    expect(component._useRoute).toBe(true);
  });

  it('should have null id by default', () => {
    expect(component.id).toBeNull();
  });

  it('should have null organizzazione by default', () => {
    expect(component.organizzazione).toBeNull();
  });

  it('should have null config by default', () => {
    expect(component.config).toBeNull();
  });

  it('should have close and save outputs', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have tabs with details', () => {
    expect(component.tabs.length).toBe(1);
    expect(component.tabs[0].link).toBe('details');
    expect(component._currentTab).toBe('details');
  });

  it('should switch tab on _clickTab', () => {
    component._clickTab('other');
    expect(component._currentTab).toBe('other');
  });

  it('should enter edit mode on _editOrganization', () => {
    component._editOrganization();
    expect(component._isEdit).toBe(true);
    expect(component._error).toBe(false);
  });

  it('should cancel edit and reset state on _onCancelEdit when not new', () => {
    component._isNew = false;
    component._isEdit = true;
    component._error = true;
    component._errorMsg = 'some error';
    component._onCancelEdit();
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should navigate to model on _onCancelEdit when new and useRoute', () => {
    component._isNew = true;
    component._isEdit = true;
    component._useRoute = true;
    component._onCancelEdit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['organizzazioni']);
  });

  it('should emit close on _onCancelEdit when new and not useRoute', () => {
    component._isNew = true;
    component._useRoute = false;
    const spy = vi.fn();
    component.close.subscribe(spy);
    component._onCancelEdit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit close on _onClose', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component._onClose();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit save on _onSave', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    component._onSave();
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate on onBreadcrumb when useRoute', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should call _onClose on onBreadcrumb when not useRoute', () => {
    component._useRoute = false;
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.onBreadcrumb({ url: '/test' });
    expect(spy).toHaveBeenCalled();
  });

  it('should init breadcrumb with correct entries', () => {
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Organizations');
  });

  it('should init form with data', () => {
    const data = { nome: 'Test', descrizione: 'desc' };
    component._initForm(data);
    expect(component._formGroup).toBeDefined();
    expect(component._formGroup.get('nome')).toBeTruthy();
    expect(component._formGroup.get('descrizione')).toBeTruthy();
  });

  it('should not init form without data', () => {
    const originalGroup = component._formGroup;
    component._initForm(null);
    expect(component._formGroup).toBe(originalGroup);
  });

  it('should toggle referente in form', () => {
    component._initForm({ referente: false, vincola_referente: false });
    component._toggleReferente();
    expect(component._formGroup.controls['referente'].value).toBe(true);
  });

  it('should toggle aderente in form and manage soggetto dropdown visibility', () => {
    component._initForm({ aderente: false, vincola_aderente: false, id_soggetto_default: null });
    component._toggleAderente();
    expect(component._formGroup.controls['aderente'].value).toBe(true);
    expect(component._hideSoggettoDropdown).toBe(false);
  });

  it('should toggle esterna in form', () => {
    component._isNew = true;
    component._initForm({
      esterna: false, cambio_esterna_consentito: true,
      referente: false, vincola_referente: false,
      aderente: false, vincola_aderente: false,
    });
    component._toggleEsterna();
    expect(component._formGroup.controls['esterna'].value).toBe(true);
  });

  it('should have image placeholder path', () => {
    expect(component._imagePlaceHolder).toBe('./assets/images/logo-placeholder.png');
  });

  it('should have empty soggetti by default', () => {
    expect(component.soggetti).toEqual([]);
  });
});
