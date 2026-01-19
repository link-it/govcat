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
import { InputHelpComponent } from "./input-help.component";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslateService } from "@ngx-translate/core";

describe('InputHelpComponent', () => {
    let component: InputHelpComponent;
    let fixture: ComponentFixture<InputHelpComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [InputHelpComponent],
            providers: [
                { provide: DomSanitizer, useValue: { bypassSecurityTrustHtml: (html: string) => html } },
                { provide: TranslateService, useValue: { instant: (key: string) => key } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InputHelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set _text and _existsValue', () => {
        component.field = 'field';
        component.context = 'context';
        component.params = { param: 'value' };
        component.ngOnChanges({
            field: {
                currentValue: 'field', previousValue: 'some',
                firstChange: false,
                isFirstChange: function (): boolean {
                    throw new Error("Function not implemented.");
                }
            }
        });
        expect(component._text).toBe('APP.LABEL_HELP.context.field');
        expect(component._existsValue).toBe(false);
    });
});