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
import moment from 'moment/moment';
import { FormControl } from '@angular/forms';
import { minDate } from './validator';


describe('MinDate', () => {
  let control: FormControl;

  it('"" should equal to "null"', () => {
    control = new FormControl('');
    expect(minDate('2016-09-09')(control)).toBeNull();
  });

  it('"2016-09-08" should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    control = new FormControl('2016-09-08');
    expect(minDate('2016-09-09')(control)).toEqual({ minDate: { value: '2016-09-09', control: undefined } });
  });

  it('"2016-09-10" should equal to "null"', () => {
    control = new FormControl('2016-09-10');
    expect(minDate('2016-09-09')(control)).toBeNull();
  });

  it('Date("2016-09-08)" should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    control = new FormControl('2016-09-08');
    expect(minDate('2016-09-09')(control)).toEqual({ minDate: { value: '2016-09-09', control: undefined } });
  });

  it('"Date(2016-09-10)" should equal to "null"', () => {
    control = new FormControl('2016-09-10');
    expect(minDate('2016-09-09')(control)).toBeNull();
  });

  it('"Date(2016-09-10)" moment should equal to "null"', () => {
    control = new FormControl('2016-09-10');
    expect(minDate(moment('2016-09-09'))(control)).toBeNull();
  });

  it('() => Date("2016-09-08)" should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    control = new FormControl('2016-09-08');
    expect(minDate('2016-09-09')(control)).toEqual({ minDate: { value: '2016-09-09', control: undefined } });
  });

  it('"() => Date(2016-09-10)" should equal to "null"', () => {
    control = new FormControl('2016-09-10');
    expect(minDate('2016-09-09')(control)).toBeNull();
  });

  it('Date object { year: 2017, month: 10, day: 11} should equal to "null"', () => {
    const obj = { year: 2017, month: 10, day: 11 };
    control = new FormControl('2017-11-01');
    expect(minDate(obj)(control)).toBeNull();
  });

  it('Date control object { year: 2017, month: 10, day: 11} should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    const obj = new FormControl('2018-10-01');
    control = new FormControl({ year: 2017, month: 10, day: 11 });
    expect(minDate(obj)(control)).toEqual({ minDate: { value: obj.value, control: obj } });
  });

  it('Date control object { year: 2017, month: 10, day: 11} should equal to "null"', () => {
    const obj = { year: 2016, month: 10, day: 11 };
    control = new FormControl({ year: 2017, month: 10, day: 11 });
    expect(minDate(obj)(control)).toBeNull();
  });

  it('Date object { year: 2017, month: 11, day: 11} should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    const obj = { year: 2017, month: 11, day: 11 };
    control = new FormControl('2017-10-01');
    expect(minDate(obj)(control)).toEqual({ minDate: { value: obj, control: undefined } });
  });

  it('Date object { year: 2017, month: 11, day: 11} moment should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    const obj = { year: 2017, month: 11, day: 11 };
    control = new FormControl(moment('2017-10-01'));
    expect(minDate(obj)(control)).toEqual({ minDate: { value: obj, control: undefined } });
  });

  it('Date form control should equal to "null"', () => {
    const control2 = new FormControl('2017-01-01');
    control = new FormControl('2018-11-01');
    expect(minDate(control2)(control)).toBeNull();
  });

  it('Date form control should equal to "{minDate: true, reason: \'xxx\'}"', () => {
    const control2 = new FormControl('2018-01-01');
    control = new FormControl('2017-11-01');
    expect(minDate(control2)(control)).toEqual({ minDate: { value: control2.value, control: control2 } });
  });

  it('should return null when value is a date and is greater than minDate', () => {
    const minInput = new FormControl('2017-11-01');
    const control = new FormControl('2017-11-02');
    expect(minDate(minInput)(control)).toBeNull();
  });

  it('should return error object when value is a date and is less than minDate', () => {
    const minInput = new FormControl('2017-11-02');
    const control = new FormControl('2017-11-01');
    expect(minDate(minInput)(control)).toEqual({ minDate: { control: minInput, value: minInput.value } });
  });

  it('should return error when value is not a date, not a function, not null and isForm is true', () => {
    const minInput = new FormControl('not a date');
    const control = new FormControl('2017-11-01');
    expect(minDate(minInput)(control)).toEqual({ minDate: { error: 'minDate is invalid' } });
  });

  it('should throw error when value is not a date, not a function, not null and isForm is false', () => {
    const control = new FormControl('2017-11-01');
    expect(() => minDate('not a date')(control)).toThrowError('minDate value must be or return a formatted date');
  });

  it('should return null when value is not a date, not a function and is null', () => {
    const control = new FormControl('2017-11-01');
    expect(minDate(null)(control)).toBeNull();
  });

  it('should update validity when minInput value changes', () => {
    const minInput = new FormControl('2017-11-01');
    const control = new FormControl('2017-11-02');
    const validator = minDate(minInput);
    expect(validator(control)).toBeNull(); // control value is greater than minInput value

    minInput.setValue('2017-11-03'); // change minInput value to be greater than control value
    expect(validator(control)).toEqual({ minDate: { control: minInput, value: minInput.value } }); // control value is now less than minInput value
  });
});

