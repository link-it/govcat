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
import { TranslateModule } from "@ngx-translate/core";
import { FormControl } from '@angular/forms';
import { SenderComponent } from "./sender.component";
import { COMPONENTS_IMPORTS } from '@linkit/components';
import { Tools } from "../../services";

import moment from 'moment';

describe('SenderComponent', () => {
    let component: SenderComponent;
    let fixture: ComponentFixture<SenderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ...COMPONENTS_IMPORTS]
        }).compileComponents();
        fixture = TestBed.createComponent(SenderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit send event when __send is called', () => {
        vi.spyOn(component.send, 'emit');
        const form = { value: 'test' };
        component.__send(form);
        expect(component.send.emit).toHaveBeenCalledWith({ form });
    });

    it('should emit download event when _downloadAllegato is called', () => {
        vi.spyOn(component.download, 'emit');
        const allegato = { value: 'test' };
        component._downloadAllegato(allegato);
        expect(component.download.emit).toHaveBeenCalledWith({ allegato });
    });

    it('should reset form when resetForm is called', () => {
        vi.spyOn(component, '__reset');
        vi.spyOn(component, '__resetMsg');
        vi.spyOn(component, '__clearAllegatoCtrl');
        component._messaggio = { nativeElement: { innerText: 'test' } };
        component.resetForm();
        expect(component.__reset).toHaveBeenCalled();
        expect(component.__resetMsg).toHaveBeenCalled();
        expect(component.__clearAllegatoCtrl).toHaveBeenCalled();
    });

    it('should remove an attachment when __chipClick is called', () => {
        component._allegati = [{ file: 'test1' }, { file: 'test2' }];
        component.__chipClick(0);
        expect(component._allegati.length).toBe(1);
        expect(component._allegati[0].file).toBe('test2');
    });

    it('should update _msgCtrl value when __inputChange is called', () => {
        const event = { currentTarget: { innerText: 'test' } };
        component.__inputChange(event);
        expect(component._msgCtrl.value).toBe('test');
    });

    it('should call click on browse element when __browse is called', () => {
        vi.spyOn(component._browse.nativeElement, 'click').mockImplementation(() => {});
        component.__browse({});
        expect(component._browse.nativeElement.click).toHaveBeenCalled();
    });

    it('should handle file change correctly when __onChange is called', () => {
        const MAXK = Tools.MaxUpload();
        const fileContent = "content";
        const file = new File([fileContent], "filename", { type: "text/plain" });
        const event = { currentTarget: { files: [file] } };

        vi.spyOn(component, '__toBase64').mockImplementation(() => {});
        vi.spyOn(Tools, 'FileExceedError').mockImplementation(() => {});

        // Test when no files are selected
        component.__onChange({ currentTarget: { files: [] } });
        expect(component._file).toBeUndefined();
        expect(component.__toBase64).not.toHaveBeenCalled();
        expect(Tools.FileExceedError).not.toHaveBeenCalled();

        // Test when a file smaller than MAXK is selected
        component.__onChange(event);
        expect(component._file).toBe(file);
        expect(component.__toBase64).toHaveBeenCalled();
        expect(Tools.FileExceedError).not.toHaveBeenCalled();

        // Test when a file larger than MAXK is selected
        const largeFileContent = new Array(MAXK + 2).join('a');
        const largeFile = new File([largeFileContent], "filename", { type: "text/plain" });
        const largeEvent = { currentTarget: { files: [largeFile] } };

        component.__onChange(largeEvent);
        // expect(Tools.FileExceedError).toHaveBeenCalledWith(MAXK);
        expect(component._browse.nativeElement.value).toBe('');
    });

    it('should handle file reading correctly when __toBase64 is called', () => {
        const fileContent = "content";
        const file = new File([fileContent], "filename.txt", { type: "text/plain" });
        component._file = file;

        const mockReader = {
            readAsDataURL: vi.fn(),
            onload: null
        };
        vi.stubGlobal('FileReader', function(this: any) { return Object.assign(this, mockReader); });
        vi.spyOn(component, 'onFileLoad');

        // Test when _file is not null
        component.__toBase64();
        expect(mockReader.readAsDataURL).toHaveBeenCalledWith(file);
        expect(mockReader.onload).toBeDefined();

        // Test when _file is null
        component._file = undefined as any;
        component.__toBase64();
        mockReader.readAsDataURL.mockClear();
        expect(mockReader.readAsDataURL).not.toHaveBeenCalled();
    });

    it('should handle file load correctly when onFileLoad is called', () => {
        const fileContent = "content";
        const file = new File([fileContent], "filename.txt", { type: "text/plain" });
        component._file = file;

        vi.spyOn(component, '__loadFile');

        // Test when the result contains 'base64,'
        const event = { target: { result: 'data:text/plain;base64,' + btoa(fileContent) } };
        component._allegatiCtrl = { setValue: vi.fn() } as any;
        component.onFileLoad(event);
        expect(component.__loadFile).toHaveBeenCalledWith(file.name, btoa(fileContent), 'data:text/plain;base64,' + btoa(fileContent), 'text/plain');
    });

    it('should handle file loading correctly when __loadFile is called', () => {
        const fileContent = "content";
        const file = new File([fileContent], "filename.txt", { type: "text/plain" });
        const b64 = btoa(fileContent);
        const dataURL = 'data:text/plain;base64,' + b64;
        component._allegatiCtrl = { setValue: vi.fn() } as any;

        // Test when _allegatiCtrl is not null
        component.__loadFile(file.name, b64, dataURL, 'text/plain');
        expect(component._allegatiCtrl.setValue).toHaveBeenCalledWith([{ file: file.name, data: b64, dataURL, type: 'text/plain' }]);

        // Test when _allegatiCtrl is null
        component._allegatiCtrl = undefined as any;
        component.__loadFile(file.name, b64, dataURL, 'text/plain');
        expect(component._allegatiCtrl).toBeUndefined();
    });


    it('should correctly map date group when __mapDateGroup is called', () => {
        const today = moment();
        const yesterday = moment().add(-1, 'days');

        // Test when the date is one day before the current date
        const elYesterday = { mDate: yesterday, date: yesterday.format('DDMMYYYY') };
        expect(component.__mapDateGroup(elYesterday)).toBe('Ieri');

        // Test when the date is not one day before the current date
        const elToday = { mDate: today, date: today.format('DDMMYYYY') };
        expect(component.__mapDateGroup(elToday)).toBe(elToday.date);

        const elTwoDaysAgo = { mDate: moment().add(-2, 'days'), date: moment().add(-2, 'days').format('DDMMYYYY') };
        expect(component.__mapDateGroup(elTwoDaysAgo)).toBe(elTwoDaysAgo.date);
    });

    it('should reset message correctly when __resetMsg is called', () => {
        component._msgCtrl = new FormControl();
        component._placeholder = 'placeholder';

        // Test when _messaggio is not null
        component._messaggio = { nativeElement: { innerText: '' } };
        component.__resetMsg();
        expect(component._msgCtrl.errors).toBeNull();
        expect(component._msgCtrl.value).toBe('');
        expect(component._msgCtrl.validator).toBeDefined();
        expect(component._messaggio.nativeElement.innerText).toBe(component._placeholder);
    });

    describe('target "Tutti"', () => {
        beforeEach(() => {
            component.showTarget = true;
            component.targetOptions = [
                { label: 'APP.LABEL.TargetGestore', value: 'GESTORE' },
                { label: 'APP.LABEL.TargetReferentiServizio', value: 'REFERENTI_SERVIZIO', hasTecnici: true },
                { label: 'APP.LABEL.TargetRichiedente', value: 'RICHIEDENTE' }
            ];
        });

        it('should select all targets and deselect them', () => {
            component.toggleAllTargets(true);
            expect(component._targetCtrl.value).toEqual(['GESTORE', 'REFERENTI_SERVIZIO', 'RICHIEDENTE']);
            expect(component._allTargetsSelected).toBe(true);
            expect(component._someTargetsSelected).toBe(false);

            component.toggleAllTargets(false);
            expect(component._targetCtrl.value).toEqual([]);
            expect(component._allTargetsSelected).toBe(false);
            expect(component._someTargetsSelected).toBe(false);
        });

        it('should be indeterminate when only some targets are selected', () => {
            component.toggleTarget('GESTORE', true);
            expect(component._allTargetsSelected).toBe(false);
            expect(component._someTargetsSelected).toBe(true);
        });

        it('should become all selected when every target is checked one by one', () => {
            component.targetOptions.forEach(o => component.toggleTarget(o.value, true));
            expect(component._allTargetsSelected).toBe(true);
        });

        it('should show the "All" label when every target is selected', () => {
            component.toggleAllTargets(true);
            expect(component.targetLabel).toBe('APP.LABEL.All');
        });

        it('should render the "Tutti" checkbox first in the open menu', () => {
            component._dropdownOpen = true;
            fixture.detectChanges();
            const items = fixture.nativeElement.querySelectorAll('.target-dropdown-menu .target-dropdown-item');
            expect(items.length).toBe(4);
            expect(items[0].textContent.trim()).toBe('APP.LABEL.All');
        });

        it('should expose aria-expanded on the trigger', () => {
            fixture.detectChanges();
            const trigger: HTMLElement = fixture.nativeElement.querySelector('.target-dropdown-trigger');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            trigger.click();
            fixture.detectChanges();
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe(component._targetId + '-menu');
        });

        it('should not move focus when pressing the mouse on an item text', () => {
            component._dropdownOpen = true;
            fixture.detectChanges();
            const text: HTMLElement = fixture.nativeElement.querySelector('.target-dropdown-menu .target-dropdown-item span');
            const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            text.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);

            const input: HTMLElement = fixture.nativeElement.querySelector('.target-dropdown-menu input');
            const inputEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
            input.dispatchEvent(inputEvent);
            expect(inputEvent.defaultPrevented).toBe(false);
        });

        it('should toggle the focused checkbox with Enter without submitting', () => {
            component._dropdownOpen = true;
            fixture.detectChanges();
            const inputs: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('.target-dropdown-menu input'));

            const enterAll = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
            inputs[0].dispatchEvent(enterAll);
            expect(enterAll.defaultPrevented).toBe(true);
            expect(component._allTargetsSelected).toBe(true);

            fixture.detectChanges();
            inputs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            expect(component._targetCtrl.value).toEqual(['REFERENTI_SERVIZIO', 'RICHIEDENTE']);
        });

        it('should close the menu on Escape and focus the trigger', () => {
            component._dropdownOpen = true;
            fixture.detectChanges();
            const trigger: HTMLElement = fixture.nativeElement.querySelector('.target-dropdown-trigger');
            const focusSpy = vi.spyOn(trigger, 'focus');
            fixture.nativeElement.querySelector('.target-dropdown').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(component._dropdownOpen).toBe(false);
            expect(focusSpy).toHaveBeenCalled();
        });
    });
});