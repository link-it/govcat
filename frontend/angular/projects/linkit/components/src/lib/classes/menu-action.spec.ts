/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { MenuAction } from './menu-action';

describe('MenuAction', () => {
  it('should create an instance with default values', () => {
    const action = new MenuAction();
    expect(action).toBeTruthy();
    expect(action.title).toBe('');
    expect(action.subTitle).toBe('');
    expect(action.action).toBe('');
    expect(action.url).toBe('');
    expect(action.type).toBe('');
    expect(action.image).toBe('');
    expect(action.icon).toBe('');
    expect(action.micon).toBe('');
    expect(action.iconUrl).toBe('');
    expect(action.bgColor).toBe('');
    expect(action.color).toBe('');
    expect(action.enabled).toBe(true);
    expect(action.checked).toBe(false);
  });

  it('should create an instance with provided values', () => {
    const action = new MenuAction({ title: 'Title', subTitle: 'SubTitle', action: 'Action', url: 'URL', type: 'Type', image: 'Image', icon: 'Icon', micon: 'MIcon', iconUrl: 'IconURL', bgColor: 'BGColor', color: 'Color', enabled: false, checked: true });
    expect(action).toBeTruthy();
    expect(action.title).toBe('Title');
    expect(action.subTitle).toBe('SubTitle');
    expect(action.action).toBe('Action');
    expect(action.url).toBe('URL');
    expect(action.type).toBe('Type');
    expect(action.image).toBe('Image');
    expect(action.icon).toBe('Icon');
    expect(action.micon).toBe('MIcon');
    expect(action.iconUrl).toBe('IconURL');
    expect(action.bgColor).toBe('BGColor');
    expect(action.color).toBe('Color');
    expect(action.enabled).toBe(false);
    expect(action.checked).toBe(true);
  });

  it('should ignore extra properties', () => {
    const action = new MenuAction({ title: 'Title', extra: 'extra' });
    expect((action as any).extra).toBeUndefined();
  });

  it('should handle null and undefined values', () => {
    const action = new MenuAction({ title: null, subTitle: undefined });
    expect(action.title).toBe('');
    expect(action.subTitle).toBe('');
  });
});