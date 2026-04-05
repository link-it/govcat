import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AboutMiniBoxComponent } from './about-mini-box.component';

describe('AboutMiniBoxComponent', () => {
  let component: AboutMiniBoxComponent;
  const mockTranslate = {} as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({}),
    getConfig: vi.fn().mockReturnValue(of({})),
    getPage: vi.fn().mockReturnValue(of('<p>About</p>')),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getPage.mockReturnValue(of('<p>About</p>'));
    component = new AboutMiniBoxComponent(mockTranslate, mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should start with spinner on', () => {
    expect(component._spin).toBe(true);
  });

  it('should load page content on init', () => {
    component.ngOnInit();
    expect(mockConfigService.getPage).toHaveBeenCalledWith('about-box', 'about');
    expect(component.contentHtml).toBe('<p>About</p>');
    expect(component._spin).toBe(false);
  });

  it('should handle error on page load', () => {
    mockConfigService.getPage.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component._spin).toBe(false);
  });
});
