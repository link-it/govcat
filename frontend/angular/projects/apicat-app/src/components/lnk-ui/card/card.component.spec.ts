import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LnkCardComponent } from './card.component';

describe('LnkCardComponent', () => {
  let component: LnkCardComponent;
  const mockConfigService = {
    getAppConfig: vi.fn().mockReturnValue({ Layout: { enableOpenInNewTab: true } }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new LnkCardComponent(mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component._image).toBe('');
    expect(component._showImage).toBe(true);
    expect(component._showEmptyImage).toBe(true);
    expect(component._primaryText).toBe('');
    expect(component._collapsed).toBe(true);
    expect(component._editMode).toBe(false);
    expect(component._backColor).toBe('#f1f1f1');
    expect(component._textColor).toBe('#000000');
    expect(component._numberCharLogoText).toBe(2);
    expect(component.cardBs).toBe(false);
    expect(component.isAnonymous).toBe(false);
    expect(component.showGroupIcon).toBe(false);
    expect(component.showGroupLabel).toBe(false);
  });

  it('should set logoText from primaryText on init', () => {
    component._primaryText = 'TestService';
    component.ngOnInit();
    expect(component._logoText).toBe('Te');
  });

  it('should respect numberCharLogoText', () => {
    component._primaryText = 'Hello';
    component._numberCharLogoText = 3;
    component.ngOnInit();
    expect(component._logoText).toBe('Hel');
  });

  it('should reset backColor when image is set', () => {
    component._image = 'http://img.png';
    component._backColor = '#ff0000';
    component.ngOnInit();
    expect(component._backColor).toBe('#f1f1f1');
  });

  it('should set textColor to #111111 on init', () => {
    component.ngOnInit();
    expect(component._textColor).toBe('#111111');
  });

  it('should read enableOpenInNewTab from appConfig', () => {
    component.ngOnInit();
    expect(component.enableOpenInNewTab).toBe(true);
  });

  it('should default enableOpenInNewTab to false when config missing', () => {
    mockConfigService.getAppConfig.mockReturnValue({});
    component.ngOnInit();
    expect(component.enableOpenInNewTab).toBe(false);
  });

  it('should emit simpleClick on __cardClick when not editMode and showGroupLabel', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._editMode = false;
    component.showGroupLabel = true;
    component.data = { id: 1 };
    const event = { button: 0 } as MouseEvent;
    component.__cardClick(event);
    expect(spy).toHaveBeenCalledWith({ data: { id: 1 }, event });
  });

  it('should not emit simpleClick on __cardClick when editMode', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._editMode = true;
    component.showGroupLabel = true;
    component.__cardClick({} as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit simpleClick on __cardClick when showGroupLabel is false', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._editMode = false;
    component.showGroupLabel = false;
    component.__cardClick({} as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit simpleClick on __simpleClick when not editMode', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._editMode = false;
    component.data = { id: 2 };
    const event = {} as MouseEvent;
    component.__simpleClick(event);
    expect(spy).toHaveBeenCalledWith({ data: { id: 2 }, event });
  });

  it('should not emit simpleClick on __simpleClick when editMode', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._editMode = true;
    component.__simpleClick({} as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit simpleClick on __imageClick when enabledImageLink and not editMode', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._enabledImageLink = true;
    component._editMode = false;
    component.data = { id: 3 };
    const event = {} as MouseEvent;
    component.__imageClick(event);
    expect(spy).toHaveBeenCalledWith({ data: { id: 3 }, event });
  });

  it('should not emit on __imageClick when enabledImageLink is false', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._enabledImageLink = false;
    component.__imageClick({} as MouseEvent);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit simpleClick on __cardBodyClick when no image, no text, no emptyImage', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._image = '';
    component._secondaryText = '';
    component._showEmptyImage = false;
    component._editMode = false;
    const event = { type: 'click' };
    component.__cardBodyClick(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should not emit on __cardBodyClick when image exists', () => {
    const spy = vi.spyOn(component.simpleClick, 'emit');
    component._image = 'img.png';
    component._editMode = false;
    component.__cardBodyClick({});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit openInNewTab and stop propagation on __openInNewTab', () => {
    const spy = vi.spyOn(component.openInNewTab, 'emit');
    component.data = { id: 4 };
    const event = {
      stopImmediatePropagation: vi.fn(),
      preventDefault: vi.fn(),
    } as any;
    component.__openInNewTab(event);
    expect(event.stopImmediatePropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ data: { id: 4 }, event });
  });
});
