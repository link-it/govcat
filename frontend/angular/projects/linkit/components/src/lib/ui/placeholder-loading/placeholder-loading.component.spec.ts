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
import { ComponentsModule } from "../../components.module";
import { PlaceholderLoadingComponent } from "./placeholder-loading.component";

describe('PlaceholderLoadingComponent', () => {
    let component: PlaceholderLoadingComponent;
    let fixture: ComponentFixture<PlaceholderLoadingComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaceholderLoadingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set type', () => {
        const value = 'card';
        component.type = value;
        expect(component.type).toBe(value);
    });

    it('should set count', () => {
        const value = 5;
        component.count = value;
        expect(component.count).toBe(value);
    });

    it('should set col', () => {
        const value = 5;
        component.col = value;
        expect(component.col).toBe(value);
    });

    it('should set title', () => {
        const value = 'title';
        component.title = value;
        expect(component.title).toBe(value);
    });

    it('should set icon', () => {
        const value = 'icon';
        component.icon = value;
        expect(component.icon).toBe(value);
    });

    it('should set rounded', () => {
        const value = true;
        component.rounded = value;
        expect(component.rounded).toBe(value);
    });

    it('should set range_arr when count changes', () => {
        const changes = {
            count: {
                currentValue: 5,
            },
        };
        component.ngOnChanges(changes as any);
        expect(component.range_arr).toEqual([1, 2, 3, 4, 5]);
    });
});