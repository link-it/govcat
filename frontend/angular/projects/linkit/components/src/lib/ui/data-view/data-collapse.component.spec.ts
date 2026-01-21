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
import { SimpleChange } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";

import { DataCollapseComponent } from "./data-collapse.component";

describe('DataCollapseComponent', () => {
    let component: DataCollapseComponent;
    let fixture: ComponentFixture<DataCollapseComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot()],
            declarations: [DataCollapseComponent]
        }).compileComponents();
        
        fixture = TestBed.createComponent(DataCollapseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle', () => {
        component._toggle();
        expect(component._opened).toBeTrue();
    });

    it('should update _opened when opened changes', () => {
        const changes = {
            opened: new SimpleChange(null, true, false)
        };
        component.ngOnChanges(changes);
        expect(component._opened).toBeTrue();
    });

    it('should not update _opened when other properties change', () => {
        const changes = {
            otherProp: new SimpleChange(null, 'newValue', false)
        };
        component._opened = false;
        component.ngOnChanges(changes);
        expect(component._opened).toBeFalse();
    });

    it('should add "show" class if element exists and _opened is true', () => {
        const elem = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(elem);
        component._id = 'testId';
        component._opened = true;
        component.ngAfterViewInit();
        expect(elem.classList.contains('show')).toBeTrue();
    });

    it('should not add "show" class if element does not exist', () => {
        spyOn(document, 'getElementById').and.returnValue(null);
        component._id = 'testId';
        component._opened = true;
        component.ngAfterViewInit();
        expect(component).toBeTruthy();
        // No assertion for elem.classList because elem is null
    });

    it('should not add "show" class if _opened is false', () => {
        const elem = document.createElement('div');
        spyOn(document, 'getElementById').and.returnValue(elem);
        component._id = 'testId';
        component._opened = false;
        component.ngAfterViewInit();
        expect(elem.classList.contains('show')).toBeFalse();
    });
});