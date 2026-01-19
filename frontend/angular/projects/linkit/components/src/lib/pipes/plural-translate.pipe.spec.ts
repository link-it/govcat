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
import { PluralTranslatePipe } from './plural-translate.pipe';

describe('PluralTranslatePipe', () => {
    let pipe: PluralTranslatePipe;

    beforeEach(() => {
        pipe = new PluralTranslatePipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return key.none when number is 0', () => {
        const key = 'item';
        const number = 0;
        expect(pipe.transform(key, number)).toEqual('item.none');
    });

    it('should return key.singular when number is 1', () => {
        const key = 'item';
        const number = 1;
        expect(pipe.transform(key, number)).toEqual('item.singular');
    });

    it('should return key.plural when number is greater than 1', () => {
        const key = 'item';
        const number = 2;
        expect(pipe.transform(key, number)).toEqual('item.plural');
    });
});
