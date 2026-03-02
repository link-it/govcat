import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LnkButtonComponent } from './button.component';

describe('LnkButtonComponent', () => {
  let component: LnkButtonComponent;

  beforeEach(() => {
    component = new LnkButtonComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default type "button"', () => {
    expect(component.type).toBe('button');
  });

  it('should have default size "md"', () => {
    expect(component.size).toBe('md');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should not be primary by default', () => {
    expect(component.primary).toBe(false);
  });

  it('should emit onAction when _onClick is called', () => {
    const spy = vi.fn();
    component.onAction.subscribe(spy);
    component._onClick();
    expect(spy).toHaveBeenCalledWith({});
  });

  it('should accept custom inputs', () => {
    component.label = 'Test';
    component.icon = 'bi bi-check';
    component.primary = true;
    component.danger = true;
    expect(component.label).toBe('Test');
    expect(component.icon).toBe('bi bi-check');
    expect(component.primary).toBe(true);
    expect(component.danger).toBe(true);
  });
});
