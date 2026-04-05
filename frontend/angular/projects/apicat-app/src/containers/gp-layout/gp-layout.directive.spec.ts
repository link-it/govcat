import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SidebarMinimizeDirective,
  MobileSidebarToggleDirective,
  SidebarOffCanvasCloseDirective,
  BrandMinimizeDirective,
  HtmlAttributesDirective,
  FlyOutDirective,
} from './gp-layout.directive';

describe('SidebarMinimizeDirective', () => {
  let directive: SidebarMinimizeDirective;
  const mockDocument = {
    body: {
      classList: { contains: vi.fn().mockReturnValue(false) },
    },
  };
  const mockRenderer = { addClass: vi.fn(), removeClass: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument.body.classList.contains.mockReturnValue(false);
    directive = new SidebarMinimizeDirective(mockDocument, mockRenderer);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should add sidebar-minimized when not present', () => {
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-minimized');
  });

  it('should remove sidebar-minimized when present', () => {
    mockDocument.body.classList.contains.mockReturnValue(true);
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-minimized');
  });
});

describe('MobileSidebarToggleDirective', () => {
  let directive: MobileSidebarToggleDirective;
  const mockDocument = {
    body: {
      classList: { contains: vi.fn().mockReturnValue(false) },
    },
  };
  const mockRenderer = { addClass: vi.fn(), removeClass: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument.body.classList.contains.mockReturnValue(false);
    directive = new MobileSidebarToggleDirective(mockDocument, mockRenderer);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should add sidebar-show when not present', () => {
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
  });

  it('should remove sidebar-show when present', () => {
    mockDocument.body.classList.contains.mockReturnValue(true);
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
  });
});

describe('SidebarOffCanvasCloseDirective', () => {
  let directive: SidebarOffCanvasCloseDirective;
  const mockDocument = {
    body: {
      classList: { contains: vi.fn().mockReturnValue(false) },
    },
  };
  const mockRenderer = { addClass: vi.fn(), removeClass: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    directive = new SidebarOffCanvasCloseDirective(mockDocument, mockRenderer);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should do nothing when sidebar-off-canvas is not present', () => {
    mockDocument.body.classList.contains.mockReturnValue(false);
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.addClass).not.toHaveBeenCalled();
    expect(mockRenderer.removeClass).not.toHaveBeenCalled();
  });

  it('should add sidebar-show when off-canvas and sidebar-show not present', () => {
    mockDocument.body.classList.contains
      .mockReturnValueOnce(true)   // sidebar-off-canvas
      .mockReturnValueOnce(false); // sidebar-show
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
  });

  it('should remove sidebar-show when off-canvas and sidebar-show present', () => {
    mockDocument.body.classList.contains.mockReturnValue(true);
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
  });
});

describe('BrandMinimizeDirective', () => {
  let directive: BrandMinimizeDirective;
  const mockDocument = {
    body: {
      classList: { contains: vi.fn().mockReturnValue(false) },
    },
  };
  const mockRenderer = { addClass: vi.fn(), removeClass: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument.body.classList.contains.mockReturnValue(false);
    directive = new BrandMinimizeDirective(mockDocument, mockRenderer);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should add brand-minimized when not present', () => {
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'brand-minimized');
  });

  it('should remove brand-minimized when present', () => {
    mockDocument.body.classList.contains.mockReturnValue(true);
    const event = { preventDefault: vi.fn() };
    directive.toggleOpen(event);
    expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'brand-minimized');
  });
});

describe('HtmlAttributesDirective', () => {
  let directive: HtmlAttributesDirective;
  const mockElement = { nativeElement: {} };
  const mockRenderer = {
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    addClass: vi.fn(),
    setStyle: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    directive = new HtmlAttributesDirective(mockRenderer, mockElement as any);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should set attributes on ngOnInit', () => {
    directive.appHtmlAttr = { 'data-id': '123', 'aria-label': 'test' };
    directive.ngOnInit();
    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(mockElement.nativeElement, 'data-id', '123');
    expect(mockRenderer.setAttribute).toHaveBeenCalledWith(mockElement.nativeElement, 'aria-label', 'test');
  });

  it('should add classes when attr is class', () => {
    directive.appHtmlAttr = { class: 'foo bar' };
    directive.ngOnInit();
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockElement.nativeElement, 'foo');
    expect(mockRenderer.addClass).toHaveBeenCalledWith(mockElement.nativeElement, 'bar');
  });

  it('should set styles when attr is style object', () => {
    directive.appHtmlAttr = { style: { color: 'red', fontSize: '12px' } } as any;
    directive.ngOnInit();
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(mockElement.nativeElement, 'color', 'red');
    expect(mockRenderer.setStyle).toHaveBeenCalledWith(mockElement.nativeElement, 'fontSize', '12px');
  });

  it('should remove attribute when value is null', () => {
    directive.appHtmlAttr = { 'data-id': null as any };
    directive.ngOnInit();
    expect(mockRenderer.removeAttribute).toHaveBeenCalledWith(mockElement.nativeElement, 'data-id');
  });
});

describe('FlyOutDirective', () => {
  let directive: FlyOutDirective;
  const mockElement = {
    nativeElement: {
      querySelector: vi.fn().mockReturnValue(null),
      classList: { contains: vi.fn().mockReturnValue(false) },
      clientWidth: 200,
      offsetTop: 50,
    },
  };
  const mockRenderer = {
    addClass: vi.fn(),
    removeClass: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockElement.nativeElement.querySelector.mockReturnValue(null);
    directive = new FlyOutDirective(mockRenderer, mockElement as any);
  });

  it('should be created', () => {
    expect(directive).toBeTruthy();
  });

  it('should return empty class by default', () => {
    expect(directive.elementClass).toBe('');
  });

  it('should set element class via set method', () => {
    directive.set('foo bar');
    expect(directive.elementClass).toBe('foo bar');
  });

  it('ngAfterViewInit should query for a and ul elements', () => {
    directive.ngAfterViewInit();
    expect(mockElement.nativeElement.querySelector).toHaveBeenCalledWith('a');
    expect(mockElement.nativeElement.querySelector).toHaveBeenCalledWith('ul');
  });

  it('onMouseLeave should clear element classes', () => {
    directive.set('is-over is-showing-fly-out');
    directive.onMouseLeave();
    expect(directive.elementClass).toBe('');
  });
});
