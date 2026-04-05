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
import { DataTypeComponent } from "./data-type.component";
import { UtilsLib } from "../../utils/utils.lib";
import { COMPONENTS_IMPORTS } from '@linkit/components';
import { TranslateModule } from "@ngx-translate/core";
import moment from 'moment';

describe('DataTypeComponent', () => {
    let component: DataTypeComponent;
    let fixture: ComponentFixture<DataTypeComponent>;
    let utilsLib: UtilsLib;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ...COMPONENTS_IMPORTS]
        }).compileComponents();
    });

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
        vi.spyOn(utilsLib, 'dateFormatter').mockReturnValue('2020-01-01');
        component.ngOnInit();
        expect(component._value).toEqual('2020-01-01');
    });

    it('should format timeago', () => {
        component._elem.type = 'timeago';
        component.ngOnInit();
        const expected = moment('2020-01-01').fromNow();
        expect(component._value).toEqual(expected);
    });

    it('should format mstime', () => {
        component._elem.type = 'mstime';
        vi.spyOn(utilsLib, 'msToTime').mockReturnValue('1:00');
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
        vi.spyOn(window, 'atob').mockReturnValue('test');
        component.ngOnInit();
        expect(component._value).toEqual('test');
    });

    it('should truncate rows', () => {
        expect(component.truncateRows('test', 1, 1)).toEqual('t...');
        expect(component.truncateRows('test\n', 1, 1)).toEqual('t...');
    });

    it('should prettyjson pipe', () => {
        const testObject = '{ "key": "value" }';
        const expectedOutput = JSON.stringify(testObject, null, 2)
            .replace(' ', '&nbsp;')
            .replace('\n', '<br/>');
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