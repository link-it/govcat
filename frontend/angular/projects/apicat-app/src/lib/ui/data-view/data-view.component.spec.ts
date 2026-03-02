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
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DataViewComponent } from "./data-view.component";
import { COMPONENTS_IMPORTS } from '@linkit/components';
import { TranslateModule } from "@ngx-translate/core";

describe('DataViewComponent', () => {
    let component: DataViewComponent;
    let fixture: ComponentFixture<DataViewComponent>;
    let details = [{
        foo: 'bar'
    }];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ...COMPONENTS_IMPORTS],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DataViewComponent);
        component = fixture.componentInstance;
        component._config = { details: details };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit on download click', () => {
        vi.spyOn(component.downloadClick, 'emit');
        component.__downloadClick('test');
        expect(component.downloadClick.emit).toHaveBeenCalled();
    });

    it('should show empty', () => {
        component._data = { test: null };
        const field = { field: 'test', hideEmpty: true };
        const result = component._showEmpty(field);
        expect(result).toBe(false);
    });

    it('should toggle accordion', () => {
        component._accordionOpen = false;
        component.onShowHideAccordion();
        expect(component._accordionOpen).toBe(true);
    });

    it('should get background', () => {
        const boxOptions = { background: '#fff' };
        const result = component._getBackground(boxOptions);
        expect(result).toEqual('#fff');

        const boxOptions2 = { background: { field: 'test', options: 'test' } };

        component._config = {
            options: {
                test: {
                    values: {
                        test: {
                            background: '#fff',
                            color: '#000'
                        }
                    }
                }
            }
        };
        component._data = { source: { test: 'test' } };
        const result2 = component._getBackground(boxOptions2);
        expect(result2).toEqual('#fff');
    });

    it('should get color', () => {
        const boxOptions = { color: '#fff' };
        const result = component._getColor(boxOptions);
        expect(result).toEqual('#fff');

        const boxOptions2 = { background: { field: 'test', options: 'test' } };

        component._config = {
            options: {
                test: {
                    values: {
                        test: {
                            background: '#fff',
                            color: '#000'
                        }
                    }
                }
            }
        };

        component._data = { source: { test: 'test' } };
        const result2 = component._getColor(boxOptions2);
        expect(result2).toEqual('#000');
    });
});