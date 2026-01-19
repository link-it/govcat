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
import { MapperPipe } from './mapper.pipe';

describe('MapperPipe', () => {
    let pipe: MapperPipe;

    beforeEach(() => {
        pipe = new MapperPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should map the value using the provided mapper function', () => {
        const value = 'Hello world';
        const mapper = (item: string) => item.toUpperCase();
        expect(pipe.transform(value, mapper)).toEqual('HELLO WORLD');
    });

    it('should pass additional arguments to the mapper function', () => {
        const value = 'Hello';
        const mapper = (item: string, suffix: string) => item + suffix;
        expect(pipe.transform(value, mapper, ' world')).toEqual('Hello world');
    });
});