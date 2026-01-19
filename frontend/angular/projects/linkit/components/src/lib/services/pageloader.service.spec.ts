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
import { PageloaderService } from './pageloader.service';
import { last } from 'rxjs/operators';

describe('PageloaderService', () => {
    let service: PageloaderService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PageloaderService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should show loader', (done) => {
        service.isLoading.pipe(last())
            .subscribe(value => {
                expect(value).toBe(true);
                done();
            });

        service.showLoader();
        service.closeLoader();
    });

    it('should hide loader', (done) => {
        service.showLoader();

        service.isLoading.pipe(last()).subscribe(value => {
            expect(value).toBe(false);
            done();
        });

        setTimeout(() => {
            service.hideLoader();
            service.closeLoader();
        }, 1000);
    });

    it('should not hide loader if there are pending jobs', (done) => {
        service.showLoader();
        service.showLoader();

        service.isLoading.pipe(last()).subscribe(value => {
            expect(value).toBe(true);
            done();
        });

        service.hideLoader();
        service.closeLoader();
    });

    it('should reset loader', (done) => {
        service.showLoader();

        service.isLoading.pipe(last()).subscribe(value => {
            expect(value).toBe(false);
            done();
        });

        service.resetLoader();
        service.closeLoader();
    });
});