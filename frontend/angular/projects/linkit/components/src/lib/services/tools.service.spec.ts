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
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import moment from 'moment';

import { Tools } from './tools.service';
import { GridFormatters } from '../utils/grid-formatters';

describe('Tools', () => {
    let service: Tools;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot()],
        });
        service = TestBed.inject(Tools);
        document.documentElement.style.setProperty('--color', '');
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getSpinner should return the value of Spinner', () => {
        (Tools as any).Spinner = true;
        const spinner = service.getSpinner();
        expect(spinner).toBe(true);
    });

    it('isSpinnerGlobal should return the value of SpinnerGlobal', () => {
        (Tools as any).SpinnerGlobal = true;
        const spinnerGlobal = service.isSpinnerGlobal();
        expect(spinnerGlobal).toBe(true);
    });

    it('WaitForResponse should handle value true and Spinner false', () => {
        (Tools as any).Spinner = false;
        (Tools as any).SpinnerCount = 0;
        Tools.WaitForResponse(true);
        expect((Tools as any).Spinner).toBe(true);
        expect((Tools as any).SpinnerCount).toBe(1);
    });

    it('WaitForResponse should handle value false and Spinner true', () => {
        (Tools as any).Spinner = true;
        (Tools as any).SpinnerCount = 1;
        Tools.WaitForResponse(false);
        expect((Tools as any).Spinner).toBe(false);
        expect((Tools as any).SpinnerCount).toBe(0);
    });

    it('WaitForResponse should handle ecall true', () => {
        (Tools as any).Spinner = false;
        (Tools as any).SpinnerCount = 1;
        Tools.WaitForResponse(true, true);
        expect((Tools as any).Spinner).toBe(true);
        expect((Tools as any).SpinnerCount).toBe(0);
    });

    it('WaitForResponse should handle SpinnerCount less than 0', () => {
        (Tools as any).Spinner = false;
        (Tools as any).SpinnerCount = -1;
        Tools.WaitForResponse(true);
        expect((Tools as any).Spinner).toBe(true);
        expect((Tools as any).SpinnerCount).toBe(0);
    });

    it('WaitForResponse should handle EmergencyCall', () => {
        const subscription = new Subscription();
        spyOn(subscription, 'unsubscribe');
        (Tools as any).EmergencyCall = [subscription];
        (Tools as any).Spinner = true;
        (Tools as any).SpinnerCount = 1;
        Tools.WaitForResponse(false);
        expect(subscription.unsubscribe).toHaveBeenCalled();
        expect((Tools as any).EmergencyCall.length).toBe(0);
    });

    it('SetThemeColors should handle null colors', () => {
        Tools.SetThemeColors(null);
        // No way to assert as the function does not do anything in this case
    });

    it('SetThemeColors should handle empty Variables', () => {
        const colors = { Variables: {} };
        Tools.SetThemeColors(colors);
        // No way to assert as the function does not do anything in this case
    });

    it('SetThemeColors should handle valid color', () => {
        const colors = { Variables: { '--color': '#FFFFFF' } };
        Tools.SetThemeColors(colors);
        expect(document.documentElement.style.getPropertyValue('--color')).toBe('#FFFFFF');
    });

    it('SetThemeColors should handle invalid color', () => {
        const colors = { Variables: { '--color': 'invalid' } };
        Tools.SetThemeColors(colors);
        expect(document.documentElement.style.getPropertyValue('--color')).toBe('');
    });

    it('formatValue should handle type number', () => {
        spyOn(GridFormatters, 'numberFormatter').and.returnValue('formatted number');
        const result = Tools.formatValue(123, { type: 'number' });
        expect(result).toBe('formatted number');
    });

    it('formatValue should handle type date', () => {
        spyOn(GridFormatters, 'dateFormatter').and.returnValue('formatted date');
        const result = Tools.formatValue('2022-01-01', { type: 'date' });
        expect(result).toBe('formatted date');
    });

    it('formatValue should handle type currency', () => {
        spyOn(GridFormatters, 'currencyFormatter').and.returnValue('formatted currency');
        const result = Tools.formatValue(123, { type: 'currency' });
        expect(result).toBe('formatted currency');
    });

    it('formatValue should handle type progress with html true', () => {
        spyOn(GridFormatters, 'progressFormatter').and.returnValue('formatted progress');
        const result = Tools.formatValue(50, { type: 'progress' }, true);
        expect(result).toBe('formatted progress');
    });

    it('formatValue should handle type progress with html false', () => {
        const result = Tools.formatValue(50, { type: 'progress' }, false);
        expect(result).toBe(50 as any);
    });

    it('formatValue should handle type tag', () => {
        spyOn(GridFormatters, 'typeTagFormatter').and.returnValue('formatted tag');
        const result = Tools.formatValue('tag', { type: 'tag', options: 'options' });
        expect(result).toBe('formatted tag');
    });

    it('formatValue should handle default type', () => {
        const result = Tools.formatValue('value', { type: 'default' });
        expect(result).toBe('value');
    });

    it('simpleItemFormatter should handle type number', () => {
        spyOn(GridFormatters, 'numberFormatter').and.returnValue('formatted number');
        const result = Tools.simpleItemFormatter([{ type: 'number', field: 'num' }], { num: 123 });
        expect(result).toBe('formatted number');
    });

    it('simpleItemFormatter should handle type currency', () => {
        spyOn(GridFormatters, 'currencyFormatter').and.returnValue('formatted currency');
        const result = Tools.simpleItemFormatter([{ type: 'currency', field: 'cur' }], { cur: 123 });
        expect(result).toBe('formatted currency');
    });

    it('simpleItemFormatter should handle type date', () => {
        spyOn(GridFormatters, 'dateFormatter').and.returnValue('formatted date');
        const result = Tools.simpleItemFormatter([{ type: 'date', field: 'date' }], { date: '2022-01-01' });
        expect(result).toBe('formatted date');
    });

    it('simpleItemFormatter should handle type progress', () => {
        spyOn(GridFormatters, 'progressFormatter').and.returnValue('formatted progress');
        const result = Tools.simpleItemFormatter([{ type: 'progress', field: 'prog' }], { prog: 50 });
        expect(result).toBe('formatted progress');
    });

    it('simpleItemFormatter should handle type message', () => {
        const result = Tools.simpleItemFormatter([{ type: 'message', field: 'message' }], {});
        expect(result).toBe('message');
    });

    it('simpleItemFormatter should handle type currentDate', () => {
        const result = Tools.simpleItemFormatter([{ type: 'currentDate', format: 'YYYY-MM-DD', field: '' }], {});
        expect(result).toBe(moment().format('YYYY-MM-DD'));
    });

    it('simpleItemFormatter should handle type status', () => {
        spyOn(GridFormatters, 'statusFormatter').and.returnValue('formatted status');
        const result = Tools.simpleItemFormatter([{ type: 'status', field: 'status' }], { status: 'status' });
        expect(result).toBe('formatted status');
    });

    it('simpleItemFormatter should handle type label', () => {
        spyOn(GridFormatters, 'typeLabelFormatter').and.returnValue('formatted label');
        const result = Tools.simpleItemFormatter([{ type: 'label', field: 'label', options: 'options' }], { label: 'label' });
        expect(result).toBe('formatted label');
    });

    it('simpleItemFormatter should handle type cardinal', () => {
        const result = Tools.simpleItemFormatter([{ type: 'cardinal', field: 'card' }], { card: 123 });
        expect(result).toBe('#123');
    });

    it('simpleItemFormatter should handle default type', () => {
        const result = Tools.simpleItemFormatter([{ type: 'default', field: 'def' }], { def: 'value' });
        expect(result).toBe('value');
    });

    it('generateFields should handle type download', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue('download');
        const result = Tools.generateFields([{ type: 'download', field: 'download' }], { download: 'download' });
        expect(result[0].value).toBe('download');
        expect(result[0].download).toBe(true);
    });

    it('generateFields should handle value exists', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue('value');
        spyOn(Tools, 'formatValue').and.returnValue('formatted value');
        const result = Tools.generateFields([{ type: 'type', field: 'field', label: 'label' }], { field: 'value' });
        expect(result[0].value).toBe('formatted value');
    });

    it('generateFields should handle type number', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue(0);
        spyOn(Tools, 'formatValue').and.returnValue('formatted number');
        const result = Tools.generateFields([{ type: 'number', field: 'field', label: 'label' }], { field: 0 });
        expect(result[0].value).toBe('formatted number');
    });

    it('generateFields should handle empty true', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue(null);
        const result = Tools.generateFields([{ type: 'type', field: 'field', label: 'label' }], { field: null }, true);
        expect(result[0].value).toBe(true);
    });

    it('generateFields should handle empty string', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue(null);
        const result = Tools.generateFields([{ type: 'type', field: 'field', label: 'label' }], { field: null }, 'empty');
        expect(result[0].value).toBe('empty');
    });

    it('generateFields should handle empty false', () => {
        spyOn(Tools, 'getObjectValue').and.returnValue(null);
        const result = Tools.generateFields([{ type: 'type', field: 'field', label: 'label' }], { field: null }, false);
        expect(result.length).toBe(0);
    });

    it('getObjectValue should return object if path is not provided', () => {
        const obj = { key: 'value' };
        const result = Tools.getObjectValue(obj, '');
        expect(result).toEqual(obj);
    });

    it('getObjectValue should return value for single level path', () => {
        const obj = { key: 'value' };
        const result = Tools.getObjectValue(obj, 'key');
        expect(result).toBe('value');
    });

    it('getObjectValue should return value for multi level path', () => {
        const obj = { level1: { level2: { key: 'value' } } };
        const result = Tools.getObjectValue(obj, 'level1.level2.key');
        expect(result).toBe('value');
    });

    it('getObjectValue should return empty string if path does not exist', () => {
        const obj = { key: 'value' };
        const result = Tools.getObjectValue(obj, 'nonexistent');
        expect(result).toBe('');
    });

    it('FileExceedError should handle max provided', () => {
        spyOn(Tools, 'MaxUpload').and.returnValue(1000);
        spyOn(Tools, 'Alert');
        Tools.FileExceedError(500);
        expect(Tools.Alert).toHaveBeenCalledWith(`La dimensione massima consentita per l'upload di un file è di ${new Intl.NumberFormat('it-IT').format(500)} bytes`);
    });

    it('FileExceedError should handle max not provided', () => {
        spyOn(Tools, 'MaxUpload').and.returnValue(1000);
        spyOn(Tools, 'Alert');
        Tools.FileExceedError();
        expect(Tools.Alert).toHaveBeenCalledWith(`La dimensione massima consentita per l'upload di un file è di ${new Intl.NumberFormat('it-IT').format(1000)} bytes`);
    });

    it('FileExceedError should handle max and MaxUpload both zero', () => {
        spyOn(Tools, 'MaxUpload').and.returnValue(0);
        spyOn(Tools, 'Alert');
        Tools.FileExceedError(0);
        expect(Tools.Alert).toHaveBeenCalledWith(`La dimensione massima consentita per l'upload di un file è stata superata`);
    });

    it('should handle error with title and detail', () => {
        const error = { status: 500, error: { title: 'title', detail: 'detail' } };
        const result = Tools.GetErrorMsg(error);
        expect(result).toBe('title - detail');
    });

    it('should handle error with statusText and status not 0', () => {
        const error = { status: 404, statusText: 'Not Found', url: 'http://example.com' };
        const result = Tools.GetErrorMsg(error);
        expect(result).toBe('404: Not Found http://example.com');
    });

    it('should handle error with message and status 0', () => {
        const error = { status: 0, message: 'error message' };
        const result = Tools.GetErrorMsg(error);
        expect(result).toBe('error message');
    });

    it('should handle error with name and no error property', () => {
        const error = { name: 'name' };
        const result = Tools.GetErrorMsg(error);
        expect(result).toBe('APP.MESSAGE.ERROR.name');
    });

    it('should handle error that throws exception', () => {
        const error = { name: 'name' };
        Tools.translate = null;
        const result = Tools.GetErrorMsg(error);
        expect(result).toBe('Si è verificato un problema non previsto.');
    });

    it('should return number format for English language', () => {
        service.translate.currentLang = 'en';

        const result = service.getNumberFormatByLanguage();

        expect(result).toBe('en-US');
    });

    it('should return number format for Italian language', () => {
        service.translate.currentLang = 'it';

        const result = service.getNumberFormatByLanguage();

        expect(result).toBe('it-IT');
    });

    it('should return default number format for other languages', () => {
        service.translate.currentLang = 'es'; // Spanish

        const result = service.getNumberFormatByLanguage();

        expect(result).toBe('it-IT');
    });

    it('should format date for English language', () => {
        service.translate.currentLang = 'en';

        const result = service.dateFormat('2022-12-31', 'YYYY-MM-DD');

        expect(result).toBe('2022/12/31');
    });

    it('should format date with timestamp for English language', () => {
        service.translate.currentLang = 'en';

        const result = service.dateFormat('2022-12-31 23:59:59', 'YYYY-MM-DD HH:mm:ss', true);

        expect(result).toBe('2022/12/31, 23:59:59');
    });

    it('should format date for Italian language', () => {
        service.translate.currentLang = 'it';

        const result = service.dateFormat('2022-12-31', 'YYYY-MM-DD');

        expect(result).toBe('31-12-2022');
    });

    it('should format date with timestamp for Italian language', () => {
        service.translate.currentLang = 'it';

        const result = service.dateFormat('2022-12-31 23:59:59', 'YYYY-MM-DD HH:mm:ss', true);

        expect(result).toBe('31-12-2022, 23:59:59');
    });

    it('should format date for English language with default format', () => {
        service.translate.currentLang = 'en';

        const result = service.dateFormat('2022-12-31');

        expect(result).toBe('2022/12/31');
    });

    it('should format date with timestamp for English language with default format', () => {
        service.translate.currentLang = 'en';

        const result = service.dateFormat('2022-12-31', undefined, true);

        expect(result).toBe('2022/12/31, 00:00:00');
    });

    it('should format date for Italian language with default format', () => {
        service.translate.currentLang = 'it';

        const result = service.dateFormat('2022-12-31');

        expect(result).toBe('31-12-2022');
    });

    it('should format date with timestamp for Italian language with default format', () => {
        service.translate.currentLang = 'it';

        const result = service.dateFormat('2022-12-31', undefined, true);

        expect(result).toBe('31-12-2022, 00:00:00');
    });

    it('should format number to currency for English language', () => {
        service.translate.currentLang = 'en';

        const result = service.currencyFormat(1234.56);

        expect(result).toBe('€ 1,234.56');
    });

    it('should format number to currency for Italian language', () => {
        service.translate.currentLang = 'it';

        const result = service.currencyFormat(1234.56);

        expect(result).toBe('€ 1.234,56');
    });

    it('should return empty string for NaN', () => {
        const result = service.currencyFormat(NaN);

        expect(result).toBe('');
    });

    it('should return "n/a" for invalid number format', () => {
        spyOn(Intl, 'NumberFormat').and.throwError('Invalid number format');

        const result = service.currencyFormat(1234.56);

        expect(result).toBe('€ n/a');
    });

    it('should decode base64 string', () => {
        const encoded = btoa(encodeURIComponent('Hello, World!'));

        const result = Tools.DecodeB64(encoded);

        expect(result).toBe('Hello%2C%20World!');
    });

    it('should return empty string for invalid base64 string', () => {
        spyOn(console, 'log'); // to prevent console.log in the test output

        const result = Tools.DecodeB64('invalid');

        expect(result).toBe('');
    });

    it('should convert base64 string to Blob', () => {
        const b64Data = btoa('Hello, World!');
        const contentType = 'text/plain';

        const result = service.B64toBlob(b64Data, contentType);

        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBe(13);
        expect(result.type).toBe(contentType);
    });

    it('should convert base64 string to Blob with default content type', () => {
        const b64Data = btoa('Hello, World!');

        const result = service.B64toBlob(b64Data);

        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBe(13);
        expect(result.type).toBe('');
    });

    it('should convert base64 string to Blob with custom slice size', () => {
        const b64Data = btoa('Hello, World!');
        const contentType = 'text/plain';
        const sliceSize = 1;

        const result = service.B64toBlob(b64Data, contentType, sliceSize);

        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBe(13);
        expect(result.type).toBe(contentType);
    });

    it('should get filename from response header', () => {
        const response = {
            headers: new Map([
                ['content-disposition', 'attachment; filename="test.txt"']
            ])
        };

        const result = Tools.GetFilenameFromHeader(response);

        expect(result).toBe('test.txt');
    });

    it('should return empty string if response is null', () => {
        const result = Tools.GetFilenameFromHeader(null);

        expect(result).toBe('');
    });

    it('should return empty string if content-disposition header is not present', () => {
        const response = {
            headers: new Map()
        };

        const result = Tools.GetFilenameFromHeader(response);

        expect(result).toBe('');
    });

    it('should return empty string if filename is not present in content-disposition header', () => {
        const response = {
            headers: new Map([
                ['content-disposition', 'attachment']
            ])
        };

        const result = Tools.GetFilenameFromHeader(response);

        expect(result).toBe('');
    });

    it('should convert string to camel case', () => {
        const result = service.CamelCode('hello_world');

        expect(result).toBe('HelloWorld');
    });

    it('should handle string with multiple underscores', () => {
        const result = service.CamelCode('hello_world_example');

        expect(result).toBe('HelloWorldExample');
    });

    it('should handle string with no underscores', () => {
        const result = service.CamelCode('hello');

        expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
        const result = service.CamelCode('');

        expect(result).toBe('');
    });

    it('should not do anything if data is null', () => {
        const spy = spyOn(Tools, 'ConvertToCSV');

        Tools.DownloadCSVFile(null);

        expect(spy).not.toHaveBeenCalled();
    });

    it('should create a download link and click it', () => {
        const data = [{ a: 1, b: 2 }];
        const csvData = 'a,b\n1,2\n';
        spyOn(Tools, 'ConvertToCSV').and.returnValue(csvData);
        const createElementSpy = spyOn(document, 'createElement').and.callThrough();
        const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
        const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

        Tools.DownloadCSVFile(data);

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
    });

    it('should set target to _blank if browser is Safari', () => {
        const data = [{ a: 1, b: 2 }];
        const csvData = 'a,b\n1,2\n';
        spyOn(Tools, 'ConvertToCSV').and.returnValue(csvData);
        const createElementSpy = spyOn(document, 'createElement').and.callThrough();
        const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
        const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

        // Mock userAgent to simulate Safari browser
        Object.defineProperty(window.navigator, 'userAgent', { value: 'Safari', configurable: true });

        Tools.DownloadCSVFile(data);

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();

        // Check if target attribute is set to _blank
        const link = createElementSpy.calls.mostRecent().returnValue;
        expect((link as any).target).toBe('_blank');
    });

    it('should convert array of objects to CSV string', () => {
        const data = [{ a: 1, b: 2 }, { a: 3, b: 4 }];

        const result = Tools.ConvertToCSV(data);

        expect(result).toBe('Index,a,b\r\n1,1,2\r\n2,3,4\r\n');
    });

    it('should handle empty array', () => {
        const data: any[] = [];

        const result = Tools.ConvertToCSV(data);

        expect(result).toBe('');
    });

    it('should handle array with one object', () => {
        const data = [{ a: 1, b: 2 }];

        const result = Tools.ConvertToCSV(data);

        expect(result).toBe('Index,a,b\r\n1,1,2\r\n');
    });

    it('should handle array with objects that have different keys', () => {
        const data = [{ a: 1, b: 2 }, { a: 3, c: 4 }];

        const result = Tools.ConvertToCSV(data);

        expect(result).toBe('Index,a,b\r\n1,1,2\r\n2,3,undefined\r\n');
    });

    it('should sort by given property in ascending order', () => {
        const data = [{ a: 2 }, { a: 1 }];
        const sortFunction = Tools.SortBy(['a']);

        const result = data.sort(sortFunction);

        expect(result).toEqual([{ a: 1 }, { a: 2 }]);
    });

    it('should sort by given property in descending order', () => {
        const data = [{ a: 1 }, { a: 2 }];
        const sortFunction = Tools.SortBy(['a'], false);

        const result = data.sort(sortFunction);

        expect(result).toEqual([{ a: 2 }, { a: 1 }]);
    });

    it('should sort by given date property in ascending order', () => {
        const data = [{ a: '2022-01-02' }, { a: '2022-01-01' }];
        const sortFunction = Tools.SortBy(['a'], true, true);

        const result = data.sort(sortFunction);

        expect(result).toEqual([{ a: '2022-01-01' }, { a: '2022-01-02' }]);
    });

    it('should sort by given date property in descending order', () => {
        const data = [{ a: '2022-01-01' }, { a: '2022-01-02' }];
        const sortFunction = Tools.SortBy(['a'], false, true);

        const result = data.sort(sortFunction);

        expect(result).toEqual([{ a: '2022-01-02' }, { a: '2022-01-01' }]);
    });

    it('should truncate text to given number of rows', () => {
        const text = 'row1\nrow2\nrow3';

        const result = Tools.TruncateRows(text, 2);

        expect(result).toBe('row1\nrow2...');
    });

    it('should truncate text to given number of characters', () => {
        const text = '1234567890';

        const result = Tools.TruncateRows(text, 2, 5);

        expect(result).toBe('12345...');
    });

    it('should handle text with no line breaks', () => {
        const text = 'row1';

        const result = Tools.TruncateRows(text, 2);

        expect(result).toBe('row1');
    });

    it('should handle empty text', () => {
        const text = '';

        const result = Tools.TruncateRows(text, 2);

        expect(result).toBe('');
    });

    it('should truncate positive number towards zero', () => {
        const value = 1.5;

        const result = Tools.Trunc(value);

        expect(result).toBe(1);
    });

    it('should truncate negative number towards zero', () => {
        const value = -1.5;

        const result = Tools.Trunc(value);

        expect(result).toBe(-1);
    });

    it('should return true if value is null', () => {
        const value = null;

        const result = Tools.IsNullOrUndefined(value);

        expect(result).toBe(true);
    });

    it('should return true if value is undefined', () => {
        const value = undefined;

        const result = Tools.IsNullOrUndefined(value);

        expect(result).toBe(true);
    });

    it('should return false if value is not null or undefined', () => {
        const value = 'not null or undefined';

        const result = Tools.IsNullOrUndefined(value);

        expect(result).toBe(false);
    });
});

describe('WorkflowErrorMsg', () => {
    it('should handle error with errori property', () => {
        const error = {
            error: {
                errori: [
                    { dato: 'dato1', campi: ['field1', 'field2'] },
                    { dato: 'dato2', campi: ['field3', 'field4'] }
                ]
            }
        };
        const result = Tools.WorkflowErrorMsg(error);
        expect(result).toBe('dato1 - field1 - dato1 - field2 - dato2 - field3 - dato2 - field4');
    });

    it('should handle error without errori property', () => {
        const error = { message: 'error message' };
        const result = Tools.WorkflowErrorMsg(error);
        expect(result).toBe('error message');
    });
});

describe('OnError', () => {
    it('should return customMessage if provided', () => {
        const error = { status: 500 };
        const customMessage = 'custom message';

        const result = Tools.OnError(error, customMessage);

        expect(result).toBe(customMessage);
    });

    it('should return error message from GetErrorMsg if customMessage not provided', () => {
        const error = { status: 500, error: { title: 'title', detail: 'detail' } };
        spyOn(Tools, 'GetErrorMsg').and.returnValue('error message');

        const result = Tools.OnError(error);

        expect(result).toBe('error message');
    });

    it('should truncate message if length greater than 200', () => {
        const error = { status: 500 };
        const customMessage = 'a'.repeat(201);

        const result = Tools.OnError(error, customMessage);

        expect(result).toBe('a'.repeat(200));
    });
});

describe('IsBase64', () => {
    it('should return false for undefined', () => {
        const str = undefined;

        const result = Tools.IsBase64(str);

        expect(result).toBe(false);
    });

    it('should return false for null', () => {
        const str = null;

        const result = Tools.IsBase64(str);

        expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
        const str = '';

        const result = Tools.IsBase64(str);

        expect(result).toBe(false);
    });

    it('should return false for string with only spaces', () => {
        const str = '   ';

        const result = Tools.IsBase64(str);

        expect(result).toBe(false);
    });

    it('should return true for valid Base64 string', () => {
        const str = btoa('test'); // 'test' encoded in Base64

        const result = Tools.IsBase64(str);

        expect(result).toBe(true);
    });

    it('should return false for invalid Base64 string', () => {
        const str = 'invalid base64 string';

        const result = Tools.IsBase64(str);

        expect(result).toBe(false);
    });
});

describe('DateFormatByLanguage', () => {
    beforeEach(() => {
        Tools.translate = { currentLang: 'en' }; // set default language to 'en'
    });

    it('should return date format with timestamp for English language', () => {
        Tools.translate.currentLang = 'en';

        const result = Tools.DateFormatByLanguage(true);

        expect(result).toBe('YYYY/MM/DD, HH:mm:ss');
    });

    it('should return date format without timestamp for English language', () => {
        Tools.translate.currentLang = 'en';

        const result = Tools.DateFormatByLanguage(false);

        expect(result).toBe('YYYY/MM/DD');
    });

    it('should return date format with timestamp for Italian language', () => {
        Tools.translate.currentLang = 'it';

        const result = Tools.DateFormatByLanguage(true);

        expect(result).toBe('DD-MM-YYYY, HH:mm:ss');
    });

    it('should return date format without timestamp for Italian language', () => {
        Tools.translate.currentLang = 'it';

        const result = Tools.DateFormatByLanguage(false);

        expect(result).toBe('DD-MM-YYYY');
    });

    it('should return default date format with timestamp for other languages', () => {
        Tools.translate.currentLang = 'es'; // Spanish

        const result = Tools.DateFormatByLanguage(true);

        expect(result).toBe('DD-MM-YYYY, HH:mm:ss');
    });

    it('should return default date format without timestamp for other languages', () => {
        Tools.translate.currentLang = 'es'; // Spanish

        const result = Tools.DateFormatByLanguage(false);

        expect(result).toBe('DD-MM-YYYY');
    });
});
