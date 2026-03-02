import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LnkFormSubmitComponent } from './submit.component';

describe('LnkFormSubmitComponent', () => {
  let component: LnkFormSubmitComponent;

  beforeEach(() => {
    component = new LnkFormSubmitComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default submitLabel "Submit"', () => {
    expect(component.submitLabel).toBe('Submit');
  });

  it('should have default cancelLabel "Cancel"', () => {
    expect(component.cancelLabel).toBe('Cancel');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should emit cancel when onCancel is called', () => {
    const spy = vi.fn();
    component.cancel.subscribe(spy);
    component.onCancel();
    expect(spy).toHaveBeenCalled();
  });
});
