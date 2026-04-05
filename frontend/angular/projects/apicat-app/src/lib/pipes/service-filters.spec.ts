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
import { PropertyFilterPipe } from "./service-filters";

describe('PropertyFilterPipe', () => {
  let pipe: PropertyFilterPipe;

  beforeEach(() => {
    pipe = new PropertyFilterPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return items if no property or value is provided', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    expect(pipe.transform(items, '', '')).toEqual(items);
  });

  it('should filter items based on property and value', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    const expectedItems = [{ name: 'John' }];
    expect(pipe.transform(items, 'name', 'John')).toEqual(expectedItems);
  });

  it('should be case insensitive', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    const expectedItems = [{ name: 'John' }];
    expect(pipe.transform(items, 'name', 'JOHN')).toEqual(expectedItems);
  });
});