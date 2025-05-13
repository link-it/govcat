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