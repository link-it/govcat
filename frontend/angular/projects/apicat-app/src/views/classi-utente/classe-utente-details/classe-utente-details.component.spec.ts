import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { ClasseUtenteDetailsComponent } from './classe-utente-details.component';

describe('ClasseUtenteDetailsComponent', () => {
  let component: ClasseUtenteDetailsComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
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
    refreshAnagrafiche: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((k: string) => k);
    component = new ClasseUtenteDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClasseUtenteDetailsComponent.Name).toBe('ClasseUtenteDetailsComponent');
  });

  it('should have model set to classi-utente', () => {
    expect(component.model).toBe('classi-utente');
  });

  it('should have default values', () => {
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
    expect(component._isDetails).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._editable).toBe(false);
    expect(component._deleteable).toBe(false);
  });

  it('should have null id by default', () => {
    expect(component.id).toBeNull();
  });

  it('should have null classeUtente by default', () => {
    expect(component.classeUtente).toBeNull();
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

  it('should enter edit mode on _editClasseUtente', () => {
    component._editClasseUtente();
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
    expect(mockRouter.navigate).toHaveBeenCalledWith(['classi-utente']);
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
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.UserClasses');
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

  it('should set nome as required in form', () => {
    component._initForm({ nome: '' });
    const nomeControl = component._formGroup.get('nome');
    expect(nomeControl).toBeTruthy();
    nomeControl!.setValue('');
    nomeControl!.markAsTouched();
    expect(nomeControl!.valid).toBe(false);
  });

  it('should have placeholder paths', () => {
    expect(component._classeUtentePlaceHolder).toBe('./assets/images/logo-placeholder.png');
    expect(component._organizationLogoPlaceholder).toBe('./assets/images/organization-placeholder.png');
  });
});
