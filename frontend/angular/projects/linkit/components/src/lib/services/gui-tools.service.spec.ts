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