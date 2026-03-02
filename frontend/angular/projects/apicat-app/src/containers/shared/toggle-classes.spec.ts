import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClassToggler, ToggleClasses } from './toggle-classes';

describe('ClassToggler', () => {
  let toggler: ClassToggler;
  let mockDocument: any;
  let mockRenderer: any;

  beforeEach(() => {
    mockDocument = {
      body: {
        classList: {
          contains: vi.fn().mockReturnValue(false),
          add: vi.fn(),
          remove: vi.fn()
        }
      }
    };

    mockRenderer = {
      addClass: vi.fn(),
      removeClass: vi.fn()
    };

    toggler = new ClassToggler(mockDocument, mockRenderer);
  });

  describe('removeClasses', () => {
    it('should return true if any class exists on the body', () => {
      mockDocument.body.classList.contains.mockImplementation((cls: string) => cls === 'sidebar-lg-show');
      const result = toggler.removeClasses(['sidebar-show', 'sidebar-lg-show']);
      expect(result).toBe(true);
    });

    it('should return false if no classes exist on the body', () => {
      mockDocument.body.classList.contains.mockReturnValue(false);
      const result = toggler.removeClasses(['sidebar-show', 'sidebar-lg-show']);
      expect(result).toBe(false);
    });

    it('should check each class name', () => {
      mockDocument.body.classList.contains.mockReturnValue(false);
      toggler.removeClasses(['a', 'b', 'c']);
      expect(mockDocument.body.classList.contains).toHaveBeenCalledTimes(3);
      expect(mockDocument.body.classList.contains).toHaveBeenCalledWith('a');
      expect(mockDocument.body.classList.contains).toHaveBeenCalledWith('b');
      expect(mockDocument.body.classList.contains).toHaveBeenCalledWith('c');
    });

    it('should return false for empty array', () => {
      const result = toggler.removeClasses([]);
      expect(result).toBe(false);
    });
  });

  describe('toggleClasses', () => {
    it('should add the toggle class when none of the classes exist', () => {
      mockDocument.body.classList.contains.mockReturnValue(false);
      toggler.toggleClasses('sidebar-lg-show', ['sidebar-show', 'sidebar-lg-show']);
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-lg-show');
    });

    it('should remove classes when some already exist', () => {
      mockDocument.body.classList.contains.mockReturnValue(true);
      toggler.toggleClasses('sidebar-lg-show', ['sidebar-show', 'sidebar-lg-show']);
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-lg-show');
    });

    it('should only include classes up to and including the toggle level', () => {
      mockDocument.body.classList.contains.mockReturnValue(true);
      toggler.toggleClasses('sidebar-show', ['sidebar-show', 'sidebar-lg-show', 'sidebar-xl-show']);
      // Level of 'sidebar-show' is 0, so NewClassNames = ['sidebar-show']
      expect(mockRenderer.removeClass).toHaveBeenCalledTimes(1);
      expect(mockRenderer.removeClass).toHaveBeenCalledWith(mockDocument.body, 'sidebar-show');
    });

    it('should handle toggle not found in classnames (Level = -1)', () => {
      // When Toggle is not in ClassNames, Level = -1, slice(0,0) = []
      mockDocument.body.classList.contains.mockReturnValue(false);
      toggler.toggleClasses('nonexistent', ['sidebar-show', 'sidebar-lg-show']);
      // Empty NewClassNames -> removeClasses([]) returns false -> addClass called
      expect(mockRenderer.addClass).toHaveBeenCalledWith(mockDocument.body, 'nonexistent');
    });
  });
});

describe('ToggleClasses (standalone function)', () => {
  let originalContains: any;
  let originalAdd: any;
  let originalRemove: any;

  beforeEach(() => {
    originalContains = document.body.classList.contains;
    originalAdd = document.body.classList.add;
    originalRemove = document.body.classList.remove;

    document.body.classList.contains = vi.fn().mockReturnValue(false);
    document.body.classList.add = vi.fn();
    document.body.classList.remove = vi.fn();
  });

  afterEach(() => {
    document.body.classList.contains = originalContains;
    document.body.classList.add = originalAdd;
    document.body.classList.remove = originalRemove;
  });

  it('should add the class when none exist', () => {
    (document.body.classList.contains as any).mockReturnValue(false);
    ToggleClasses('sidebar-show', ['sidebar-show', 'sidebar-lg-show']);
    expect(document.body.classList.add).toHaveBeenCalledWith('sidebar-show');
  });

  it('should remove classes when they exist', () => {
    (document.body.classList.contains as any).mockReturnValue(true);
    ToggleClasses('sidebar-lg-show', ['sidebar-show', 'sidebar-lg-show']);
    expect(document.body.classList.remove).toHaveBeenCalledWith('sidebar-show');
    expect(document.body.classList.remove).toHaveBeenCalledWith('sidebar-lg-show');
  });
});
