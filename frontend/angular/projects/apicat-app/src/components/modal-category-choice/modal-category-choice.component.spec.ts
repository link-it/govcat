import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalCategoryChoiceComponent } from './modal-category-choice.component';

describe('ModalCategoryChoiceComponent', () => {
  let component: ModalCategoryChoiceComponent;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = {} as any;
  const mockApiService = {
    getList: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ModalCategoryChoiceComponent(mockModalRef, mockTranslate, mockApiService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.TITLE.AddCategory');
  });

  it('should initialize onClose subject on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component.tassonomie$).toBeDefined();
  });

  it('should close modal', () => {
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should emit selected on onSelected', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.selected = { id: 1, nome: 'Cat' };
    component.onSelected();
    expect(spy).toHaveBeenCalledWith({ id: 1, nome: 'Cat' });
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
  });

  it('should set non-error messages', () => {
    component._setErrorMessages(false);
    expect(component._error).toBe(false);
    expect(component._message).toBe('APP.MESSAGE.NoTaxonomies');
  });

  it('should handle select action', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.onAction({ action: 'select', item: { id: 1 } });
    expect(spy).toHaveBeenCalledWith({ id: 1 });
  });
});
