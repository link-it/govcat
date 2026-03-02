import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisablePermissionDirective } from './disable-permission.directive';
import { SimpleChange } from '@angular/core';

describe('DisablePermissionDirective', () => {
  let directive: DisablePermissionDirective;
  let mockNgControl: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockNgControl = {
      name: 'testField',
      control: {
        enable: vi.fn(),
        disable: vi.fn()
      }
    };
    mockAuthService = {
      canEditField: vi.fn()
    };
    directive = new DisablePermissionDirective(mockNgControl, mockAuthService);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should store control name from NgControl', () => {
    expect(directive.controlName).toBe('testField');
  });

  it('should enable control when user can edit', () => {
    mockAuthService.canEditField.mockReturnValue(true);
    directive.module = 'servizi';
    directive.submodule = 'api';
    directive.state = 'bozza';

    directive.ngOnChanges({ field: new SimpleChange(null, null, true) });

    expect(mockNgControl.control.enable).toHaveBeenCalled();
  });

  it('should disable control when user cannot edit', () => {
    mockAuthService.canEditField.mockReturnValue(false);
    directive.module = 'servizi';

    directive.ngOnChanges({ field: new SimpleChange(null, null, true) });

    expect(mockNgControl.control.disable).toHaveBeenCalled();
  });

  it('should enable control when isNew is true regardless of permission', () => {
    mockAuthService.canEditField.mockReturnValue(false);
    directive.isNew = true;

    directive.ngOnChanges({ field: new SimpleChange(null, null, true) });

    expect(mockNgControl.control.enable).toHaveBeenCalled();
  });

  it('should update controlName from field input change', () => {
    mockAuthService.canEditField.mockReturnValue(true);
    directive.ngOnChanges({
      field: new SimpleChange(null, 'newFieldName', false)
    });
    expect(directive.controlName).toBe('newFieldName');
  });

  it('should pass grant ruoli to canEditField', () => {
    mockAuthService.canEditField.mockReturnValue(true);
    directive.module = 'adesioni';
    directive.submodule = 'config';
    directive.state = 'attivo';
    directive.grant = { ruoli: ['referente_servizio'] } as any;

    directive.ngOnChanges({ field: new SimpleChange(null, null, true) });

    expect(mockAuthService.canEditField).toHaveBeenCalledWith(
      'adesioni', 'config', 'attivo', 'testField', ['referente_servizio']
    );
  });

  it('should handle null NgControl gracefully', () => {
    const directiveNoControl = new DisablePermissionDirective(
      { name: null, control: null } as any,
      mockAuthService
    );
    mockAuthService.canEditField.mockReturnValue(true);
    expect(() => directiveNoControl.ngOnChanges({ field: new SimpleChange(null, null, true) })).not.toThrow();
  });
});
