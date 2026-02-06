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
import { OrderByPipe } from './ordeby.pipe';

describe('OrderByPipe', () => {
    let pipe: OrderByPipe;

    beforeEach(() => {
        pipe = new OrderByPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return the input if it is not an array', () => {
        const value = 'Hello world';
        expect(pipe.transform(value, ['-'])).toEqual(value);
    });

    it('should sort a basic array in ascending order', () => {
        const value = ['b', 'a', 'c'];
        expect(pipe.transform(value, ['+'])).toEqual(['a', 'b', 'c']);
    });

    it('should sort a basic array in descending order', () => {
        const value = ['b', 'a', 'c'];
        expect(pipe.transform(value, ['-'])).toEqual(['c', 'b', 'a']);
    });

    it('should sort an array of objects based on a single property', () => {
        const value = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
        expect(pipe.transform(value, ['+name'])).toEqual([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
    });

    it('should sort an array of objects based on multiple properties', () => {
        const value = [
            { name: 'b', age: 30 },
            { name: 'a', age: 20 },
            { name: 'a', age: 30 },
        ];
        expect(pipe.transform(value, ['+name', '-age'] as any)).toEqual([
            { name: 'a', age: 20 },
            { name: 'a', age: 30 },
            { name: 'b', age: 30 },
        ]);
    });

    it('should sort an array of objects based on a single property when config is a string', () => {
        const value = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
        expect(pipe.transform(value, '+name' as any)).toEqual([{ name: 'b' }, { name: 'a' }, { name: 'c' }]);
    }); 
    
    it('should sort an array of objects based on a single property', () => {
        const value = [{ name: 'b' }, { name: 'a' }, { name: 'c' }];
        expect(pipe.transform(value, ['+name'])).toEqual([{ name: 'a' }, { name: 'b' }, { name: 'c' }]);
    });
});