import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { ServiziSearchFormComponent } from './servizi-search-form.component';

describe('ServiziSearchFormComponent', () => {
  let component: ServiziSearchFormComponent;
  const mockModalService = { show: vi.fn() } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    }),
  } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockAuthService = {
    isGestore: vi.fn().mockReturnValue(false),
    isAnonymous: vi.fn().mockReturnValue(false),
    _getConfigModule: vi.fn().mockReturnValue({ tassonomie_abilitate: false }),
  } as any;
  const mockEventsManager = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    });
    mockAuthService.isGestore.mockReturnValue(false);
    mockAuthService.isAnonymous.mockReturnValue(false);
    mockAuthService._getConfigModule.mockReturnValue({ tassonomie_abilitate: false });
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    Tools.TipiVisibilitaServizio = [{ value: 'dominio', label: 'dominio' }] as any;
    Tools.VisibilitaServizioEnum = { dominio: 'dominio' } as any;
    Tools.Configurazione = { servizio: { api: { profili: [{ codice_interno: 'p1', etichetta: 'Profilo1' }] } } } as any;
    component = new ServiziSearchFormComponent(
      mockModalService, mockConfigService, mockApiService, mockAuthService, mockEventsManager
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default historyStore', () => {
    expect(component.historyStore).toBe('dashboard-servizi');
  });

  it('should have searchFields', () => {
    expect(component.searchFields.length).toBeGreaterThan(0);
    expect(component.searchFields[0].field).toBe('q');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('visibilita')).toBeTruthy();
    expect(component._formGroup.get('profilo')).toBeTruthy();
    expect(component._formGroup.get('tag')).toBeTruthy();
  });

  it('should init profili from Tools.Configurazione', () => {
    component.ngOnInit();
    expect(component.profili.length).toBe(1);
    expect(component.profili[0].codice_interno).toBe('p1');
  });

  it('should add componente visibility for gestore', () => {
    mockAuthService.isGestore.mockReturnValue(true);
    component.ngOnInit();
    expect(component._tipiVisibilitaServizio.find((t: any) => t.value === 'componente')).toBeTruthy();
  });

  it('should not add componente visibility for non-gestore', () => {
    component.ngOnInit();
    expect(component._tipiVisibilitaServizio.find((t: any) => t.value === 'componente')).toBeFalsy();
  });

  it('should return form controls via f getter', () => {
    component.ngOnInit();
    expect(component.f['q']).toBeDefined();
  });

  it('should check _isGestore', () => {
    expect(component._isGestore()).toBe(false);
    mockAuthService.isGestore.mockReturnValue(true);
    expect(component._isGestore()).toBe(true);
  });

  it('should check _isAnonymous', () => {
    expect(component._isAnonymous()).toBe(false);
    mockAuthService.isAnonymous.mockReturnValue(true);
    expect(component._isAnonymous()).toBe(true);
  });

  it('should emit search on _onSearch', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    component._onSearch({ q: 'test', id_gruppo_padre_label: 'Group' });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ q: 'test' }));
  });

  it('should handle _onSearch with categoria', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    component._onSearch({ categoria: 'tax1|cat1', categoriaLabel: 'Tax1|Cat1' });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'cat1' }));
  });

  it('should check hasCategory', () => {
    component._listaCategorie = [{ id_categoria: 'c1' }];
    expect(component.hasCategory('c1')).toBe(true);
    expect(component.hasCategory('c2')).toBe(false);
  });

  it('should delete category', () => {
    component.ngOnInit();
    component._listaCategorie = [
      { id_tassonomia: 't1', nome_tassonomia: 'T1', id_categoria: 'c1', nome_categoria: 'C1' },
      { id_tassonomia: 't1', nome_tassonomia: 'T1', id_categoria: 'c2', nome_categoria: 'C2' },
    ];
    component.onDeleteCategory({ event: { stopImmediatePropagation: vi.fn() }, data: { id_categoria: 'c1' } });
    expect(component._listaCategorie.length).toBe(1);
    expect(component._listaCategorie[0].id_categoria).toBe('c2');
  });

  it('should clearGroup', () => {
    component.ngOnInit();
    component._formGroup.patchValue({ id_gruppo_padre: 'g1', id_gruppo_padre_label: 'Group1' });
    component.clearGroup(null);
    expect(component._formGroup.get('id_gruppo_padre')!.value).toBeNull();
    expect(component._formGroup.get('id_gruppo_padre_label')!.value).toBeNull();
  });

  it('should updateCategoryInput from form values', () => {
    component.ngOnInit();
    component._formGroup.patchValue({ categoria: 't1|c1,t2|c2', categoriaLabel: 'Tax1|Cat1,Tax2|Cat2' });
    component.updateCategoryInput();
    expect(component._listaCategorie.length).toBe(2);
    expect(component._listaCategorie[0].id_tassonomia).toBe('t1');
    expect(component._listaCategorie[0].id_categoria).toBe('c1');
  });
});
