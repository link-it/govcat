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
        // happy-dom does not define execCommand, so we need to add it before spying
        if (!(document as any).execCommand) {
            (document as any).execCommand = () => false;
        }
        const spy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
        service.copyToClipboard('test');
        expect(spy).toHaveBeenCalledWith('copy');
    });

    it('should scroll to element', () => {
        return new Promise<void>((resolve) => {
            const div = document.createElement('div');
            div.style.height = '2000px';
            document.body.appendChild(div);
            elementRef.nativeElement = div;
            service.scrollTo(elementRef, () => div);
            setTimeout(() => {
                expect(div.scrollTop).toBeGreaterThan(-1);
                document.body.removeChild(div);
                resolve();
            }, 1000);
        });
    });

    it('should not scroll when getElement returns null', () => {
        return new Promise<void>((resolve) => {
            const div = document.createElement('div');
            div.id = 'test-null';
            document.body.appendChild(div);
            elementRef.nativeElement = div;
            const initialScrollTop = div.scrollTop;
            service.scrollTo(elementRef, () => null);
            setTimeout(() => {
                expect(div.scrollTop).toBe(initialScrollTop);
                document.body.removeChild(div);
                resolve();
            }, 500);
        });
    });

    it('should create textarea for clipboard copy and remove it', () => {
        if (!(document as any).execCommand) {
            (document as any).execCommand = () => false;
        }
        vi.spyOn(document, 'execCommand').mockReturnValue(true);
        const appendSpy = vi.spyOn(document.body, 'appendChild');
        const removeSpy = vi.spyOn(document.body, 'removeChild');
        service.copyToClipboard('hello world');
        expect(appendSpy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
        const appendedEl = appendSpy.mock.calls[0][0] as HTMLTextAreaElement;
        expect(appendedEl.tagName).toBe('TEXTAREA');
    });

    it('should set textarea value to the text being copied', () => {
        if (!(document as any).execCommand) {
            (document as any).execCommand = () => false;
        }
        vi.spyOn(document, 'execCommand').mockReturnValue(true);
        let capturedValue = '';
        vi.spyOn(document.body, 'appendChild').mockImplementation((el: any) => {
            capturedValue = el.value;
            return el;
        });
        vi.spyOn(document.body, 'removeChild').mockImplementation((el: any) => el);
        service.copyToClipboard('test value');
        expect(capturedValue).toBe('test value');
    });

    it('should handle scrollTo with element below viewport (deltaBottom < 0)', () => {
        return new Promise<void>((resolve) => {
            const container = document.createElement('div');
            container.id = 'scroll-below';
            Object.defineProperty(container, 'offsetHeight', { value: 100 });
            container.getBoundingClientRect = () => ({ top: 0, bottom: 100 } as DOMRect);

            const target = document.createElement('div');
            target.getBoundingClientRect = () => ({ top: 200, bottom: 250 } as DOMRect);

            document.body.appendChild(container);
            elementRef.nativeElement = container;
            service.scrollTo(elementRef, () => target);
            setTimeout(() => {
                document.body.removeChild(container);
                resolve();
            }, 500);
        });
    });

    it('should handle scrollTo with element above viewport (deltaTop < 0)', () => {
        return new Promise<void>((resolve) => {
            const container = document.createElement('div');
            container.id = 'scroll-above';
            Object.defineProperty(container, 'offsetHeight', { value: 400 });
            container.getBoundingClientRect = () => ({ top: 100, bottom: 500 } as DOMRect);

            const target = document.createElement('div');
            target.getBoundingClientRect = () => ({ top: 50, bottom: 80 } as DOMRect);

            document.body.appendChild(container);
            elementRef.nativeElement = container;
            service.scrollTo(elementRef, () => target);
            setTimeout(() => {
                document.body.removeChild(container);
                resolve();
            }, 500);
        });
    });

    it('should cancel previous scroll when new scroll starts on same element', () => {
        return new Promise<void>((resolve) => {
            const container = document.createElement('div');
            container.id = 'scroll-cancel';
            Object.defineProperty(container, 'offsetHeight', { value: 100 });
            container.getBoundingClientRect = () => ({ top: 0, bottom: 100 } as DOMRect);

            const target1 = document.createElement('div');
            target1.getBoundingClientRect = () => ({ top: 200, bottom: 250 } as DOMRect);

            const target2 = document.createElement('div');
            target2.getBoundingClientRect = () => ({ top: 300, bottom: 350 } as DOMRect);

            document.body.appendChild(container);
            elementRef.nativeElement = container;

            // Start two scrolls on the same element
            service.scrollTo(elementRef, () => target1);
            service.scrollTo(elementRef, () => target2);
            setTimeout(() => {
                document.body.removeChild(container);
                resolve();
            }, 500);
        });
    });
});