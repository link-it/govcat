import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgidJwtSignatureTrackingEvidenceDialogComponent } from './agid-jwt-signature-tracking-evidence-dialog.component';

describe('AgidJwtSignatureTrackingEvidenceDialogComponent', () => {
  let component: AgidJwtSignatureTrackingEvidenceDialogComponent;
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
    component = new AgidJwtSignatureTrackingEvidenceDialogComponent(
      mockHttp, mockClipboard, mockModalRef, mockTranslate,
      mockAuthService, mockConfigService, mockUtils, mockAuthDialogService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default tipoPolicy pdnd_audit_integrity', () => {
    expect(component.tipoPolicy).toBe('pdnd_audit_integrity');
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.AUTHENTICATION.TITLE.GenerateSignatureTrackingEvidence');
  });

  it('should initialize form on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component.formGroup.contains('kid')).toBe(true);
    expect(component.formGroup.contains('digest')).toBe(true);
    expect(component.formGroup.contains('userID')).toBe(true);
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

  it('should convert seconds to hours', () => {
    expect(component.convertSecondsToHours(90)).toBe('00:01:30');
  });
});
