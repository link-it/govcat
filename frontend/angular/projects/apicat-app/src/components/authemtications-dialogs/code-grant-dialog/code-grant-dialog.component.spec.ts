import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { CodeGrantDialogComponent } from './code-grant-dialog.component';

describe('CodeGrantDialogComponent', () => {
  let component: CodeGrantDialogComponent;
  const mockHttp = {} as any;
  const mockClipboard = { copy: vi.fn().mockReturnValue(true) } as any;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockAuthService = {} as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({}),
    getAppConfig: vi.fn().mockReturnValue({ AUTH_SETTINGS: { TOKEN_POLICIES: { code_grant: {} } } }),
  } as any;
  const mockUtils = {} as any;
  const mockAuthDialogService = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new CodeGrantDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy code_grant', () => {
    expect(component.tipoPolicy).toBe('code_grant');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GenerateCodeGrant');
  });

  it('should close modal', () => {
    component.onClose = new Subject();
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should clear error', () => {
    component._error = true;
    component._errorMsg = 'test';
    component.clearError();
    expect(component._error).toBe(false);
    expect(component._errorMsg).toBe('');
  });

  it('should toggle result', () => {
    component._showResult = false;
    component.toggleResult();
    expect(component._showResult).toBe(true);
  });
});
