import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { GruppiComponent, Gruppo } from './gruppi.component';

describe('GruppiComponent', () => {
  let component: GruppiComponent;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockModalService = { show: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://api' } } }),
    getConfig: vi.fn().mockReturnValue(of({ defaultView: 'card' })),
  } as any;
  const mockTools = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: {} })),
    getDetails: vi.fn().mockReturnValue(of({})),
    postElement: vi.fn().mockReturnValue(of({})),
    putElement: vi.fn().mockReturnValue(of({})),
    deleteElement: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
    GetErrorMsg: vi.fn().mockReturnValue('error'),
    _confirmDelection: vi.fn(),
  } as any;
  const mockAuthService = {
    hasPermission: vi.fn().mockReturnValue(true),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.ScrollTo = vi.fn();
    Tools.ScrollElement = vi.fn();
    Tools.Configurazione = { gruppo: { max_image_size: 2 } } as any;
    component = new GruppiComponent(
      mockRouter, mockModalService, mockTranslate,
      mockConfigService, mockTools, mockApiService,
      mockUtils, mockAuthService
    );
  });

  afterEach(() => {
    Tools.Configurazione = null;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(GruppiComponent.Name).toBe('GruppiComponent');
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://api');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoResults');
  });

  it('should reset error', () => {
    component._error = true;
    component._errorMsg = 'test';
    (component as any).__resetError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should navigate on breadcrumb', () => {
    component.onBreadcrumb({ url: '/test' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/test']);
  });

  it('should reset scroll', () => {
    component._resetScroll();
    expect(Tools.ScrollElement).toHaveBeenCalledWith('container-scroller', 0);
  });

  it('should close edit state', () => {
    component._isEdit = true;
    component._isNew = true;
    component._editCurrent = {};
    component._onCloseEdit(null);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._editCurrent).toBeNull();
  });

  it('should convert timestamp to moment', () => {
    expect(component._timestampToMoment(1000)).toEqual(new Date(1000));
    expect(component._timestampToMoment(0)).toBeNull();
  });

  it('should return form controls via f getter', () => {
    component._initEditForm();
    expect(component.f['nome']).toBeDefined();
  });

  it('should check form control error', () => {
    component._initEditForm();
    expect(component._hasControlError('nome')).toBeFalsy();
  });

  it('should prepare body for gruppo', () => {
    const body = component._prepareBodyGruppo({
      id_gruppo_padre: 'p1',
      nome: 'Test', tipo: 'API',
      descrizione: 'Desc', descrizione_sintetica: 'Short',
      immagine: { uuid: 'u1' }
    });
    expect(body.nome).toBe('Test');
    expect(body.padre).toBe('p1');
    expect(body.immagine.tipo_documento).toBe('uuid');
  });

  it('should get logo mapper', () => {
    const logo = component._getLogoMapper({ id_gruppo: 'g1', immagine: { uuid: 'x' } });
    expect(logo).toBe('http://api/gruppi/g1/immagine');
  });

  it('should return empty string when no immagine', () => {
    expect(component._getLogoMapper({ id_gruppo: 'g1' })).toBe('');
  });

  it('should check permission via mapper', () => {
    expect(component._hasPermissioMapper('gruppi', 'write')).toBe(true);
  });

  it('should find group by id', () => {
    const groups: Gruppo[] = [
      { id_gruppo: 'a', nome: 'A', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any, figli: [
        { id_gruppo: 'b', nome: 'B', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any, figli: [], path_gruppo: [] }
      ], path_gruppo: [] }
    ];
    expect(component.findGroupById(groups, 'b')?.nome).toBe('B');
    expect(component.findGroupById(groups, 'c')).toBeNull();
  });

  it('should find parent of group', () => {
    const groups: Gruppo[] = [
      { id_gruppo: 'a', nome: 'A', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any, figli: [
        { id_gruppo: 'b', nome: 'B', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any, figli: [], path_gruppo: [] }
      ], path_gruppo: [] }
    ];
    expect(component.findParentOfGroup(groups, 'b')?.nome).toBe('A');
    expect(component.findParentOfGroup(groups, 'a')).toBeNull();
  });

  it('should flatten group', () => {
    const group: Gruppo = {
      id_gruppo: 'a', nome: 'A', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any,
      figli: [
        { id_gruppo: 'b', nome: 'B', tipo: '', descrizione_sintetica: '', descrizione: '', immagine: null as any, figli: [], path_gruppo: [] }
      ], path_gruppo: []
    };
    const flat = component.flattenGroup(group);
    expect(flat.length).toBe(2);
    expect(flat[0].id_gruppo).toBe('a');
    expect(flat[1].id_gruppo).toBe('b');
  });

  it('should handle image loaded with data', () => {
    component._isNew = false;
    component._initEditForm();
    component._onImageLoaded('data:image/png;base64,abc123');
    const val = component._editFormGroup.get('immagine')?.value;
    expect(val.content_type).toBe('image/png');
    expect(val.content).toBe('abc123');
    expect(val.tipo_documento).toBe('nuovo');
  });

  it('should clear image when null passed', () => {
    component._initEditForm();
    component._onImageLoaded(null);
    expect(component._editFormGroup.get('immagine')?.value).toBeNull();
  });

  it('should handle onAction add', () => {
    const item = { id_gruppo: '1', nome: 'G' };
    component.onAction({ action: 'add', item });
    expect(component._currentGroup).toBe(item);
  });

  it('should handle onAction edit', () => {
    const item = { id_gruppo: '1', nome: 'G' };
    mockApiService.getDetails.mockReturnValue(of(item));
    component.onAction({ action: 'edit', item });
    expect(component._currentGroup).toBeNull();
  });

  it('should handle onAction remove', () => {
    const item = { id_gruppo: '1', nome: 'G' };
    component.onAction({ action: 'remove', item });
    expect(component._currentGroup).toBe(item);
    expect(mockUtils._confirmDelection).toHaveBeenCalled();
  });

  it('should set filter data on search', () => {
    component._onSearch([{ field: 'q', value: 'test' }]);
    expect(component._filterData).toEqual([{ field: 'q', value: 'test' }]);
  });

  it('should reset form', () => {
    component._filterData = [{ field: 'q', value: 'test' }];
    component._resetForm();
    expect(component._filterData).toEqual([]);
  });
});
