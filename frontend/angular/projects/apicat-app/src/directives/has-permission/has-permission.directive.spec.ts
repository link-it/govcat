import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HasPermissionDirective } from './has-permission.directive';

describe('HasPermissionDirective', () => {
  let directive: HasPermissionDirective;
  let mockViewContainerRef: any;
  let mockTemplateRef: any;
  let mockAuthService: any;

  beforeEach(() => {
    mockViewContainerRef = {
      createEmbeddedView: vi.fn(),
      clear: vi.fn()
    };
    mockTemplateRef = {};
    mockAuthService = {
      hasPermission: vi.fn()
    };
    directive = new HasPermissionDirective(mockViewContainerRef, mockTemplateRef, mockAuthService);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  describe('behaviour = hide (default)', () => {
    beforeEach(() => {
      directive.behaviour = 'hide';
    });

    it('should show template when user has permission', () => {
      mockAuthService.hasPermission.mockReturnValue(true);
      directive.appHasPermission = 'servizi';
      directive.action = 'view';

      directive.ngOnChanges({});

      expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
      expect(directive.isVisible).toBe(true);
    });

    it('should hide template when user lacks permission', () => {
      mockAuthService.hasPermission.mockReturnValue(false);
      directive.appHasPermission = 'admin';

      directive.ngOnChanges({});

      expect(mockViewContainerRef.clear).toHaveBeenCalled();
      expect(directive.isVisible).toBe(false);
    });

    it('should not re-create view if already visible', () => {
      mockAuthService.hasPermission.mockReturnValue(true);
      directive.appHasPermission = 'servizi';

      directive.ngOnChanges({});
      directive.ngOnChanges({});

      expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(1);
    });

    it('should clear and re-show when permission changes', () => {
      mockAuthService.hasPermission.mockReturnValue(true);
      directive.ngOnChanges({});
      expect(directive.isVisible).toBe(true);

      mockAuthService.hasPermission.mockReturnValue(false);
      directive.ngOnChanges({});
      expect(directive.isVisible).toBe(false);
      expect(mockViewContainerRef.clear).toHaveBeenCalled();
    });
  });

  describe('behaviour = show', () => {
    beforeEach(() => {
      directive.behaviour = 'show';
    });

    it('should hide template when user has permission', () => {
      mockAuthService.hasPermission.mockReturnValue(true);
      directive.ngOnChanges({});

      expect(mockViewContainerRef.clear).toHaveBeenCalled();
      expect(directive.isVisible).toBe(false);
    });

    it('should show template when user lacks permission', () => {
      mockAuthService.hasPermission.mockReturnValue(false);
      directive.ngOnChanges({});

      expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledWith(mockTemplateRef);
      expect(directive.isVisible).toBe(true);
    });

    it('should not re-create view if already visible', () => {
      mockAuthService.hasPermission.mockReturnValue(false);
      directive.ngOnChanges({});
      directive.ngOnChanges({});

      expect(mockViewContainerRef.createEmbeddedView).toHaveBeenCalledTimes(1);
    });
  });

  it('should pass permission and action to auth service', () => {
    mockAuthService.hasPermission.mockReturnValue(true);
    directive.appHasPermission = 'catalogo';
    directive.action = 'edit';

    directive.ngOnChanges({});

    expect(mockAuthService.hasPermission).toHaveBeenCalledWith('catalogo', 'edit');
  });

  it('should use default action = view', () => {
    expect(directive.action).toBe('view');
  });
});
