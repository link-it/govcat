import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Validators } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AllegatiDialogComponent } from './allegati-dialog.component';
import { Tools } from '@linkit/components';

describe('AllegatiDialogComponent', () => {
  let component: AllegatiDialogComponent;
  let mockModalRef: any;
  let mockApiService: any;
  let mockAuthService: any;
  let savedConfigurazione: any;

  beforeEach(() => {
    vi.clearAllMocks();
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        visibilita_allegati_consentite: ['aderente', 'gestore', 'referente']
      }
    } as any;

    mockModalRef = { hide: vi.fn() };
    mockApiService = {
      postElementRelated: vi.fn().mockReturnValue(of({})),
      putElementRelated: vi.fn().mockReturnValue(of({}))
    };
    mockAuthService = {
      isGestore: vi.fn().mockReturnValue(false)
    };

    vi.spyOn(Tools, 'OnError').mockImplementation(() => {});

    component = new AllegatiDialogComponent(mockModalRef, mockApiService, mockAuthService);
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.model).toBe('');
    expect(component.id).toBeNull();
    expect(component.isNew).toBe(false);
    expect(component.current).toBeNull();
    expect(component.grant).toBeNull();
    expect(component.isEdit).toBe(false);
    expect(component.multiple).toBe(true);
    expect(component.files).toEqual([]);
    expect(component.saving).toBe(false);
    expect(component.error).toBe(false);
    expect(component.errorMsg).toBe('');
    expect(component.showLoading).toBe(true);
  });

  describe('constructor - tipiVisibilitaAllegato filtering', () => {
    it('should exclude gestore for non-gestore users', () => {
      mockAuthService.isGestore.mockReturnValue(false);
      const comp = new AllegatiDialogComponent(mockModalRef, mockApiService, mockAuthService);
      expect(comp.tipiVisibilitaAllegato).toEqual([
        { label: 'aderente', value: 'aderente' },
        { label: 'referente', value: 'referente' }
      ]);
    });

    it('should include gestore for gestore users', () => {
      mockAuthService.isGestore.mockReturnValue(true);
      const comp = new AllegatiDialogComponent(mockModalRef, mockApiService, mockAuthService);
      expect(comp.tipiVisibilitaAllegato).toEqual([
        { label: 'aderente', value: 'aderente' },
        { label: 'gestore', value: 'gestore' },
        { label: 'referente', value: 'referente' }
      ]);
    });

    it('should handle null Configurazione', () => {
      Tools.Configurazione = null;
      const comp = new AllegatiDialogComponent(mockModalRef, mockApiService, mockAuthService);
      // Optional chaining returns undefined when Configurazione is null
      expect(comp.tipiVisibilitaAllegato).toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should create onClose subject', () => {
      component.isNew = true;
      component.ngOnInit();
      expect(component.onClose).toBeDefined();
    });

    it('should call initEditForm without data when isNew', () => {
      component.isNew = true;
      const spy = vi.spyOn(component, 'initEditForm');
      component.ngOnInit();
      expect(spy).toHaveBeenCalledWith();
    });

    it('should call initEditForm with current when not isNew', () => {
      component.isNew = false;
      component.current = { uuid: 'u1', filename: 'test.pdf' };
      const spy = vi.spyOn(component, 'initEditForm');
      component.ngOnInit();
      expect(spy).toHaveBeenCalledWith(component.current);
    });
  });

  describe('f getter', () => {
    it('should return editFormGroup controls', () => {
      component.isNew = true;
      component.ngOnInit();
      const controls = component.f;
      expect(controls['uuid']).toBeDefined();
      expect(controls['filename']).toBeDefined();
    });
  });

  describe('initEditForm', () => {
    it('should initialize with null values when no data', () => {
      component.multiple = true;
      component.showAllAttachments = false;
      component.initEditForm();

      expect(component.files).toEqual([]);
      expect(component.f['uuid'].value).toBeNull();
      expect(component.f['filename'].value).toBeNull();
      expect(component.f['estensione'].value).toBeNull();
      expect(component.f['descrizione'].value).toBeNull();
      expect(component.f['visibilita'].value).toBeNull();
      expect(component.f['tipologia'].value).toBe('generico');
      expect(component.f['content'].value).toBeNull();
      expect(component.f['files'].value).toBeNull();
      expect(component.newDescrittore).toBe(false);
    });

    it('should initialize with data values', () => {
      component.multiple = false;
      const data = {
        uuid: 'u1',
        filename: 'test.pdf',
        estensione: 'application/pdf',
        descrizione: 'My doc',
        visibilita: 'aderente',
        tipologia: 'generico'
      };
      component.initEditForm(data);

      expect(component.f['uuid'].value).toBe('u1');
      expect(component.f['filename'].value).toBe('test.pdf');
      expect(component.f['estensione'].value).toBe('application/pdf');
      expect(component.f['descrizione'].value).toBe('My doc');
      expect(component.f['visibilita'].value).toBe('aderente');
      expect(component.f['tipologia'].value).toBe('generico');
    });

    it('should set tipologia to null when showAllAttachments is true and no data', () => {
      component.showAllAttachments = true;
      component.initEditForm();
      expect(component.f['tipologia'].value).toBeNull();
    });

    it('should set required validators correctly for uuid when data has uuid', () => {
      const data = { uuid: 'u1', filename: 'f', estensione: 'e', descrizione: 'd', visibilita: 'v', tipologia: 't' };
      component.initEditForm(data);
      expect(component.f['uuid'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set required for filename when not multiple', () => {
      component.multiple = false;
      component.initEditForm();
      expect(component.f['filename'].hasValidator(Validators.required)).toBe(true);
    });

    it('should not require filename when multiple', () => {
      component.multiple = true;
      component.initEditForm();
      expect(component.f['filename'].hasValidator(Validators.required)).toBe(false);
    });

    it('should require content when isNew and not multiple and no uuid', () => {
      component.isNew = true;
      component.multiple = false;
      component.initEditForm();
      expect(component.f['content'].hasValidator(Validators.required)).toBe(true);
    });

    it('should require files when multiple', () => {
      component.multiple = true;
      component.initEditForm();
      expect(component.f['files'].hasValidator(Validators.required)).toBe(true);
    });

    it('should set descrittoreCtrl value to data', () => {
      const data = { uuid: 'u1' };
      component.initEditForm(data);
      expect(component.descrittoreCtrl.value).toEqual(data);
    });
  });

  describe('hasControlError', () => {
    beforeEach(() => {
      component.initEditForm();
    });

    it('should return truthy when control has errors and is touched', () => {
      component.f['visibilita'].markAsTouched();
      // visibilita is required, value is null => has errors
      expect(component.hasControlError('visibilita')).toBeTruthy();
    });

    it('should return falsy when control is not touched', () => {
      expect(component.hasControlError('visibilita')).toBeFalsy();
    });

    it('should return falsy when control has no errors', () => {
      component.f['descrizione'].markAsTouched();
      expect(component.hasControlError('descrizione')).toBeFalsy();
    });
  });

  describe('saveModal', () => {
    beforeEach(() => {
      component.model = 'servizi';
      component.id = 'srv-1';
      component.isNew = true;
      component.multiple = true;
      component.ngOnInit();
    });

    it('should create new allegati in multiple mode', () => {
      component.showAllAttachments = true;
      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: 'Desc',
        filename: 'file1.pdf',
        files: [
          { filename: 'file1.pdf', estensione: 'application/pdf', content: 'base64a' }
        ]
      };

      component.saveModal(body);

      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 'srv-1', 'allegati',
        [{ tipologia: 'generico', visibilita: 'aderente', descrizione: 'Desc', filename: 'file1.pdf', content_type: 'application/pdf', content: 'base64a' }]
      );
      expect(component.saving).toBe(false);
    });

    it('should use individual file name for multiple files (>1)', () => {
      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: '',
        filename: 'ignored.pdf',
        files: [
          { filename: 'a.pdf', estensione: 'application/pdf', content: 'c1' },
          { filename: 'b.pdf', estensione: 'application/pdf', content: 'c2' }
        ]
      };

      component.saveModal(body);

      const calledWith = mockApiService.postElementRelated.mock.calls[0][3];
      expect(calledWith[0].filename).toBe('a.pdf');
      expect(calledWith[1].filename).toBe('b.pdf');
    });

    it('should create new allegato in single mode', () => {
      component.multiple = false;
      component.showAllAttachments = true;
      component.initEditForm();

      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: 'Desc',
        filename: 'single.pdf',
        estensione: 'application/pdf',
        content: 'base64content'
      };

      component.saveModal(body);

      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'servizi', 'srv-1', 'allegati',
        [{ tipologia: 'generico', visibilita: 'aderente', descrizione: 'Desc', filename: 'single.pdf', content_type: 'application/pdf', content: 'base64content' }]
      );
    });

    it('should update existing allegato', () => {
      component.isNew = false;
      component.newDescrittore = false;
      component.showAllAttachments = true;
      component.initEditForm({ uuid: 'u1', filename: 'old.pdf', estensione: 'application/pdf', descrizione: 'Old', visibilita: 'aderente', tipologia: 'generico' });

      const body = {
        uuid: 'u1',
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: 'Updated',
        filename: 'old.pdf',
        estensione: 'application/pdf'
      };

      component.saveModal(body);

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'servizi', 'srv-1', 'allegati/u1',
        expect.objectContaining({
          tipologia: 'generico',
          visibilita: 'aderente',
          descrizione: 'Updated',
          filename: 'old.pdf',
          content: { tipo_documento: 'uuid', uuid: 'u1', filename: 'old.pdf', content_type: 'application/pdf' }
        })
      );
    });

    it('should update with new descrittore (new file content)', () => {
      component.isNew = false;
      component.newDescrittore = true;

      const body = {
        uuid: 'u1',
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: 'New file',
        filename: 'new.pdf',
        estensione: 'application/pdf',
        content: 'newbase64'
      };

      component.saveModal(body);

      expect(mockApiService.putElementRelated).toHaveBeenCalledWith(
        'servizi', 'srv-1', 'allegati/u1',
        expect.objectContaining({
          content: { tipo_documento: 'nuovo', filename: 'new.pdf', content_type: 'application/pdf', content: 'newbase64' }
        })
      );
    });

    it('should override tipologia with tipoAllegato when not showAllAttachments', () => {
      component.showAllAttachments = false;
      component.tipoAllegato = 'specifica';

      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: '',
        filename: 'f.pdf',
        files: [{ filename: 'f.pdf', estensione: 'application/pdf', content: 'c' }]
      };

      component.saveModal(body);

      const calledWith = mockApiService.postElementRelated.mock.calls[0][3];
      expect(calledWith[0].tipologia).toBe('specifica');
    });

    it('should set error on API failure', () => {
      mockApiService.postElementRelated.mockReturnValue(throwError(() => ({ status: 500, message: 'Server Error' })));
      vi.spyOn(Tools, 'GetErrorMsg').mockReturnValue('Server Error');

      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: '',
        filename: 'f.pdf',
        files: [{ filename: 'f.pdf', estensione: 'application/pdf', content: 'c' }]
      };

      component.saveModal(body);

      expect(component.saving).toBe(false);
      expect(component.error).toBe(true);
      expect(component.errorMsg).toBe('Server Error');
    });

    it('should call closeModal on success', () => {
      const closeSpy = vi.spyOn(component, 'closeModal');
      const body = {
        tipologia: 'generico',
        visibilita: 'aderente',
        descrizione: '',
        filename: 'f.pdf',
        files: [{ filename: 'f.pdf', estensione: 'application/pdf', content: 'c' }]
      };

      component.saveModal(body);

      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('closeModal', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset saving and error, notify onClose, and hide modal', () => {
      component.saving = true;
      component.error = true;
      const nextSpy = vi.spyOn(component.onClose, 'next');

      component.closeModal(true);

      expect(component.saving).toBe(false);
      expect(component.error).toBe(false);
      expect(nextSpy).toHaveBeenCalledWith(true);
      expect(mockModalRef.hide).toHaveBeenCalled();
    });

    it('should default updated to false', () => {
      const nextSpy = vi.spyOn(component.onClose, 'next');
      component.closeModal();
      expect(nextSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('resetError', () => {
    it('should reset error state', () => {
      component.error = true;
      component.errorMsg = 'some error';
      component.resetError();
      expect(component.error).toBe(false);
      expect(component.errorMsg).toBe('');
    });
  });

  describe('descrittoreChange', () => {
    beforeEach(() => {
      component.multiple = true;
      component.isNew = true;
      component.ngOnInit();
    });

    it('should add file in multiple mode when value has data', () => {
      const value = { file: 'doc.pdf', type: 'application/pdf', data: 'base64data' };
      component.descrittoreChange(value);

      expect(component.files).toHaveLength(1);
      expect(component.files[0]).toEqual({ filename: 'doc.pdf', estensione: 'application/pdf', content: 'base64data' });
      expect(component.f['filename'].value).toBe('doc.pdf');
      expect(component.f['estensione'].value).toBe('application/pdf');
      expect(component.f['content'].value).toBe('base64data');
    });

    it('should clear filename when more than 1 file in multiple mode', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'application/pdf', data: 'c1' });
      component.descrittoreChange({ file: 'b.pdf', type: 'application/pdf', data: 'c2' });

      expect(component.files).toHaveLength(2);
      expect(component.f['filename'].value).toBeNull();
      expect(component.f['estensione'].value).toBeNull();
      expect(component.f['content'].value).toBeNull();
    });

    it('should set files control value', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'application/pdf', data: 'c1' });
      expect(component.f['files'].value).toEqual(component.files);
    });

    it('should reset descrittoreCtrl after adding file in multiple mode', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'application/pdf', data: 'c1' });
      expect(component.descrittoreCtrl.value).toBe('');
    });

    it('should not add file when value has no data in multiple mode', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'application/pdf' });
      expect(component.files).toHaveLength(0);
    });

    it('should handle single mode (not multiple)', () => {
      component.multiple = false;
      component.initEditForm();

      const value = { file: 'single.pdf', type: 'application/pdf', data: 'base64single' };
      component.descrittoreChange(value);

      expect(component.f['filename'].value).toBe('single.pdf');
      expect(component.f['estensione'].value).toBe('application/pdf');
      expect(component.f['content'].value).toBe('base64single');
      expect(component.newDescrittore).toBe(true);
    });

    it('should use filename fallback in single mode', () => {
      component.multiple = false;
      component.initEditForm();

      const value = { filename: 'fallback.pdf', estensione: 'application/pdf' };
      component.descrittoreChange(value);

      expect(component.f['filename'].value).toBe('fallback.pdf');
      expect(component.f['estensione'].value).toBe('application/pdf');
      expect(component.f['content'].value).toBeNull();
    });

    it('should clear uuid validators and set required for filename/estensione/content in single mode', () => {
      component.multiple = false;
      component.initEditForm({ uuid: 'u1', filename: 'f', estensione: 'e', descrizione: 'd', visibilita: 'v', tipologia: 't' });

      component.descrittoreChange({ file: 'new.pdf', type: 'application/pdf', data: 'c' });

      expect(component.f['uuid'].hasValidator(Validators.required)).toBe(false);
      expect(component.f['filename'].hasValidator(Validators.required)).toBe(true);
      expect(component.f['estensione'].hasValidator(Validators.required)).toBe(true);
      expect(component.f['content'].hasValidator(Validators.required)).toBe(true);
    });
  });

  describe('removeFile', () => {
    beforeEach(() => {
      component.multiple = true;
      component.isNew = true;
      component.ngOnInit();
    });

    it('should remove file at index and update controls (1 remaining)', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'ta', data: 'ca' });
      component.descrittoreChange({ file: 'b.pdf', type: 'tb', data: 'cb' });
      expect(component.files).toHaveLength(2);

      component.removeFile(0);

      expect(component.files).toHaveLength(1);
      expect(component.f['filename'].value).toBe('b.pdf');
      expect(component.f['estensione'].value).toBe('tb');
      expect(component.f['content'].value).toBe('cb');
    });

    it('should clear controls when all files removed', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'ta', data: 'ca' });
      component.removeFile(0);

      expect(component.files).toHaveLength(0);
      expect(component.f['filename'].value).toBeNull();
      expect(component.f['estensione'].value).toBeNull();
      expect(component.f['content'].value).toBeNull();
    });

    it('should clear controls when more than 1 file remains', () => {
      component.descrittoreChange({ file: 'a.pdf', type: 'ta', data: 'ca' });
      component.descrittoreChange({ file: 'b.pdf', type: 'tb', data: 'cb' });
      component.descrittoreChange({ file: 'c.pdf', type: 'tc', data: 'cc' });

      component.removeFile(0);

      expect(component.files).toHaveLength(2);
      // default case: clear fields
      expect(component.f['filename'].value).toBeNull();
      expect(component.f['estensione'].value).toBeNull();
    });
  });

  describe('toggleMultiple', () => {
    beforeEach(() => {
      component.isNew = true;
      component.ngOnInit();
    });

    it('should toggle multiple flag', () => {
      expect(component.multiple).toBe(true);
      component.toggleMultiple();
      expect(component.multiple).toBe(false);
      component.toggleMultiple();
      expect(component.multiple).toBe(true);
    });

    it('should reset form controls', () => {
      component.f['estensione'].setValue('application/pdf');
      component.f['descrizione'].setValue('desc');
      component.f['visibilita'].setValue('aderente');
      component.f['tipologia'].setValue('generico');

      component.toggleMultiple();

      expect(component.f['estensione'].value).toBeNull();
      expect(component.f['descrizione'].value).toBeNull();
      expect(component.f['visibilita'].value).toBeNull();
      expect(component.f['tipologia'].value).toBeNull();
      expect(component.f['content'].value).toBeNull();
      expect(component.f['uuid'].value).toBeNull();
      expect(component.f['files'].value).toBeNull();
    });
  });
});
