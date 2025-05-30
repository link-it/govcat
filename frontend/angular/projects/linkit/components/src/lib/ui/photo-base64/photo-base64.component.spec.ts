import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PhotoBase64Component } from "./photo-base64.component";
import { ComponentsModule } from "../../components.module";

describe('PhotoBase64Component', () => {
    let component: PhotoBase64Component;
    let fixture: ComponentFixture<PhotoBase64Component>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PhotoBase64Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set placeHolder', () => {
        const value = 'placeHolder';
        component.placeHolder = value;
        expect(component.placeHolder).toBe(value);
    });

    it('should set boxWidth', () => {
        const value = 'boxWidth';
        component.boxWidth = value;
        expect(component.boxWidth).toBe(value);
    });

    it('should set boxHeight', () => {
        const value = 'boxHeight';
        component.boxHeight = value;
        expect(component.boxHeight).toBe(value);
    });

    it('should set imageSaved', () => {
        const value = 'imageSaved';
        component.imageSaved = value;
        expect(component.imageSaved).toBe(value);
    });

    it('should set isImageSaved', () => {
        const value = true;
        component.isImageSaved = value;
        expect(component.isImageSaved).toBe(value);
    });

    it('should set maxSize', () => {
        const value = 5;
        component.maxSize = value;
        expect(component.maxSize).toBe(value);
    });

    it('should set removeLabel', () => {
        const value = 'removeLabel';
        component.removeLabel = value;
        expect(component.removeLabel).toBe(value);
    });

    it('should set fileTypes', () => {
        const value = ['fileTypes'];
        component.fileTypes = value;
        expect(component.fileTypes).toBe(value);
    });

    it('should emit imageLoaded', () => {
        const spy = spyOn(component.imageLoaded, 'emit');
        component.imageLoaded.emit();
        expect(spy).toHaveBeenCalled();
    });

    it('should set imageSaved when changes', () => {
        const changes = {
            imageSaved: {
                currentValue: 'imageSaved',
            },
            isImageSaved: {
                currentValue: true,
            },
        };
        component.ngOnChanges(changes as any);
        expect(component.cardImageBase64).toBe(changes.imageSaved.currentValue);
    });

    it('should set imageError when fileChangeEvent', () => {
        const blob = new Blob([''], { type: 'image/jpeg' }) as any;
        blob['lastModifiedDate'] = '';
        blob['name'] = 'filename';
        const file = <File>blob;
        const fileInput = {
            target: {
                files: [file]
            }
        };
        component.fileChangeEvent(fileInput as any);
        expect(component.imageError).toBeNull();
    });

    it('should set imageError when file is not an image', () => {
        const blob = new Blob([''], { type: 'text/plain' }) as any;
        blob['lastModifiedDate'] = '';
        blob['name'] = 'filename';
        const file = <File>blob;
        const fileInput = {
            target: {
                files: [file]
            }
        };
        component.fileChangeEvent(fileInput as any);
        expect(component.imageError).toEqual('Only Images are allowed ( JPG | PNG )');
    });

    it('should set imageError when file size is too large', () => {
        const blob = new Blob([''.padEnd(2000 * 1024)], { type: 'image/jpeg' }) as any;
        blob['lastModifiedDate'] = '';
        blob['name'] = 'filename';
        const file = <File>blob;
        const fileInput = {
            target: {
                files: [file]
            }
        };
        component.fileChangeEvent(fileInput as any);
        expect(component.imageError).toEqual('Maximum size allowed is 200Mb');
    });

    it('removeImage should reset image properties and emit null', () => {
        spyOn(component.imageLoaded, 'emit');

        component.removeImage();

        expect(component.cardImageBase64).toBeNull();
        expect(component.isImageSaved).toBe(false);
        expect(component.imageError).toBeNull();
        expect(component.imageLoaded.emit).toHaveBeenCalledWith(null);
    });
});