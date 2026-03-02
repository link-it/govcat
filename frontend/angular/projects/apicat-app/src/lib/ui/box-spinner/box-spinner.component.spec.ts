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
import { Subscription } from 'rxjs';
import { BoxSpinnerComponent } from './box-spinner.component';
import { Tools } from '../../services';

describe('BoxSpinnerComponent', () => {
  let component: BoxSpinnerComponent;

  beforeEach(() => {
    component = new BoxSpinnerComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default color "accent"', () => {
    expect(component.color).toBe('accent');
  });

  it('should have default diameter 36', () => {
    expect(component.diameter).toBe(36);
  });

  it('should have default strokeWidth 4', () => {
    expect(component.strokeWidth).toBe(4);
  });

  it('should unsubscribe from all emergency calls and wait for response', () => {
    const subscription1 = new Subscription();
    const subscription2 = new Subscription();
    vi.spyOn(subscription1, 'unsubscribe');
    vi.spyOn(subscription2, 'unsubscribe');
    Tools.EmergencyCall = [subscription1, subscription2];
    vi.spyOn(Tools, 'WaitForResponse');

    component._rescueCall();

    expect(subscription1.unsubscribe).toHaveBeenCalled();
    expect(subscription2.unsubscribe).toHaveBeenCalled();
    expect(Tools.EmergencyCall).toEqual([]);
    expect(Tools.WaitForResponse).toHaveBeenCalledWith(false, true);
  });
});
