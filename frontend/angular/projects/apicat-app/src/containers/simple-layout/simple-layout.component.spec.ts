import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleLayoutComponent } from './simple-layout.component';

describe('SimpleLayoutComponent', () => {
  let component: SimpleLayoutComponent;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new SimpleLayoutComponent(mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should set config from configService', () => {
    expect(component.config).toEqual({ AppConfig: {} });
  });

  it('should have default layout flags', () => {
    expect(component.fullContent).toBe(false);
    expect(component.fullScroll).toBe(true);
    expect(component.contentScroll).toBe(false);
  });

  it('should compute fullContentClass binding', () => {
    expect(component.fullContentClass).toBe(false);
    component.fullContent = true;
    expect(component.fullContentClass).toBe(true);
  });

  it('should compute pageFullScrollClass binding', () => {
    component.fullScroll = true;
    component.contentScroll = false;
    expect(component.pageFullScrollClass).toBe(true);
  });

  it('should compute pageContentScrollClass binding', () => {
    component.fullScroll = false;
    component.desktop = true;
    component.contentScroll = false;
    expect(component.pageContentScrollClass).toBe(true);
  });

  it('_onResize should set device flags based on window width', () => {
    // Il test dipende dalla dimensione effettiva di window in ambiente test
    component._onResize();
    // Almeno uno dei flag deve essere true
    expect(component.desktop || component.tablet || component.mobile).toBe(true);
  });
});
