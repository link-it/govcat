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
import { ThousandSuffixesPipe } from './thousand-suff.pipe';

describe('ThousandSuffixesPipe', () => {
  let pipe: ThousandSuffixesPipe;

  beforeEach(() => {
    pipe = new ThousandSuffixesPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null if input is NaN', () => {
    expect(pipe.transform('not a number')).toBeNull();
  });

  it('should return input if input is less than 1000', () => {
    expect(pipe.transform(500)).toEqual(500);
  });

  it('should return input with thousand suffix', () => {
    expect(pipe.transform(1500, 1)).toEqual('1.5k');
    expect(pipe.transform(1500000, 1)).toEqual('1.5M');
  });
});