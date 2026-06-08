import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientCredentialsDialogComponent } from './client-credentials-dialog.component';

describe('ClientCredentialsDialogComponent', () => {
  let component: ClientCredentialsDialogComponent;
  const mockHttp = {} as any;
  const mockClipboard = { copy: vi.fn().mockReturnValue(true) } as any;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockAuthService = {} as any;
  const mockConfigService = { getConfiguration: vi.fn().mockReturnValue({}) } as any;
  const mockUtils = {} as any;
  const mockAuthDialogService = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ClientCredentialsDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy client_credentials', () => {
    expect(component.tipoPolicy).toBe('client_credentials');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GenerateCredentials');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component.formGroup.contains('clientId')).toBe(true);
    expect(component.formGroup.contains('clientSecret')).toBe(true);
  });

  it('should initialize from tokenPolicy', () => {
    component.tokenPolicy = {
      codice_policy: 'cc_policy',
      type: 'JWT',
      token_url: 'https://token.it',
      scope: 'openid',
    };
    component.ngOnInit();
    expect(component._codicePolicy).toBe('cc_policy');
    expect(component._tokenUrl).toBe('https://token.it');
    expect(component._scope).toBe('openid');
  });

  it('should close modal', () => {
    component.ngOnInit();
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
