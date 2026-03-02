import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgidJwtDialogComponent } from './agid-jwt-dialog.component';

describe('AgidJwtDialogComponent', () => {
  let component: AgidJwtDialogComponent;
  const mockHttp = {} as any;
  const mockClipboard = { copy: vi.fn().mockReturnValue(true) } as any;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockAuthService = {} as any;
  const mockConfigService = { getConfiguration: vi.fn().mockReturnValue({}) } as any;
  const mockUtils = {} as any;
  const mockAuthDialogService = {
    convertSecondsToHours: vi.fn((sec: number) => {
      const h = Math.floor(sec / 3600).toString().padStart(2, '0');
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new AgidJwtDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy pdnd', () => {
    expect(component.tipoPolicy).toBe('pdnd');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GeneratePDNDVoucher');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component.formGroup.contains('kid')).toBe(true);
    expect(component.formGroup.contains('alg')).toBe(true);
    expect(component.formGroup.contains('clientId')).toBe(true);
  });

  it('should initialize from tokenPolicy', () => {
    component.tokenPolicy = {
      codice_policy: 'test_policy',
      type: 'JWT',
      alg_default: 'RS256',
      alg_options: ['RS256', 'RS384'],
      audience: 'https://test.it',
      expires_in: 10,
      token_url: 'https://token.it',
    };
    component.ngOnInit();
    expect(component._codicePolicy).toBe('test_policy');
    expect(component._expiresIn).toBe(10);
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
    component.toggleResult();
    expect(component._showResult).toBe(false);
  });

  it('should convert seconds to hours', () => {
    expect(component.convertSecondsToHours(3600)).toBe('01:00:00');
  });
});
