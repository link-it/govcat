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
import { FormControl } from '@angular/forms';

import { lte } from './validator';

describe('LTE', () => {
  const error = { lte: true };

  it('3 should be lte 5', () => {
    const control = new FormControl(3);
    expect(lte(5)(control)).toBeNull();
  });

  it('5 should be lte 5', () => {
    const control = new FormControl(5);
    expect(lte(5)(control)).toBeNull();
  });

  it('5 should not be lte 3', () => {
    const control = new FormControl(5);
    expect(lte(3)(control)).toEqual({ lte: { value: 3 } });
  });
});
