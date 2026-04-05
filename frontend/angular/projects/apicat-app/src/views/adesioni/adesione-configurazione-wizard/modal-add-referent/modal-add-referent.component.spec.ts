import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalAddReferentComponent } from './modal-add-referent.component';

describe('ModalAddReferentComponent', () => {
  let component: ModalAddReferentComponent;
  const mockBsModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    postElementRelated: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockUtilService = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ModalAddReferentComponent(
      mockBsModalRef, mockTranslate, mockApiService, mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default properties', () => {
    expect(component.model).toBe('adesioni');
    expect(component.id).toBeNull();
    expect(component.adesione).toBeNull();
    expect(component.title).toBe('APP.TITLE.AddReferent');
    expect(component.referentiFilter).toBe('');
  });

  describe('initEditForm', () => {
    it('should create form with tipo and id_utente controls', () => {
      component.initEditForm();
      expect(component.editFormGroup.get('tipo')).toBeTruthy();
      expect(component.editFormGroup.get('id_utente')).toBeTruthy();
    });

    it('should disable id_utente initially', () => {
      component.initEditForm();
      expect(component.editFormGroup.get('id_utente')?.disabled).toBe(true);
    });

    it('should require tipo', () => {
      component.initEditForm();
      expect(component.editFormGroup.get('tipo')?.hasError('required')).toBe(true);
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      component.initEditForm();
      expect(component.f['tipo']).toBeTruthy();
      expect(component.f['id_utente']).toBeTruthy();
    });
  });

  describe('closeModal', () => {
    it('should emit on onClose and hide modal', () => {
      const closeSpy = vi.fn();
      component.onClose = new Subject();
      component.onClose.subscribe(closeSpy);
      component.closeModal(true);
      expect(closeSpy).toHaveBeenCalledWith(true);
      expect(mockBsModalRef.hide).toHaveBeenCalled();
    });

    it('should emit false by default', () => {
      const closeSpy = vi.fn();
      component.onClose = new Subject();
      component.onClose.subscribe(closeSpy);
      component.closeModal();
      expect(closeSpy).toHaveBeenCalledWith(false);
    });
  });

  describe('saveModal', () => {
    it('should call postElementRelated and close on success', () => {
      component.onClose = new Subject();
      const closeSpy = vi.fn();
      component.onClose.subscribe(closeSpy);
      component.id = 42;
      component.saveModal({ tipo: 'referente', id_utente: 'u1' });
      expect(mockApiService.postElementRelated).toHaveBeenCalledWith(
        'adesioni', 42, 'referenti', { tipo: 'referente', id_utente: 'u1' }
      );
      expect(mockBsModalRef.hide).toHaveBeenCalled();
    });
  });

  describe('_hasControlError', () => {
    it('should return false for untouched control', () => {
      component.initEditForm();
      expect(component._hasControlError('tipo')).toBeFalsy();
    });
  });

  describe('onChangeTipoReferente', () => {
    it('should set referentiTipo and filter for referente', () => {
      component.onChangeTipoReferente({ value: 'referente' });
      expect(component.referentiTipo).toBe('referente');
      expect(component.referentiFilter).toBe('referente_servizio,gestore,coordinatore');
    });

    it('should set empty filter for referente_tecnico', () => {
      component.onChangeTipoReferente({ value: 'referente_tecnico' });
      expect(component.referentiTipo).toBe('referente_tecnico');
      expect(component.referentiFilter).toBe('');
    });
  });

  describe('loadAnagrafiche', () => {
    it('should populate tipo-referente options', () => {
      component.loadAnagrafiche();
      expect(component.anagrafiche['tipo-referente'].length).toBe(2);
      expect(component.anagrafiche['tipo-referente'][0].value).toBe('referente');
      expect(component.anagrafiche['tipo-referente'][1].value).toBe('referente_tecnico');
    });
  });

  describe('getSearchTipo', () => {
    it('should return a bound search function', () => {
      component.loadAnagrafiche();
      const searchFn = component.getSearchTipo();
      expect(typeof searchFn).toBe('function');
    });
  });

  describe('getSearchReferente', () => {
    it('should return a bound search function', () => {
      const searchFn = component.getSearchReferente();
      expect(typeof searchFn).toBe('function');
    });
  });
});
