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
import { PrettyjsonPipe } from './pretty-json.pipe';

describe('PrettyjsonPipe', () => {
    let pipe: PrettyjsonPipe;

    beforeEach(() => {
        pipe = new PrettyjsonPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return pretty JSON', () => {
        const value = { name: 'John', age: 30 };
        const expectedValue = '{<br/>&nbsp;&nbsp;"name":&nbsp;"John",<br/>&nbsp;&nbsp;"age":&nbsp;30<br/>}';
        expect(pipe.transform(value)).toEqual(expectedValue);
    });
});
