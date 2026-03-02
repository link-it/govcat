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
import { HighlighterPipe } from './highlighter.pipe';

describe('HighlighterPipe', () => {
    let pipe: HighlighterPipe;

    beforeEach(() => {
        pipe = new HighlighterPipe();
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return the original value when no args are provided', () => {
        const value = 'Hello world';
        expect(pipe.transform(value, null, 'full')).toEqual(value);
    });

    it('should highlight the full word when type is "full"', () => {
        const value = 'Hello world';
        const args = 'world';
        const expectedValue = 'Hello <span class="highlighted-text">world</span>';
        expect(pipe.transform(value, args, 'full')).toEqual(expectedValue);
    });

    it('should highlight the partial word when type is not "full"', () => {
        const value = 'Hello world';
        const args = 'o';
        const expectedValue = 'Hell<span class="highlighted-text">o</span> w<span class="highlighted-text">o</span>rld';
        expect(pipe.transform(value, args, 'partial')).toEqual(expectedValue);
    });
});