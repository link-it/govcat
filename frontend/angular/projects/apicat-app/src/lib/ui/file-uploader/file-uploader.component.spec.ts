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
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FileUploaderComponent } from "./file-uploader.component";

describe('FileUploaderComponent', () => {
    let component: FileUploaderComponent;
    let fixture: ComponentFixture<FileUploaderComponent>;

    let mockFileReader: any;

    beforeEach(() => {
        mockFileReader = {
            readAsDataURL: vi.fn(),
            onload: null as any,
            result: 'data:image/png;base64,test',
        };
        vi.stubGlobal('FileReader', function(this: any) { return Object.assign(this, mockFileReader); });
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        TestBed.configureTestingModule({
            imports: [FileUploaderComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(FileUploaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should handle drag enter', () => {
        component.handleDragEnter();
        expect(component.dragging).toBe(true);
    });

    it('should handle drag leave', () => {
        component.handleDragLeave();
        expect(component.dragging).toBe(false);
    });

    it('should handle drop', () => {
        const event = {
            preventDefault: () => { },
            dataTransfer: {
                files: [
                    { type: 'text/plain' } // Mock file object with necessary properties
                ]
            }
        };
        component.handleDrop(event);
        expect(component.dragging).toBe(false);
    });

    it('should handle image load', () => {
        component.handleImageLoad();
        expect(component.imageLoaded).toBe(true);
        expect(component.iconColor).toBe(component.overlayColor);
    });

    it('should handle input change with dataTransfer', () => {
        const blob = new Blob([''], { type: 'image/png' }) as any;
        blob['lastModifiedDate'] = '';
        blob['name'] = 'filename';
        const file = <File>blob;

        const event = {
            dataTransfer: {
                files: [file]
            },
            target: {
                files: []
            }
        };
        component.handleInputChange(event);
        expect(component.loaded).toBe(false);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it('should handle input change with target files', () => {
        const blob = new Blob([''], { type: 'image/png' }) as any;
        blob['lastModifiedDate'] = '';
        blob['name'] = 'filename';
        const file = <File>blob;

        const event = {
            dataTransfer: null,
            target: {
                files: [file]
            }
        };
        component.handleInputChange(event);
        expect(component.loaded).toBe(false);
        expect(window.alert).not.toHaveBeenCalled();
    });

    it('should alert on invalid format', () => {
        const event = {
            dataTransfer: {
                files: [{ type: 'text/plain' }]
            },
            target: {
                files: []
            }
        };
        component.handleInputChange(event);
        expect(window.alert).toHaveBeenCalledWith('invalid format');
    });

    it('should set active color', () => {
        component.activeColor = 'red';
        component.imageSrc = '';
        component._setActive();
        expect(component.borderColor).toBe('red');
        expect(component.iconColor).toBe('red');
    });

    it('should not change icon color if imageSrc is not empty', () => {
        component.activeColor = 'red';
        component.imageSrc = 'some-src';
        component.iconColor = 'blue';
        component._setActive();
        expect(component.borderColor).toBe('red');
        expect(component.iconColor).toBe('blue');
    });

    it('should set base color', () => {
        component.baseColor = 'blue';
        component.imageSrc = '';
        component._setInactive();
        expect(component.borderColor).toBe('blue');
        expect(component.iconColor).toBe('blue');
    });

    it('should not change icon color if imageSrc is not empty', () => {
        component.baseColor = 'blue';
        component.imageSrc = 'some-src';
        component.iconColor = 'red';
        component._setInactive();
        expect(component.borderColor).toBe('blue');
        expect(component.iconColor).toBe('red');
    });

    it('should cancel', () => {
        component.imageSrc = 'some-src';
        component.cancel();
        expect(component.imageSrc).toBe('null');
    });
});
