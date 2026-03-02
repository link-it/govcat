import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YesnoDialogBsComponent } from './yesno-dialog-bs.component';

describe('YesnoDialogBsComponent', () => {
  let component: YesnoDialogBsComponent;
  let mockBsModalRef: any;

  beforeEach(() => {
    mockBsModalRef = {
      hide: vi.fn()
    };
    component = new YesnoDialogBsComponent(mockBsModalRef);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.title).toBe('');
    expect(component.messages).toEqual([]);
    expect(component.cancelText).toBe('Cencel');
    expect(component.confirmText).toBe('Confirm');
    expect(component.confirmColor).toBe('confirm');
  });

  it('should initialize onClose subject on init', () => {
    component.ngOnInit();
    expect(component.onClose).toBeTruthy();
  });

  it('should emit true and hide modal on confirm', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);

    component.closeModal(true);

    expect(spy).toHaveBeenCalledWith(true);
    expect(mockBsModalRef.hide).toHaveBeenCalled();
  });

  it('should emit false and hide modal on cancel', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);

    component.closeModal(false);

    expect(spy).toHaveBeenCalledWith(false);
    expect(mockBsModalRef.hide).toHaveBeenCalled();
  });

  it('should default to false when closing without argument', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);

    component.closeModal();

    expect(spy).toHaveBeenCalledWith(false);
  });
});
