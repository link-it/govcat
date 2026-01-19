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

import { creditCard } from './validator';

describe('CreditCard', () => {
  const error = {creditCard: true};

  it('"378282246310005" should be creditCard', () => {
    const control = new FormControl('378282246310005');
    expect(creditCard(control)).toBeNull();
  });

  it('"37828224631000" should not be creditCard', () => {
    const control = new FormControl('37828224631000');
    expect(creditCard(control)).toEqual(error);
  });

  it('"3782822463100056" should not be creditCard', () => {
    const control = new FormControl('3782822463100056');
    expect(creditCard(control)).toEqual(error);
  });
});
