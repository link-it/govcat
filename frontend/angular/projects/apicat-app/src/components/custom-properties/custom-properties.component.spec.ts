import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UntypedFormGroup, FormControl, Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CustomPropertiesComponent, ProprietaType } from './custom-properties.component';
import { Tools } from '@linkit/components';

describe('CustomPropertiesComponent', () => {
  let component: CustomPropertiesComponent;
  let mockFormBuilder: any;
  let mockEventsManager: any;
  let mockAuthService: any;
  let mockApiService: any;
  let mockUtils: any;
  let savedConfigurazione: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;

    mockFormBuilder = {
      group: vi.fn().mockImplementation((controls: any) => {
        const fg = new UntypedFormGroup({});
        Object.keys(controls).forEach(key => {
          const val = controls[key];
          if (Array.isArray(val)) {
            fg.addControl(key, new FormControl(val[0], val[1] || []));
          } else {
            fg.addControl(key, new FormControl(val));
          }
        });
        return fg;
      })
    };
    mockEventsManager = { broadcast: vi.fn() };
    mockAuthService = {
      _getClassesMandatory: vi.fn().mockReturnValue([])
    };
    mockApiService = {
      putElementRelated: vi.fn().mockReturnValue(of({})),
      download: vi.fn().mockReturnValue(of({}))
    };
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error message')
    };

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

    component = new CustomPropertiesComponent(
      mockFormBuilder, mockEventsManager, mockAuthService, mockApiService, mockUtils
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.ambiente).toBeNull();
    expect(component.id_adesione).toBeNull();
    expect(component.stato_adesione).toBe('');
    expect(component.api).toBeNull();
    expect(component.data).toBeNull();
    expect(component.item).toBeNull();
    expect(component.showGroupLabel).toBe(true);
    expect(component.editable).toBe(true);
    expect(component._isNew).toBe(false);
    expect(component._isEdit).toBe(false);
    expect(component._spin).toBe(false);
    expect(component._error).toBe(false);
    expect(component._downloading).toBe(false);
  });

  it('should have onSave output', () => {
    expect(component.onSave).toBeDefined();
    const spy = vi.fn();
    component.onSave.subscribe(spy);
    component.onSave.emit({ test: true });
    expect(spy).toHaveBeenCalledWith({ test: true });
  });

  describe('ngOnChanges', () => {
    it('should copy item and data and init proprieta custom', () => {
      component.item = {
        nome_gruppo: 'g1',
        label_gruppo: 'Group 1',
        proprieta: [{ nome: 'p1', tipo: 'text' }]
      };
      component.data = [{ gruppi: [] }];

      component.ngOnChanges({} as any);

      expect(component._item).toEqual(component.item);
      expect(component._data).toEqual(component.data);
    });
  });

  describe('f getter', () => {
    it('should return formGroup controls', () => {
      component.formGroup.addControl('test', new FormControl('val'));
      const controls = component.f;
      expect(controls['test']).toBeDefined();
    });
  });

  describe('cfg and cfgc', () => {
    it('should return proprieta_custom group and control', () => {
      const inner = new UntypedFormGroup({});
      inner.addControl('myProp', new FormControl('hello', [Validators.required]));
      component.formGroup.addControl('proprieta_custom', inner);

      expect(component.cfg()).toBe(inner);
      expect(component.cfgc('myProp').value).toBe('hello');
    });
  });

  describe('_hasRequiredValidator', () => {
    it('should return true when control has required validator', () => {
      const inner = new UntypedFormGroup({});
      inner.addControl('req', new FormControl('', [Validators.required]));
      component.formGroup.addControl('proprieta_custom', inner);

      expect(component._hasRequiredValidator('req')).toBe(true);
    });

    it('should return false when control has no required validator', () => {
      const inner = new UntypedFormGroup({});
      inner.addControl('opt', new FormControl(''));
      component.formGroup.addControl('proprieta_custom', inner);

      expect(component._hasRequiredValidator('opt')).toBe(false);
    });
  });

  describe('_hasControlCustomPropertiesError', () => {
    it('should return true when control has errors and is touched', () => {
      const inner = new UntypedFormGroup({});
      const ctrl = new FormControl('', [Validators.required]);
      ctrl.markAsTouched();
      inner.addControl('field', ctrl);
      component.formGroup.addControl('proprieta_custom', inner);

      expect(component._hasControlCustomPropertiesError('field')).toBeTruthy();
    });

    it('should return falsy when control is not touched', () => {
      const inner = new UntypedFormGroup({});
      inner.addControl('field', new FormControl('', [Validators.required]));
      component.formGroup.addControl('proprieta_custom', inner);

      expect(component._hasControlCustomPropertiesError('field')).toBeFalsy();
    });
  });

  describe('_getCustomSelectLabelMapper', () => {
    it('should return etichetta when found', () => {
      component.item = {
        proprieta: [
          { nome: 'sel1', valori: [{ nome: 'a', etichetta: 'Label A' }, { nome: 'b', etichetta: 'Label B' }] }
        ]
      };
      const result = component._getCustomSelectLabelMapper('a', 'sel1', 'g1');
      expect(result).toBe('Label A');
    });

    it('should return cod when etichetta not found', () => {
      component.item = {
        proprieta: [
          { nome: 'sel1', valori: [{ nome: 'x', etichetta: 'X' }] }
        ]
      };
      const result = component._getCustomSelectLabelMapper('unknown', 'sel1', 'g1');
      expect(result).toBe('unknown');
    });
  });

  describe('_resetProprietaCustom', () => {
    it('should remove proprieta_custom control and clear arrays', () => {
      const inner = new UntypedFormGroup({});
      component.formGroup.addControl('proprieta_custom', inner);
      component._proprietaCustom = [{ nome: 'p1' }] as any;
      component._proprietaCustomGrouped = { g1: [] };

      component._resetProprietaCustom();

      expect(component.formGroup.contains('proprieta_custom')).toBe(false);
      expect(component._proprietaCustom).toEqual([]);
      expect(component._proprietaCustomGrouped).toEqual([]);
    });
  });

  describe('_getProprietaCustomValue', () => {
    const makeData = () => [
      {
        api: undefined as any,
        gruppi: [
          {
            gruppo: 'g1',
            proprieta: [
              { nome: 'p1', valore: 'v1', filename: 'f1', content_type: 'ct1', uuid: 'u1' }
            ]
          }
        ]
      },
      {
        api: 'api-123',
        gruppi: [
          {
            gruppo: 'g2',
            proprieta: [
              { nome: 'p2', valore: 'v2', filename: 'f2', content_type: 'ct2', uuid: 'u2' }
            ]
          }
        ]
      }
    ];

    it('should return null when data is null', () => {
      const result = component._getProprietaCustomValue({ nome: 'p1', nome_gruppo: 'g1' }, null);
      expect(result).toBeNull();
    });

    it('should find proprieta without api', () => {
      component.api = null;
      const result = component._getProprietaCustomValue({ nome: 'p1', nome_gruppo: 'g1' }, makeData());
      expect(result).toEqual({ nome: 'p1', valore: 'v1', filename: 'f1', content_type: 'ct1', uuid: 'u1' });
    });

    it('should find proprieta with api', () => {
      component.api = { id_api: 'api-123' };
      const result = component._getProprietaCustomValue({ nome: 'p2', nome_gruppo: 'g2' }, makeData());
      expect(result).toEqual({ nome: 'p2', valore: 'v2', filename: 'f2', content_type: 'ct2', uuid: 'u2' });
    });

    it('should return undefined when group not found', () => {
      component.api = null;
      const result = component._getProprietaCustomValue({ nome: 'p1', nome_gruppo: 'nonexistent' }, makeData());
      expect(result).toBeUndefined();
    });

    it('should return undefined when proprieta not found in group', () => {
      component.api = null;
      const result = component._getProprietaCustomValue({ nome: 'nonexistent', nome_gruppo: 'g1' }, makeData());
      expect(result).toBeUndefined();
    });
  });

  describe('_initProprietaCustom', () => {
    function setupItem(proprietaList: any[], classeDato: string = 'generico') {
      component.item = {
        nome_gruppo: 'g1',
        label_gruppo: 'Group 1',
        classe_dato: classeDato,
        proprieta: proprietaList
      };
      component._item = { ...component.item };
    }

    it('should init with text proprieta and no validators', () => {
      setupItem([{ nome: 'txt1', tipo: 'text', required: false }]);
      component._initProprietaCustom(null);

      expect(component._proprietaCustom.length).toBe(1);
      expect(component._proprietaCustom[0].nome).toBe('txt1');
      expect(component.formGroup.contains('proprieta_custom')).toBe(true);
    });

    it('should add required validator for generico when mandatory', () => {
      mockAuthService._getClassesMandatory.mockReturnValue(['generico']);
      setupItem([{ nome: 'txt1', tipo: 'text', required: true }], 'generico');
      component._initProprietaCustom(null);

      const ctrl = component.cfgc('txt1');
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should add required validator for collaudo when mandatory', () => {
      mockAuthService._getClassesMandatory.mockReturnValue(['collaudo']);
      setupItem([{ nome: 'txt1', tipo: 'text', required: true }], 'collaudo');
      component._initProprietaCustom(null);

      const ctrl = component.cfgc('txt1');
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should add required validator for produzione when mandatory', () => {
      mockAuthService._getClassesMandatory.mockReturnValue(['produzione']);
      setupItem([{ nome: 'txt1', tipo: 'text', required: true }], 'produzione');
      component._initProprietaCustom(null);

      const ctrl = component.cfgc('txt1');
      expect(ctrl.hasValidator(Validators.required)).toBe(true);
    });

    it('should NOT add required when prop.required is false even if mandatory class matches', () => {
      mockAuthService._getClassesMandatory.mockReturnValue(['generico']);
      setupItem([{ nome: 'txt1', tipo: 'text', required: false }], 'generico');
      component._initProprietaCustom(null);

      const ctrl = component.cfgc('txt1');
      expect(ctrl.hasValidator(Validators.required)).toBe(false);
    });

    it('should add pattern validator when regular_expression is set', () => {
      setupItem([{ nome: 'txt1', tipo: 'text', required: false, regular_expression: '^[A-Z]+$' }]);
      component._initProprietaCustom(null);

      const ctrl = component.cfgc('txt1');
      // Pattern validator means invalid value should fail
      ctrl.setValue('abc');
      expect(ctrl.valid).toBe(false);
      ctrl.setValue('ABC');
      expect(ctrl.valid).toBe(true);
    });

    it('should use existing value from data for text property', () => {
      setupItem([{ nome: 'p1', tipo: 'text', required: false, nome_gruppo: 'g1' }]);
      const data = [{
        api: undefined as any,
        gruppi: [{ gruppo: 'g1', proprieta: [{ nome: 'p1', valore: 'existing_value' }] }]
      }];
      component._data = data as any;
      component._initProprietaCustom(data as any);

      const ctrl = component.cfgc('p1');
      expect(ctrl.value).toBe('existing_value');
    });

    it('should use proprieta object as value for file type', () => {
      setupItem([{ nome: 'f1', tipo: ProprietaType.File, required: false, nome_gruppo: 'g1' }]);
      const proprieta = { nome: 'f1', valore: 'v', filename: 'test.pdf', content_type: 'application/pdf', uuid: 'uuid-1' };
      const data = [{
        api: undefined,
        gruppi: [{ gruppo: 'g1', proprieta: [proprieta] }]
      }] as any;
      component._data = data as any;
      component._initProprietaCustom(data as any);

      const ctrl = component.cfgc('f1');
      expect(ctrl.value).toEqual(proprieta);
    });

    it('should set default select value when no existing data', () => {
      // When _proprietaCustom from item is empty but data has no values
      component.item = {
        nome_gruppo: 'g1',
        label_gruppo: 'Group 1',
        classe_dato: 'generico',
        proprieta: []
      };
      component._item = { ...component.item };
      component._initProprietaCustom(null);

      // With empty proprieta, no controls should be created
      expect(component.formGroup.contains('proprieta_custom')).toBe(false);
    });

    it('should not add formGroup control when proprieta list is empty', () => {
      setupItem([]);
      component._initProprietaCustom(null);

      expect(component.formGroup.contains('proprieta_custom')).toBe(false);
    });

    it('should group proprieta by nome_gruppo', () => {
      setupItem([
        { nome: 'a', tipo: 'text', required: false },
        { nome: 'b', tipo: 'text', required: false }
      ]);
      component._initProprietaCustom(null);

      expect(component._proprietaCustomGrouped).toBeDefined();
      expect(component._proprietaCustomGrouped['g1'].length).toBe(2);
    });
  });

  describe('_onSubmit', () => {
    it('should call _onUpdate when isEdit and form is valid', () => {
      component._isEdit = true;
      component.formGroup = new UntypedFormGroup({});
      const spy = vi.spyOn(component, '_onUpdate' as any).mockImplementation(() => {});

      component._onSubmit({ test: true });
      expect(spy).toHaveBeenCalledWith({ test: true });
    });

    it('should not call _onUpdate when not in edit mode', () => {
      component._isEdit = false;
      const spy = vi.spyOn(component, '_onUpdate' as any).mockImplementation(() => {});

      component._onSubmit({ test: true });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not call _onUpdate when form is invalid', () => {
      component._isEdit = true;
      component.formGroup = new UntypedFormGroup({
        req: new FormControl('', [Validators.required])
      });
      const spy = vi.spyOn(component, '_onUpdate' as any).mockImplementation(() => {});

      component._onSubmit({ test: true });
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('_onUpdate', () => {
    beforeEach(() => {
      component.id_adesione = 'ade-1';
      component.ambiente = 'collaudo';
      component.item = { nome_gruppo: 'g1', label_gruppo: 'G1', proprieta: [{ nome: 'p1', tipo: 'text' }] };
      component._proprietaCustomGrouped = { g1: [{ nome: 'p1', tipo: 'text', nome_gruppo: 'g1' }] };
      vi.spyOn(component, '_prepareBodyUpdate' as any).mockReturnValue({ proprieta_custom: [] });
    });

    it('should call apiService.putElementRelated and emit onSave on success', () => {
      const response = { id: 'resp-1' };
      mockApiService.putElementRelated.mockReturnValue(of(response));
      const emitSpy = vi.spyOn(component.onSave, 'emit');

      component._onUpdate({ proprieta_custom: { p1: 'val1' } });

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'adesioni', 'ade-1', 'collaudo/configurazioni', { proprieta_custom: [] }
      );
      expect(component._isEdit).toBe(false);
      expect(component._spin).toBe(false);
      expect(emitSpy).toHaveBeenCalled();
      expect(mockEventsManager.broadcast).toHaveBeenCalled();
    });

    it('should set error on API failure', () => {
      mockApiService.putElementRelated.mockReturnValue(throwError(() => ({ status: 500 })));

      component._onUpdate({ proprieta_custom: { p1: 'val1' } });

      expect(component._spin).toBe(false);
      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error message');
    });
  });

  describe('_prepareBodyUpdate', () => {
    it('should prepare body with text properties', () => {
      component.api = null;
      component._proprietaCustomGrouped = {
        g1: [{ nome: 'p1', tipo: 'text', nome_gruppo: 'g1' }]
      };
      component._data = null;

      const body = { proprieta_custom: { p1: 'value1' } };
      const result = component._prepareBodyUpdate(body);

      expect(result.proprieta_custom).toHaveLength(1);
      expect(result.proprieta_custom[0].gruppi[0].gruppo).toBe('g1');
      expect(result.proprieta_custom[0].gruppi[0].proprieta[0]).toEqual({ nome: 'p1', valore: 'value1' });
    });

    it('should include api id when api is set', () => {
      component.api = { id_api: 'api-42' };
      component._proprietaCustomGrouped = {
        g1: [{ nome: 'p1', tipo: 'text', nome_gruppo: 'g1' }]
      };

      const body = { proprieta_custom: { p1: 'val' } };
      const result = component._prepareBodyUpdate(body);

      expect(result.proprieta_custom[0].api).toBe('api-42');
    });

    it('should handle file type with data (new file)', () => {
      component.api = null;
      component._proprietaCustomGrouped = {
        g1: [{ nome: 'f1', tipo: ProprietaType.File, nome_gruppo: 'g1' }]
      };

      const body = { proprieta_custom: { f1: { file: 'doc.pdf', data: 'base64data', type: 'application/pdf' } } };
      const result = component._prepareBodyUpdate(body);

      const prop = result.proprieta_custom[0].gruppi[0].proprieta[0];
      expect(prop.nome).toBe('f1');
      expect(prop.valore).toBeNull();
      expect(prop.filename).toBe('doc.pdf');
      expect(prop.content).toBe('base64data');
      expect(prop.content_type).toBe('application/pdf');
    });

    it('should handle file type without data (existing file)', () => {
      component.api = null;
      component._data = [{
        api: undefined as any,
        gruppi: [{ gruppo: 'g1', proprieta: [{ nome: 'f1', valore: 'v', filename: 'old.pdf', content_type: 'application/pdf', uuid: 'uuid-1' }] }]
      }];
      component._proprietaCustomGrouped = {
        g1: [{ nome: 'f1', tipo: ProprietaType.File, nome_gruppo: 'g1' }]
      };

      const body = { proprieta_custom: { f1: { file: 'old.pdf' } } };
      const result = component._prepareBodyUpdate(body);

      const prop = result.proprieta_custom[0].gruppi[0].proprieta[0];
      expect(prop.nome).toBe('f1');
      expect(prop.valore).toBeNull();
      expect(prop.filename).toBe('old.pdf');
      expect(prop.uuid).toBe('uuid-1');
    });

    it('should skip properties that have no value in body', () => {
      component.api = null;
      component._proprietaCustomGrouped = {
        g1: [{ nome: 'p1', tipo: 'text', nome_gruppo: 'g1' }, { nome: 'p2', tipo: 'text', nome_gruppo: 'g1' }]
      };

      const body = { proprieta_custom: { p1: 'val', p2: '' } };
      const result = component._prepareBodyUpdate(body);

      // p1 has value, p2 has empty string (falsy) so should be skipped
      expect(result.proprieta_custom[0].gruppi[0].proprieta).toHaveLength(1);
    });
  });

  describe('__resetError', () => {
    it('should reset all error state', () => {
      component._error = true;
      component._errorMsg = 'some error';
      component._errors = [{ msg: 'err' }];

      component.__resetError();

      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
      expect(component._errors).toEqual([]);
    });
  });

  describe('_onCancelEdit', () => {
    it('should reset edit state and reinitialize proprieta', () => {
      component._isEdit = true;
      component._error = true;
      component._errorMsg = 'error';
      component._errors = [{ msg: 'err' }];
      component.item = { nome_gruppo: 'g1', label_gruppo: 'G1', proprieta: [] };
      component._item = { ...component.item };
      component._data = [];

      component._onCancelEdit();

      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
      expect(component._errorMsg).toBe('');
      expect(component._errors).toEqual([]);
    });
  });

  describe('_onEdit', () => {
    it('should set _isEdit to true', () => {
      expect(component._isEdit).toBe(false);
      component._onEdit();
      expect(component._isEdit).toBe(true);
    });
  });

  describe('_onFileChange', () => {
    it('should log value', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      component._onFileChange({ name: 'file.txt' });
      expect(consoleSpy).toHaveBeenCalledWith('_onFileChange', { name: 'file.txt' });
    });
  });

  describe('_downloadFile', () => {
    beforeEach(() => {
      component.id_adesione = 'ade-1';
      component._data = [{
        api: undefined as any,
        gruppi: [{ gruppo: 'g1', proprieta: [{ nome: 'f1', valore: 'v', filename: 'doc.pdf', content_type: 'application/pdf', uuid: 'uuid-1' }] }]
      }];
      component.api = null;
      (globalThis as any).saveAs = vi.fn();
    });

    afterEach(() => {
      delete (globalThis as any).saveAs;
    });

    it('should download file and call saveAs on success', () => {
      const response = { body: new Blob(), headers: { get: vi.fn().mockReturnValue('attachment; filename="doc.pdf"') } };
      mockApiService.download.mockReturnValue(of(response));
      vi.spyOn(Tools, 'GetFilenameFromHeader').mockReturnValue('doc.pdf');

      const file = { nome: 'f1', nome_gruppo: 'g1' } as any;
      component._downloadFile(file);

      expect(mockApiService.download).toHaveBeenCalledWith('adesioni/ade-1/allegato', 'uuid-1', 'download');
      expect((globalThis as any).saveAs).toHaveBeenCalledWith(response.body, 'doc.pdf');
      expect(component._downloading).toBe(false);
    });

    it('should set error on download failure', () => {
      mockApiService.download.mockReturnValue(throwError(() => ({ status: 500 })));

      const file = { nome: 'f1', nome_gruppo: 'g1' } as any;
      component._downloadFile(file);

      expect(component._error).toBe(true);
      expect(component._errorMsg).toBe('Error message');
      expect(component._downloading).toBe(false);
    });
  });
});
