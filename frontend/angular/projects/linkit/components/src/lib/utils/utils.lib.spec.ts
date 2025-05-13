import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilsLib } from './utils.lib';

describe('UtilsLib', () => {
    let service: UtilsLib;
    let sanitizer: DomSanitizer;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(UtilsLib);
        sanitizer = TestBed.inject(DomSanitizer);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('formatNumber should format number', () => {
        const number = 123456;
        const formattedNumber = service.formatNumber(number);
        expect(formattedNumber).toEqual('123,456');
    });

    it('should format number with suffix', () => {
        expect(service.formatNumberSuff(1234)).toEqual('1k');
        expect(service.formatNumberSuff(5678000)).toEqual('6M');
        expect(service.formatNumberSuff(9100000000)).toEqual('9G');
        expect(service.formatNumberSuff(0)).toEqual(0);
        expect(service.formatNumberSuff(999)).toEqual(999);
        expect(service.formatNumberSuff(1234, 2)).toEqual('1.23k');
        expect(service.formatNumberSuff(NaN)).toBeNull();
        expect(service.formatNumberSuff('NaN')).toBeNull();
    });

    it('should format bytes into appropriate units', () => {
        expect(service.formatBytes(1024)).toEqual('1.00KB');
        expect(service.formatBytes(1048576)).toEqual('1.00MB');
        expect(service.formatBytes(1073741824)).toEqual('1.00GB');
        expect(service.formatBytes(1099511627776)).toEqual('1.00TB');
        expect(service.formatBytes(0)).toEqual('0.00B');
        expect(service.formatBytes(999)).toEqual('999.00B');
        expect(service.formatBytes(1234)).toEqual('1.21KB');
    });

    it('should get object value at specified path', () => {
        const obj = { a: { b: { c: 'value' } }, d: false };
        expect(service.getObjectValue(obj, 'a.b.c')).toEqual('value');
        expect(service.getObjectValue(obj, 'a.b')).toEqual({ c: 'value' });
        expect(service.getObjectValue(obj, 'a')).toEqual({ b: { c: 'value' } });
        expect(service.getObjectValue(obj, 'd')).toBeFalse();
        expect(service.getObjectValue(obj, 'e')).toEqual('');
        expect(service.getObjectValue(obj, '')).toEqual(obj);
    });

    it('should format value into currency', () => {
        service.locale = 'en-US';
        service.currency = '$';
        service.currencyCode = 'USD';
        service.digitsInfo = '1.2-2';
        expect(service.currencyFormatter(1234.56)).toEqual('$1,234.56');
        expect(service.currencyFormatter(0)).toEqual('$0.00');
        expect(service.currencyFormatter(null)).toEqual('$0.00');
    });


    it('should format date', () => {
        const date = '2021-01-01';
        expect(service.dateFormatter(date, 'DD-MM-YYYY')).toEqual('01-01-2021');
        expect(service.dateFormatter(date, { format: 'DD/MM/YYYY' })).toEqual('01/01/2021');
        expect(service.dateFormatter(date, { format: 'YYYY-MM-DD' })).toEqual('2021-01-01');
        expect(service.dateFormatter(date, { format: 'DD-MM-YYYY' })).toEqual('01-01-2021');
        expect(service.dateFormatter(date, { format: 'MM-DD-YYYY' })).toEqual('01-01-2021');
        expect(service.dateFormatter(date, { format: 'YYYY/MM/DD' })).toEqual('2021/01/01');
        expect(service.dateFormatter(date, { format: 'YYYY-MM-DD HH:mm:ss' })).toEqual('2021-01-01 00:00:00');
        expect(service.dateFormatter(date, { format: 'YYYY-MM-DD HH:mm:ss' })).toEqual('2021-01-01 00:00:00');
        expect(service.dateFormatter(date, { format: 'YYYY-MM-DD HH:mm:ss' })).toEqual('2021-01-01 00:00:00');
    });

    it('should convert milliseconds into time string', () => {
        expect(service.msToTime(90061001)).toEqual('1 d 1 h 1 m 1 s 1 ms');
        expect(service.msToTime(3600000)).toEqual('1 h 0 ms');
        expect(service.msToTime(60000)).toEqual('1 m 0 ms');
        expect(service.msToTime(1000)).toEqual('1 s 0 ms');
        expect(service.msToTime(0)).toEqual('0 ms');
    });

    it('should remove properties with null or undefined values from object', () => {
        const obj = { a: 1, b: null, c: undefined, d: { e: null, f: 2 }, g: { h: undefined, i: 3 } };
        const expected = { a: 1, d: { f: 2 }, g: { i: 3 } };
        expect(service.removeEmptyFromObj(obj)).toEqual(expected);
    });

    it('should get a random different element from array', () => {
        const arr = ['a', 'b', 'c'];
        const last = 'a';
        const result = service._getRandomDifferent(arr, last);
        expect(result).not.toEqual(last);
        expect(arr).toContain(result);

        const singleElementArr = ['a'];
        expect(service._getRandomDifferent(singleElementArr)).toEqual('a');

        const emptyArr: any[] = [];
        expect(service._getRandomDifferent(emptyArr)).toBeNull();
    });

    it('should generate a random color in hexadecimal format', () => {
        const color = service._getRandomColor();
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
    });

    it('should convert a color in hexadecimal format to RGB format', () => {
        expect(service.hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
        expect(service.hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        expect(service.hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
        expect(service.hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
        expect(service.hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
        expect(service.hexToRgb('')).toBeUndefined();
        expect(service.hexToRgb('#ZZZZZZ')).toBeUndefined();
    });

    it('should return a contrasting color for the given color', () => {
        expect(service.contrast('#FFFFFF')).toEqual('#000000');
        expect(service.contrast('#000000')).toEqual('#ffffff');
        expect(service.contrast('#FF0000')).toEqual('#ffffff');
        expect(service.contrast('#00FF00')).toEqual('#000000');
        expect(service.contrast('#0000FF')).toEqual('#ffffff');
        expect(service.contrast('')).toEqual('#000000');
        expect(service.contrast('#ZZZZZZ')).toEqual('#000000');
        expect(service.contrast(undefined)).toEqual('#000000');
    });
});