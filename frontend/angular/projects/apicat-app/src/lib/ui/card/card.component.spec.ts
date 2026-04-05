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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardComponent, CardType } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  const mockUtilsLib = { contrast: vi.fn().mockReturnValue('#000000') } as any;

  beforeEach(() => {
    component = new CardComponent(mockUtilsLib);
    component._primaryText = 'Primary text';
    component._numberCharLogoText = 2;
    component._image = 'image.jpg';
    component.ngOnInit();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call __simpleClick if _type is CardType.Simple', () => {
    const event = {} as any;
    component._type = CardType.Simple;
    vi.spyOn(component, '__simpleClick');
    component.onClick(event);
    expect(component.__simpleClick).toHaveBeenCalledWith(event);
  });

  it('should set _logoText from primaryText', () => {
    expect(component._logoText).toBe('Pr');
  });

  it('should set _backColor to #f1f1f1 when image is present', () => {
    expect(component._backColor).toBe('#f1f1f1');
  });

  it('should set _textColor via utilsLib.contrast', () => {
    expect(component._textColor).toBe('#000000');
  });

  it('should emit simpleClick event when not in editMode', () => {
    const spy = vi.fn();
    component.simpleClick.subscribe(spy);
    const event = new MouseEvent('click');
    component.__simpleClick(event);
    expect(spy).toHaveBeenCalledWith({ data: null, event });
  });

  it('should emit editSelection event', () => {
    const spy = vi.fn();
    component.editSelection.subscribe(spy);
    component.__change({ checked: true });
    expect(spy).toHaveBeenCalledWith({ selected: true });
  });

  it('should not emit simpleClick when in editMode', () => {
    const spy = vi.fn();
    component.simpleClick.subscribe(spy);
    component._editMode = true;
    component.__simpleClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });
});
