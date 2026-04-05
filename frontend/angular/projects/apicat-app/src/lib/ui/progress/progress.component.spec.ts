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
import { ProgressComponent } from './progress.component';

describe('ProgressComponent', () => {
  let component: ProgressComponent;

  beforeEach(() => {
    component = new ProgressComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default progress 0', () => {
    expect(component.progress).toBe(0);
  });

  it('should accept custom progress value', () => {
    component.progress = 75;
    expect(component.progress).toBe(75);
  });

  it('should accept 100% progress', () => {
    component.progress = 100;
    expect(component.progress).toBe(100);
  });
});
