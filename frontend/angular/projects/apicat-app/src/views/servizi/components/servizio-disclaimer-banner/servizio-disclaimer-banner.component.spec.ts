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
import { describe, it, expect } from 'vitest';
import { ServizioDisclaimerBannerComponent } from './servizio-disclaimer-banner.component';

describe('ServizioDisclaimerBannerComponent', () => {
  it('should map the severity to variant and icon', () => {
    const c = new ServizioDisclaimerBannerComponent();
    c.disclaimer = { disclaimer: 'x' };
    expect(c._variant).toBe('');
    expect(c._icon).toBe('bi-info-circle');
    c.disclaimer = { disclaimer: 'x', severity: 'WARNING' };
    expect(c._variant).toBe('is-warn');
    expect(c._icon).toBe('bi-exclamation-triangle');
    c.disclaimer = { disclaimer: 'x', severity: 'ERROR' };
    expect(c._variant).toBe('is-err');
    expect(c._icon).toBe('bi-x-circle');
  });
});
