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
import { describe, it, expect, beforeEach } from 'vitest';
import { BoxMessageComponent } from './box-message.component';

describe('BoxMessageComponent', () => {
  let component: BoxMessageComponent;

  beforeEach(() => {
    component = new BoxMessageComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default icon "warning"', () => {
    expect(component.icon).toBe('warning');
  });

  it('should have default message', () => {
    expect(component.message).toBe('Nessun elemento');
  });

  it('should have empty subMessage', () => {
    expect(component.subMessage).toBe('');
  });

  it('should have default size 24px', () => {
    expect(component.sizePx).toBe('24px');
  });

  it('should set sizePx when size is set', () => {
    component.size = 10;
    expect(component.sizePx).toBe('10px');
  });

  it('should accept custom inputs', () => {
    component.icon = 'info';
    component.image = 'test.png';
    component.message = 'Custom';
    component.subMessage = 'Sub';
    expect(component.icon).toBe('info');
    expect(component.image).toBe('test.png');
    expect(component.message).toBe('Custom');
    expect(component.subMessage).toBe('Sub');
  });
});
