import { TestBed } from '@angular/core/testing';
import { GridFormatters } from './grid-formatters';

describe('GridFormatters', () => {
    let service: GridFormatters;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GridFormatters);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should format number correctly', () => {
        const result = GridFormatters.formatNumber(123456);
        expect(result).toEqual('123,456');
    });

    it('should format number with html correctly when hideZero is true', () => {
        const params = { value: 0, hideZero: true, icon: 'icon', tooltip: 'tooltip' };
        const result = GridFormatters.numberFormatter(params);
        expect(result).toEqual('');
    });

    it('should format number with html correctly', () => {
        const params = { value: 123456, hideZero: false, icon: 'icon', tooltip: 'tooltip', html: false };
        const result = GridFormatters.numberFormatter(params);
        expect(result).toContain('123,456');
    });

    it('should format number without html correctly', () => {
        const params = { value: 123456, hideZero: false, icon: 'icon', tooltip: 'tooltip', html: false };
        const result = GridFormatters.numberFormatter(params, false);
        expect(result).toEqual('123,456');
    });

    it('should format currency correctly', () => {
        const params = { value: 123456 };
        const result = GridFormatters.currencyFormatter(params);
        expect(result).toContain('€');
    });

    it('should format date correctly', () => {
        const params = { value: '2022-01-01', format: 'DD-MM-YYYY' };
        const result = GridFormatters.dateFormatter(params);
        expect(result).toContain('01-01-2022');
    });

    it('should format checkbox correctly', () => {
        const params = { value: true };
        const result = GridFormatters.checkBoxormatter(params);
        expect(result).toContain('√');
    });

    it('should format on/off correctly', () => {
        const params = { value: true };
        const result = GridFormatters.onOffFormatter(params);
        expect(result).toContain('ON');
    });

    it('should format progress correctly', () => {
        const params = { value: 50 };
        const result = GridFormatters.progressFormatter(params);
        expect(result).toContain('50');
    });

    it('should format status correctly', () => {
        const params = { value: 'status', options: { status: { 'status': { label: 'label', background: '#000', border: '#000', color: '#fff' } }, statusLabel: 'Status', statusSmall: false } };
        const result = GridFormatters.statusFormatter(params);
        expect(result).toContain('label');
    });

    it('should format type label correctly', () => {
        const params = { value: 'type', options: { 'type': { label: 'label', values: { 'type': { label: 'label', background: '#000', border: '#000', color: '#fff' } } }, small: false }, optionsName: 'type', field: 'field' };
        const result = GridFormatters.typeLabelFormatter(params);
        expect(result).toContain('label');
    });

    it('should format type tag correctly', () => {
        const params = { value: 'type', options: { 'type': { values: { 'type': { label: 'label', background: '#000', border: '#000', color: '#fff' } } } }, optionsName: 'type', field: { badged: true } };
        const result = GridFormatters.typeTagFormatter(params);
        expect(result).toContain('label');
    });
});