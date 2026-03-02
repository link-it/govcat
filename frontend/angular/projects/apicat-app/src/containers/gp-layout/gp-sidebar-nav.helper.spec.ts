import { describe, it, expect, beforeEach } from 'vitest';
import { GpSidebarNavHelper } from './gp-sidebar-nav.helper';
import { INavData } from './gp-sidebar-nav';

describe('GpSidebarNavHelper', () => {
  let helper: GpSidebarNavHelper;

  beforeEach(() => {
    helper = new GpSidebarNavHelper();
  });

  it('should be created', () => {
    expect(helper).toBeTruthy();
  });

  describe('itemType', () => {
    it('should return divider for divider items', () => {
      expect(helper.itemType({ divider: true })).toBe('divider');
    });

    it('should return title for title items', () => {
      expect(helper.itemType({ title: true, label: 'Menu' })).toBe('title');
    });

    it('should return dropdown for items with children', () => {
      expect(helper.itemType({ children: [{ label: 'child' }] })).toBe('dropdown');
    });

    it('should return label for items with only label', () => {
      expect(helper.itemType({ label: 'Test' })).toBe('label');
    });

    it('should return empty for empty items', () => {
      expect(helper.itemType({} as INavData)).toBe('empty');
    });

    it('should return link for other items', () => {
      expect(helper.itemType({ url: '/test' } as any)).toBe('link');
    });
  });

  describe('boolean helpers', () => {
    it('isTitle should return true for title items', () => {
      expect(helper.isTitle({ title: true })).toBe(true);
      expect(helper.isTitle({ title: false })).toBe(false);
    });

    it('isDivider should return true for divider items', () => {
      expect(helper.isDivider({ divider: true })).toBe(true);
      expect(helper.isDivider({ divider: false })).toBe(false);
    });

    it('isMenu should return true for regular menu items', () => {
      expect(helper.isMenu({ label: 'Test', url: '/test' })).toBe(true);
      expect(helper.isMenu({ divider: true })).toBe(false);
      expect(helper.isMenu({ children: [{ label: 'c' }] })).toBe(false);
    });

    it('hasIcon should return true for items with icon', () => {
      expect(helper.hasIcon({ icon: 'home' })).toBe(true);
      expect(helper.hasIcon({})).toBe(false);
    });

    it('hasIconBs should return true for items with iconBs', () => {
      expect(helper.hasIconBs({ iconBs: 'gear' })).toBe(true);
      expect(helper.hasIconBs({})).toBe(false);
    });

    it('hasChildren should return true for items with non-empty children', () => {
      expect(helper.hasChildren({ children: [{ label: 'c' }] })).toBe(true);
      expect(helper.hasChildren({ children: [] })).toBe(false);
      expect(helper.hasChildren({})).toBe(false);
    });
  });
});
