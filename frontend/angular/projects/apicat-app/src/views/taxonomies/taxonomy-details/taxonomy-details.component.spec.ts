import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { TaxonomyDetailsComponent } from './taxonomy-details.component';

describe('TaxonomyDetailsComponent', () => {
  let component: TaxonomyDetailsComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn(), getCurrentNavigation: vi.fn().mockReturnValue(null) } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ id_tassonomia: '1', nome: 'Tax1', descrizione: 'Desc', visibile: true, obbligatorio: false })),
    saveElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _confirmDelection: vi.fn(),
  } as any;
  const mockNavigationService = {
    navigateWithEvent: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ id_tassonomia: '1', nome: 'Tax1', descrizione: 'Desc', visibile: true, obbligatorio: false }));
    mockApiService.saveElement.mockReturnValue(of({}));
    mockApiService.putElement.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((k: string) => k);
    Tools.OnError = vi.fn() as any;
    component = new TaxonomyDetailsComponent(
      mockRoute, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils, mockNavigationService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(TaxonomyDetailsComponent.Name).toBe('TaxonomyDetailsComponent');
  });

  it('should have model tassonomie', () => {
    expect(component.model).toBe('tassonomie');
  });

  it('should have default _isEdit false', () => {
    expect(component._isEdit).toBe(false);
  });

  it('should have default _isNew false', () => {
    expect(component._isNew).toBe(false);
  });

  it('should have default _spin true', () => {
    expect(component._spin).toBe(true);
  });

  it('should have default _error false', () => {
    expect(component._error).toBe(false);
  });

  it('should have _useRoute true', () => {
    expect(component._useRoute).toBe(true);
  });

  it('should have empty breadcrumbs by default', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should have id null by default', () => {
    expect(component.id).toBeNull();
  });

  it('should init form from data', () => {
    component._initForm({ nome: 'Test', descrizione: 'Desc', visibile: true, obbligatorio: false });
    expect(component._formGroup.get('nome')).toBeTruthy();
    expect(component._formGroup.get('nome')!.value).toBe('Test');
    expect(component._formGroup.get('descrizione')).toBeTruthy();
    expect(component._formGroup.get('descrizione')!.value).toBe('Desc');
  });

  it('should init form with null values', () => {
    component._initForm({ nome: null, descrizione: null });
    expect(component._formGroup.get('nome')!.value).toBeNull();
    expect(component._formGroup.get('descrizione')!.value).toBeNull();
  });

  it('should prepare data with defaults', () => {
    const result = component._prapareData({ nome: 'Test' });
    expect(result.nome).toBe('Test');
    expect(result.visibile).toBe(false);
    expect(result.obbligatorio).toBe(false);
  });

  it('should prepare data preserving visibile/obbligatorio', () => {
    const result = component._prapareData({ nome: 'Test', visibile: true, obbligatorio: true });
    expect(result.visibile).toBe(true);
    expect(result.obbligatorio).toBe(true);
  });

  it('should toggle visibile', () => {
    component._initForm({ nome: 'Test', visibile: false });
    component._changeVisible(null);
    expect(component.f['visibile'].value).toBe(true);
  });

  it('should toggle obbligatorio', () => {
    component._initForm({ nome: 'Test', obbligatorio: false });
    component._changeMandatory(null);
    expect(component.f['obbligatorio'].value).toBe(true);
  });

  it('should init breadcrumb for existing', () => {
    component.id = 1;
    component.taxonomy = { nome: 'Tax1' };
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Configurations');
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Taxonomies');
    expect(component.breadcrumbs[2].label).toBe('Tax1');
  });

  it('should init breadcrumb for new', () => {
    component.id = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
  });

  it('should set edit mode on _editTaxonomy', () => {
    component._editTaxonomy();
    expect(component._isEdit).toBe(true);
    expect(component._error).toBe(false);
  });

  it('should cancel edit for existing taxonomy', () => {
    component._isEdit = true;
    component._isNew = false;
    component.taxonomy = { id_tassonomia: '1', nome: 'Tax1' };
    component._onCancelEdit();
    expect(component._isEdit).toBe(false);
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should navigate to model on cancel new', () => {
    component._isNew = true;
    component._isEdit = true;
    component._onCancelEdit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['tassonomie']);
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/tassonomie' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tassonomie']);
  });

  it('should navigate to categories on _onCategory', () => {
    component.id = 1;
    component._onCategory(undefined);
    expect(mockNavigationService.navigateWithEvent).toHaveBeenCalledWith(
      undefined, ['tassonomie', 1, 'categorie']
    );
  });

  it('should emit save on _onSave', () => {
    const spy = vi.fn();
    component.save.subscribe(spy);
    component.id = 1;
    component._taxonomy = { nome: 'Tax1' } as any;
    component._onSave();
    expect(spy).toHaveBeenCalledWith({ id: 1, taxonomy: component._taxonomy });
  });

  it('should not submit if not in edit mode', () => {
    component._isEdit = false;
    component._onSubmit({});
    expect(mockApiService.saveElement).not.toHaveBeenCalled();
    expect(mockApiService.putElement).not.toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    component._isEdit = true;
    component._initForm({ nome: '' });
    component._formGroup.get('nome')!.setValue('');
    component._formGroup.get('nome')!.markAsTouched();
    component._onSubmit(component._formGroup.value);
    expect(mockApiService.saveElement).not.toHaveBeenCalled();
  });

  it('should call ngOnInit and subscribe to route params', () => {
    component.ngOnInit();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('tassonomie');
  });

  it('should set _isNew and _isEdit for new route', () => {
    const mockRouteNew = { params: of({ id: 'new' }) } as any;
    const comp = new TaxonomyDetailsComponent(
      mockRouteNew, mockRouter, mockTranslate, mockModalService,
      mockConfigService, mockTools, mockEventsManager,
      mockApiService, mockUtils, mockNavigationService
    );
    comp.ngOnInit();
    expect(comp._isNew).toBe(true);
    expect(comp._isEdit).toBe(true);
    expect(comp._spin).toBe(false);
  });

  it('should have f getter returning form controls', () => {
    component._initForm({ nome: 'Test' });
    expect(component.f['nome']).toBeTruthy();
    expect(component.f['nome'].value).toBe('Test');
  });

  it('should check _hasControlError', () => {
    component._initForm({ nome: 'Test' });
    expect(component._hasControlError('nome')).toBeFalsy();
  });
});
