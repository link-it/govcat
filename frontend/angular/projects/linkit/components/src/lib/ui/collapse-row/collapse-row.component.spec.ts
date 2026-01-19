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
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from "@angular/core/testing";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollapseRowComponent } from "./collapse-row.component";
import { ComponentsModule } from "../../components.module";

describe('CollapseRowComponent', () => {
    let component: CollapseRowComponent;
    let fixture: ComponentFixture<CollapseRowComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule, BrowserAnimationsModule]
        }).compileComponents();
        fixture = TestBed.createComponent(CollapseRowComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have a show property', () => {
        expect(component.show).toBeFalse();
    });

    it('should have a show setter', fakeAsync(() => {
        component.show = true;
        tick(1000);
        expect(component.show).toBeFalse();

        component.show = false;
        tick(1000);
        expect(component.show).toBeFalse();
    }));

    it('should have a noFeedbackClass getter', () => {
        expect(component.noFeedbackClass).toBeFalse();
    });

    it('should have a transitionState getter', () => {
        expect(component.transitionState).toBeFalse();
    });

    it('should set --collapse-item-background-color property and _itemRowConfig', () => {
        spyOn(document.documentElement.style, 'setProperty');
        component.hostBackground = 'red';
        component._config = {
            itemRow: 'itemRowConfig',
            simpleItem: 'simpleItemConfig'
        };
        component.ngOnInit();
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--collapse-item-background-color', 'red');
        expect(component._itemRowConfig).toBe('itemRowConfig');
    });

    it('should set _itemRowConfig to simpleItem if itemRow is not defined', () => {
        spyOn(document.documentElement.style, 'setProperty');
        component.hostBackground = 'red';
        component._config = {
            simpleItem: 'simpleItemConfig'
        };
        component.ngOnInit();
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--collapse-item-background-color', 'red');
        expect(component._itemRowConfig).toBe('simpleItemConfig');
    });

    it('should call toggle if enableCollapse is true', () => {
        spyOn(component, 'toggle');
        const event = jasmine.createSpyObj('event', ['stopImmediatePropagation', 'preventDefault']);
        component.enableCollapse = true;
        component.__toggle(event, {});
        expect(component.toggle).toHaveBeenCalled();
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should stop event propagation and prevent default if enableCollapse is false', () => {
        spyOn(component, 'toggle');
        const event = jasmine.createSpyObj('event', ['stopImmediatePropagation', 'preventDefault']);
        component.enableCollapse = false;
        component.__toggle(event, {});
        expect(component.toggle).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should emit itemClick event if actionDisabled is false', () => {
        spyOn(component.itemClick, 'emit');
        const event = jasmine.createSpyObj('event', ['stopImmediatePropagation', 'preventDefault']);
        component.actionDisabled = false;
        component._data = 'testData';
        component.__itemClick(event);
        expect(component.itemClick.emit).toHaveBeenCalledWith('testData');
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should stop event propagation and prevent default if actionDisabled is true', () => {
        spyOn(component.itemClick, 'emit');
        const event = jasmine.createSpyObj('event', ['stopImmediatePropagation', 'preventDefault']);
        component.actionDisabled = true;
        component.__itemClick(event);
        expect(component.itemClick.emit).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should stop event propagation, prevent default and emit actionClick event', () => {
        spyOn(component.actionClick, 'emit');
        const event = jasmine.createSpyObj('event', ['stopImmediatePropagation', 'preventDefault']);
        component._data = 'testData';
        component.__actionClick(event);
        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(component.actionClick.emit).toHaveBeenCalledWith('testData');
    });

    it('should set _transition to true if fromState is falsy and toState is truthy', () => {
        const event = { fromState: false, toState: true };
        component.__startTransition(event);
        expect((component as any)._transition).toBe(true);
    });

    it('should not change _transition if fromState is truthy or toState is falsy', () => {
        (component as any)._transition = false;
        let event = { fromState: true, toState: true };
        component.__startTransition(event);
        expect((component as any)._transition).toBe(false);

        event = { fromState: false, toState: false };
        component.__startTransition(event);
        expect((component as any)._transition).toBe(false);
    });

    it('should set _transition to false if fromState is truthy and toState is falsy', () => {
    const event = { fromState: true, toState: false };
    component.__endTransition(event);
    expect((component as any)._transition).toBe(false);
});

it('should not change _transition if fromState is falsy or toState is truthy', () => {
    (component as any)._transition = true;
    let event = { fromState: false, toState: false };
    component.__endTransition(event);
    expect((component as any)._transition).toBe(true);

    event = { fromState: true, toState: true };
    component.__endTransition(event);
    expect((component as any)._transition).toBe(true);
});
});