import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisableControlDirective } from './disable-control.directive';

describe('DisableControlDirective', () => {
  let directive: DisableControlDirective;
  let mockNgControl: any;

  beforeEach(() => {
    mockNgControl = {
      control: {
        disable: vi.fn(),
        enable: vi.fn()
      }
    };
    directive = new DisableControlDirective(mockNgControl);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should disable control when condition is true', () => {
    directive.disableControl = true;
    expect(mockNgControl.control.disable).toHaveBeenCalled();
  });

  it('should enable control when condition is false', () => {
    directive.disableControl = false;
    expect(mockNgControl.control.enable).toHaveBeenCalled();
  });

  it('should handle missing control gracefully', () => {
    const dirNoControl = new DisableControlDirective({ control: null } as any);
    expect(() => { dirNoControl.disableControl = true; }).not.toThrow();
  });
});
