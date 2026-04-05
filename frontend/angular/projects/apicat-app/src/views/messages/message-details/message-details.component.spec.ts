import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { MessageDetailsComponent } from './message-details.component';

describe('MessageDetailsComponent', () => {
  let component: MessageDetailsComponent;
  const mockRoute = { params: of({ id: '1' }) } as any;
  const mockRouter = { navigate: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = { on: vi.fn() } as any;
  const mockApiService = {
    getDetails: vi.fn().mockReturnValue(of({})),
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({ AppConfig: {} });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockApiService.getDetails.mockReturnValue(of({}));
    mockTranslate.instant.mockImplementation((k: string) => k);
    component = new MessageDetailsComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockEventsManager, mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(MessageDetailsComponent.Name).toBe('MessageDetailsComponent');
  });

  it('should have model set to messages', () => {
    expect(component.model).toBe('messages');
  });

  it('should have default values', () => {
    expect(component._spin).toBe(true);
    expect(component._isDetails).toBe(true);
    expect(component._useRoute).toBe(true);
    expect(component._title).toBe('');
  });

  it('should have null id by default', () => {
    expect(component.id).toBeNull();
  });

  it('should have null message by default', () => {
    expect(component.message).toBeNull();
  });

  it('should have null config by default', () => {
    expect(component.config).toBeNull();
  });

  it('should have close and save outputs', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  it('should call getConfiguration in constructor', () => {
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should init breadcrumb with correct entries', () => {
    component.id = 42;
    component._initBreadcrumb();
    expect(component.breadcrumbs.length).toBe(3);
    expect(component.breadcrumbs[1].label).toBe('APP.TITLE.Messages');
    expect(component.breadcrumbs[1].url).toBe('/messages');
    expect(component.breadcrumbs[2].label).toBe('42');
  });

  it('should use translated New when id is null', () => {
    component.id = null;
    component._initBreadcrumb();
    expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    expect(mockTranslate.instant).toHaveBeenCalledWith('APP.TITLE.New');
  });

  it('should navigate on onBreadcrumb when useRoute', () => {
    component._useRoute = true;
    component.onBreadcrumb({ url: '/messages' });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/messages']);
  });

  it('should have empty breadcrumbs initially', () => {
    expect(component.breadcrumbs).toEqual([]);
  });

  it('should have empty informazioni array', () => {
    expect(component._informazioni).toEqual([]);
  });
});
