import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AboutDialogComponent } from './about-dialog.component';

describe('AboutDialogComponent', () => {
  let component: AboutDialogComponent;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { Layout: { privacyPolicyUrl: 'https://privacy.it' } } }),
    getConfig: vi.fn().mockReturnValue(of({})),
    getPage: vi.fn().mockReturnValue(of('<p>About</p>')),
  } as any;
  const mockModalRef = { hide: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getPage.mockReturnValue(of('<p>About</p>'));
    component = new AboutDialogComponent(mockTranslate, mockConfigService, mockModalRef);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title).toBe('APP.TITLE.About');
  });

  it('should load privacy policy URL from config', () => {
    expect(component.privacyPolicyUrl).toBe('https://privacy.it');
  });

  it('should initialize onClose on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
  });

  it('should close modal', () => {
    component.closeModal(true);
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should handle page load error', () => {
    mockConfigService.getPage.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component._spin).toBe(false);
  });
});
