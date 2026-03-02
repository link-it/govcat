import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { SimpleChange } from '@angular/core';
import { CategoriesComponent } from './categories.component';

describe('CategoriesComponent', () => {
  let component: CategoriesComponent;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockEventsManager = {} as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://api' } } }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({ content: [], page: {}, _links: {} })),
  } as any;
  const mockUtils = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://api' } } });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({ content: [], page: {}, _links: {} }));
    component = new CategoriesComponent(
      mockTranslate, mockEventsManager, mockConfigService,
      mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(CategoriesComponent.Name).toBe('CategoriesComponent');
  });

  it('should have model categorie', () => {
    expect(component.model).toBe('categorie');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://api');
  });

  it('should have default isEditable true', () => {
    expect(component.isEditable).toBe(true);
  });

  it('should have default selectable false', () => {
    expect(component.selectable).toBe(false);
  });

  it('should have default notSelectable empty', () => {
    expect(component.notSelectable).toEqual([]);
  });

  it('should have default selected empty', () => {
    expect(component.selected).toEqual([]);
  });

  it('should have default categories empty', () => {
    expect(component.categories).toEqual([]);
  });

  it('should have default _spin true', () => {
    expect(component._spin).toBe(true);
  });

  it('should have default _error false', () => {
    expect(component._error).toBe(false);
  });

  it('should have default _message', () => {
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    expect(component._messageHelp).toBe('APP.MESSAGE.ERROR.DefaultHelp');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
    expect(component._messageHelp).toBe('APP.MESSAGE.NoResultsHelp');
  });

  it('should load taxonomy categories on ngOnChanges with id', () => {
    component.id = 1;
    mockApiService.getDetails.mockReturnValue(of({
      content: [{ id_categoria: 'c1', nome: 'Cat1', descrizione: 'Desc', figli: null, tassonomia: { id_tassonomia: '1' } }],
    }));
    component.ngOnChanges({ id: new SimpleChange(0, 1, false) });
    expect(mockApiService.getDetails).toHaveBeenCalledWith('tassonomie', 1, 'categorie');
    expect(component.categories.length).toBe(1);
    expect(component.categories[0].id).toBe('c1');
    expect(component.categories[0].id_tassonomia).toBe('1');
  });

  it('should not load on ngOnChanges without id change', () => {
    mockApiService.getDetails.mockClear();
    component.ngOnChanges({});
    expect(mockApiService.getDetails).not.toHaveBeenCalled();
  });

  it('should emit open event', () => {
    const spy = vi.fn();
    component.open.subscribe(spy);
    component.onOpen({ id: '1' });
    expect(spy).toHaveBeenCalledWith({ id: '1' });
  });

  it('should emit action event', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction({ action: 'add', item: { id: '1' } });
    expect(spy).toHaveBeenCalledWith({ action: 'add', item: { id: '1' } });
  });

  it('should reset error', () => {
    component._error = true;
    component._errorMsg = 'err';
    component.__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should subscribe to config in ngOnInit', () => {
    component.ngOnInit();
    expect(mockConfigService.getConfig).toHaveBeenCalledWith('categorie');
  });

  it('should set _spin false after loading categories', () => {
    component.id = 1;
    mockApiService.getDetails.mockReturnValue(of({ content: [] }));
    component._loadTaxonomyCategories();
    expect(component._spin).toBe(false);
  });

  it('should map categories correctly from API response', () => {
    component.id = 1;
    mockApiService.getDetails.mockReturnValue(of({
      content: [
        {
          id_categoria: 'c1',
          nome: 'Cat1',
          descrizione: 'Desc1',
          figli: [{ id_categoria: 'child1' }],
          tassonomia: { id_tassonomia: 't1' }
        },
        {
          id_categoria: 'c2',
          nome: 'Cat2',
          descrizione: null,
          figli: null,
          tassonomia: { id_tassonomia: 't1' }
        }
      ],
    }));
    component._loadTaxonomyCategories();
    expect(component.categories.length).toBe(2);
    expect(component.categories[0].nome).toBe('Cat1');
    expect(component.categories[0].hasChildren).toBe(true);
    expect(component.categories[1].descrizione).toBe('');
    expect(component.categories[1].hasChildren).toBe(false);
  });
});
