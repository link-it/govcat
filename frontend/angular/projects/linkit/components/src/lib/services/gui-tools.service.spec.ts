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
import { GuiToolsService } from './gui-tools.service';
import { ElementRef } from '@angular/core';

describe('GuiToolsService', () => {
    let service: GuiToolsService;
    let elementRef: ElementRef;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GuiToolsService]
        });

        service = TestBed.inject(GuiToolsService);
        elementRef = new ElementRef(document.createElement('div'));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should copy text to clipboard', () => {
        const spy = spyOn(document, 'execCommand');
        service.copyToClipboard('test');
        expect(spy).toHaveBeenCalledWith('copy');
    });

    it('should scroll to element', (done) => {
        const div = document.createElement('div');
        div.style.height = '2000px';
        document.body.appendChild(div);
        elementRef.nativeElement = div;
        service.scrollTo(elementRef, () => div);
        setTimeout(() => {
            expect(div.scrollTop).toBeGreaterThan(-1);
            document.body.removeChild(div);
            done();
        }, 1000);
    });
});