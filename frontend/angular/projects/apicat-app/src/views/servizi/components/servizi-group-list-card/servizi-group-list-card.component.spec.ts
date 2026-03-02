import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiziGroupListCardComponent } from './servizi-group-list-card.component';

describe('ServiziGroupListCardComponent', () => {
  let component: ServiziGroupListCardComponent;

  const mockUtilsLib = {
    contrast: vi.fn().mockReturnValue('#000000')
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    }),
    getAppConfig: vi.fn().mockReturnValue({
      Layout: { enableOpenInNewTab: false }
    })
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUtilsLib.contrast.mockReturnValue('#000000');
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { GOVAPI: { HOST: 'http://localhost' } }
    });
    mockConfigService.getAppConfig.mockReturnValue({
      Layout: { enableOpenInNewTab: false }
    });
    component = new ServiziGroupListCardComponent(mockUtilsLib, mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.data).toBeNull();
    expect(component.config).toBeNull();
    expect(component.isAnonymous).toBe(false);
    expect(component.image).toBe('');
    expect(component.showImage).toBe(true);
    expect(component.showEmptyImage).toBe(true);
    expect(component.primaryText).toBe('');
    expect(component.secondaryText).toBe('');
    expect(component.metadata).toBe('');
    expect(component.backColor).toBe('#f1f1f1');
    expect(component.textColor).toBe('#000000');
    expect(component.numberCharLogoText).toBe(2);
    expect(component.enabledImageLink).toBe(false);
    expect(component.showGroupIcon).toBe(false);
    expect(component.showGroupLabel).toBe(false);
    expect(component.groupLabel).toBe('Group');
  });

  it('should have default property values', () => {
    expect(component.logoText).toBe('');
    expect(component.enableOpenInNewTab).toBe(false);
  });

  it('should compute logoText from primaryText on ngOnInit', () => {
    component.primaryText = 'TestService';
    component.numberCharLogoText = 3;
    component.ngOnInit();
    expect(component.logoText).toBe('Tes');
  });

  it('should set backColor to #f1f1f1 when image is present', () => {
    component.image = 'http://example.com/image.png';
    component.backColor = '#ff0000';
    component.ngOnInit();
    expect(component.backColor).toBe('#f1f1f1');
  });

  it('should call utilsLib.contrast on ngOnInit', () => {
    component.ngOnInit();
    expect(mockUtilsLib.contrast).toHaveBeenCalledWith('#f1f1f1');
  });

  it('should set enableOpenInNewTab from appConfig', () => {
    mockConfigService.getAppConfig.mockReturnValue({
      Layout: { enableOpenInNewTab: true }
    });
    component.ngOnInit();
    expect(component.enableOpenInNewTab).toBe(true);
  });

  it('should emit simpleClick on onCardClick', () => {
    const emitSpy = vi.spyOn(component.simpleClick, 'emit');
    const event = { type: 'click' } as any;
    component.data = { id: 1 };
    component.onCardClick(event);
    expect(emitSpy).toHaveBeenCalledWith({ data: { id: 1 }, event });
  });

  it('should emit simpleClick on onImageClick when enabledImageLink is true', () => {
    const emitSpy = vi.spyOn(component.simpleClick, 'emit');
    const event = { type: 'click' } as any;
    component.enabledImageLink = true;
    component.data = { id: 2 };
    component.onImageClick(event);
    expect(emitSpy).toHaveBeenCalledWith({ data: { id: 2 }, event });
  });

  it('should not emit simpleClick on onImageClick when enabledImageLink is false', () => {
    const emitSpy = vi.spyOn(component.simpleClick, 'emit');
    const event = { type: 'click' } as any;
    component.enabledImageLink = false;
    component.onImageClick(event);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit openInNewTab on onOpenInNewTab', () => {
    const emitSpy = vi.spyOn(component.openInNewTab, 'emit');
    const event = {
      type: 'click',
      stopImmediatePropagation: vi.fn(),
      preventDefault: vi.fn()
    } as any;
    component.data = { id: 3 };
    component.onOpenInNewTab(event);
    expect(event.stopImmediatePropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith({ data: { id: 3 }, event });
  });
});
