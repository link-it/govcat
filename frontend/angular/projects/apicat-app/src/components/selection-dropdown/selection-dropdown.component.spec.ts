import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionDropdownComponent } from './selection-dropdown.component';

describe('SelectionDropdownComponent', () => {
  let component: SelectionDropdownComponent;

  beforeEach(() => {
    component = new SelectionDropdownComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default buttonTitle', () => {
    expect(component.buttonTitle).toBe('APP.BUTTON.ChangeStatus');
  });

  it('should have default totalSeleted 0', () => {
    expect(component.totalSeleted).toBe(0);
  });

  it('should not be loading by default', () => {
    expect(component.loading).toBe(false);
  });

  it('should emit action on onAction', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    component.onAction('cambio-stato');
    expect(spy).toHaveBeenCalledWith({ action: 'cambio-stato' });
  });

  it('should have uncheckAllInTheMenu true by default', () => {
    expect(component.uncheckAllInTheMenu).toBe(true);
  });
});
