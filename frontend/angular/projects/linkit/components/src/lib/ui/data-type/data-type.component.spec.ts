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
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DataTypeComponent } from "./data-type.component";
import { UtilsLib } from "../../utils/utils.lib";
import { ComponentsModule } from '../../components.module';
import { TranslateModule } from "@ngx-translate/core";

describe('DataTypeComponent', () => {
    let component: DataTypeComponent;
    let fixture: ComponentFixture<DataTypeComponent>;
    let utilsLib: UtilsLib;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ComponentsModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataTypeComponent);
        component = fixture.componentInstance;
        utilsLib = TestBed.inject(UtilsLib);
        component._elem = { field: 'test', type: 'date', format: 'YYYY-MM-DD' };
        component._data = { test: '2020-01-01' };
        component._config = { options: {} };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should format date', () => {
        spyOn(utilsLib, 'dateFormatter').and.returnValue('2020-01-01');
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should format timeago', () => {
        component._elem.type = 'timeago';
        component.ngOnInit();
        expect(component._value).toEqual('4 years ago');
    });

    it('should format mstime', () => {
        component._elem.type = 'mstime';
        spyOn(utilsLib, 'msToTime').and.returnValue('1:00');
        component.ngOnInit();
        expect(component._value).toEqual('1:00');
    });

    it('should format status', () => {
        component._elem.type = 'status';
        component._elem.options = 'test';
        component._config.options = { test: { values: { '1': 'test' } } };
        component._data = { test: 'test' };
        component.ngOnInit();
        expect(component._value).toEqual('test');
        component._value = '1';
        component._elem.type = 'status';
        component._elem.options = 'test';
        component._config.options = { test: { values: { '1': { label: 'test' } } } };
        component._data = { test: '1' };
        component.ngOnInit();
        expect(component._value).toEqual('test');
    });

    it('should format label', () => {
        component._elem.type = 'label';
        component._elem.options = 'test';
        component._config.options = { test: { values: { '1': 'test' } } };
        component._data = { test: 'test' };
        component.ngOnInit();
        expect(component._value).toEqual('test');
        component._value = '1';
        component._elem.type = 'label';
        component._elem.options = 'test';
        component._config.options = { test: { values: { '1': { label: 'test' } } } };
        component._data = { test: '1' };
        component.ngOnInit();
        expect(component._value).toEqual('test');
    });

    it('should format tag', () => {
        component._elem.type = 'tag';
        component._elem.options = 'test'; // add this line
        component._config.options = { test: { values: { '1': { label: 'test' } } } }; // add this line
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should format text', () => {
        component._elem.type = 'text';
        component._elem.truncate = 10;
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should format icon', () => {
        component._elem.type = 'icon';
        component._elem.options = 'test';
        component._config.options = { test: { values: { '1': { icon: 'test' } } } };
        component._data = { test: '1' };
        component.ngOnInit();
        expect(component._value).toEqual('test');
    });

    it('should format JSON', () => {
        component._elem.type = 'json';
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should format tags', () => {
        component._elem.type = 'tags';
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should decode', () => {
        component._elem.decode = true;
        spyOn(window, 'atob').and.returnValue('test');
        component.ngOnInit();
        expect(component._value).toEqual('test');
    });

    it('should truncate rows', () => {
        expect(component.truncateRows('test', 1, 1)).toEqual('t...');
        expect(component.truncateRows('test\n', 1, 1)).toEqual('t...');
    });

    it('should prettyjson pipe', () => {
        const testObject = { key: 'value' };
        const expectedOutput = '{<br/>&nbsp; "key": "value"\n}';
        expect(component.prettyjsonPipe(testObject)).toEqual(expectedOutput);
    });

    it('should handle avatar error', () => {
        const event = {
            target: {
                src: 'initial/path'
            }
        };
        const expectedOutput = './assets/images/avatar.png';
        component.onAvatarError(event);
        expect(event.target.src).toEqual(expectedOutput);
    });
});