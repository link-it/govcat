import { describe, it, expect, vi } from 'vitest';
import { EnvToggleComponent } from './env-toggle.component';

describe('EnvToggleComponent', () => {
  it('should emit the selected environment', () => {
    const component = new EnvToggleComponent();
    const spy = vi.fn();
    component.change.subscribe(spy);

    component._onCollaudo();
    component.change.emit('produzione');

    expect(spy).toHaveBeenNthCalledWith(1, 'collaudo');
    expect(spy).toHaveBeenNthCalledWith(2, 'produzione');
  });

  it('should not emit collaudo when it is disabled', () => {
    const component = new EnvToggleComponent();
    const spy = vi.fn();
    component.change.subscribe(spy);
    component.collaudoDisabled = true;

    component._onCollaudo();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should use a distinct id for each tooltip description', () => {
    expect(new EnvToggleComponent()._tooltipId).not.toBe(new EnvToggleComponent()._tooltipId);
  });
});
