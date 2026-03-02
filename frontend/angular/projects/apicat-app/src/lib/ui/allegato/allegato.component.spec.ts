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
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { AllegatoComponent } from "./allegato.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";

describe('AllegatoComponent', () => {
    let component: AllegatoComponent;
    let fixture: ComponentFixture<AllegatoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, TranslateModule.forRoot(), AllegatoComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AllegatoComponent);
        component = fixture.componentInstance;

        component.control = new FormControl();
        component.multiple = false;
        component.maxUpload = 100;
        component.control.setValue({ file: 'test', name: 'test.txt' })

        fixture.detectChanges();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set _selected to true on control value change', () => {
        component.control = new FormControl();
        component.control.setValue('test');
        expect(component['_selected']).toBe(true);
    });

    it('should set _selected to true on ngOnInit', () => {
        component.control = new FormControl('test');
        component.ngOnInit();
        expect(component['_selected']).toBe(true);
    });

    it('should set _selected to false on ngOnInit', () => {
        component.control = new FormControl();
        component.ngOnInit();
        expect(component['_selected']).toBe(false);
    });

    it('should set _file_extension to ".jpg" on ngOnInit', () => {
        component.label = 'Logo';
        component.ngOnInit();
        expect(component['_file_extension']).toBe('.jpg');
    });

    it('should set _file_extension to "" on ngOnInit', () => {
        component.ngOnInit();
        expect(component['_file_extension']).toBe('');
    });

    it('should return true on hasControlError', () => {
        component.required = true;
        component.disabled = false;
        component['_selected'] = false;
        expect(component.hasControlError()).toBe(true);
    });

    it('should return false on hasControlError', () => {
        component.required = true;
        component.disabled = false;
        component['_selected'] = true;
        expect(component.hasControlError()).toBe(false);
    });

    it('should call __reset on __triggering', () => {
        component['_selected'] = true;
        vi.spyOn((component as any), '__reset');
        component.__triggering();
        expect((component as any).__reset).toHaveBeenCalled();
    });

    it('should call _browse.nativeElement.click on __triggering', () => {
        component['_selected'] = false;
        const clickSpy = vi.spyOn(component._browse.nativeElement, 'click').mockImplementation(() => {});
        component.__triggering();
        expect(clickSpy).toHaveBeenCalled();
    });

    it('should set _file and call toBase64 if file size is less than maxUpload', () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        vi.spyOn((component as any), 'toBase64');
        component.maxUpload = 1000;
        component.__onChange({ currentTarget: { files: [file] } });
        expect(component['_file']).toEqual(file);
        expect((component as any).toBase64).toHaveBeenCalled();
    });

    it('should handle multiple files if multiple is true', () => {
        const file1 = new File(['test1'], 'test1.txt', { type: 'text/plain' });
        const file2 = new File(['test2'], 'test2.txt', { type: 'text/plain' });
        vi.spyOn((component as any), 'toBase64');
        vi.spyOn(component.oversizeError, 'emit');
        component.maxUpload = 1000;
        component.multiple = true;
        component.__onChange({ currentTarget: { files: [file1, file2] } });
        expect((component as any).toBase64).toHaveBeenCalledTimes(2);
    });

    it('should not do anything if no files are selected', () => {
        vi.spyOn((component as any), 'toBase64');
        vi.spyOn(component.oversizeError, 'emit');
        component.__onChange({ currentTarget: { files: [] } });
        expect((component as any).toBase64).not.toHaveBeenCalled();
        expect(component.oversizeError.emit).not.toHaveBeenCalled();
    });

    it('should emit oversizeError and reset input value on onOversize', () => {
        vi.spyOn(component.oversizeError, 'emit');
        component.onOversize();
        expect(component.oversizeError.emit).toHaveBeenCalledWith({ type: 'oversize', limit: component.maxUpload });
        expect(component._browse.nativeElement.value).toEqual('');
    });


    it('should convert file to base64 and call loadFile', () => {
        vi.useFakeTimers();
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        vi.spyOn(component, 'loadFile');
        component['_file'] = file;
        (component as any).toBase64();

        vi.advanceTimersByTime(0);
        expect(component.loadFile).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('should set hint to error message if an error occurs while reading file', () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        vi.spyOn(window, 'FileReader').mockReturnValue({
            readAsDataURL: () => { throw new Error(); }
        } as any);
        component['_file'] = file;
        (component as any).toBase64();
        expect(component.hint).toEqual('Errore in lettura');
    });

    it('should not do anything if _file is not set', () => {
        vi.spyOn(window, 'FileReader');
        component['_file'] = null as any;
        (component as any).toBase64();
        expect(window.FileReader).not.toHaveBeenCalled();
    });

    it('should call __reset on reset', () => {
        vi.spyOn(component as any, '__reset');
        component.reset();
        expect((component as any).__reset).toHaveBeenCalled();
    });

    it('should set control value and emit fileChanged event when loadFile is called', () => {
        const control = { setValue: vi.fn() };
        component.control = control as any;
        vi.spyOn(component.fileChanged, 'emit');
        const _name = 'test.txt';
        const _data = 'test data';
        const _type = 'text/plain';
        const _dataURL = 'data:text/plain;base64,dGVzdCBkYXRh';
        component.loadFile(_name, _data, _type, _dataURL);
        expect(control.setValue).toHaveBeenCalledWith({ file: _name, data: _data, type: _type, dataURL: _dataURL });
        expect(component.fileChanged.emit).toHaveBeenCalledWith({ type: 'file_changed' });
    });
});
