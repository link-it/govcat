import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { CollapseItemComponent } from "./collapse-item.component";
import { ComponentsModule } from "../../components.module";

describe('CollapseItemComponent', () => {
    let component: CollapseItemComponent;
    let fixture: ComponentFixture<CollapseItemComponent>;
    let event: any;
    let activeItem: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule, BrowserAnimationsModule]
        }).compileComponents();
        fixture = TestBed.createComponent(CollapseItemComponent);
        component = fixture.componentInstance;

        event = {
            stopImmediatePropagation: jasmine.createSpy('stopImmediatePropagation'),
            preventDefault: jasmine.createSpy('preventDefault')
        };
        activeItem = {
            classList: {
                contains: jasmine.createSpy('contains'),
                remove: jasmine.createSpy('remove')
            }
        };
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
        expect(component.show).toBeTrue();

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

    it('should set __hasGesture on ngOnInit', () => {
        const hasTouchEventResult = true; // replace with the value you expect
        spyOn(component, '__hasTouchEvent').and.returnValue(hasTouchEventResult);

        component.ngOnInit();

        expect(component.__hasGesture).toEqual(hasTouchEventResult);
    });

    it('should call toggle if enableCollapse is true and __gestureDetect is false', () => {
        spyOn(component, 'toggle');
        component.enableCollapse = true;
        component.__gestureDetect = false;

        component.__toggle(event, activeItem);

        expect(component.toggle).toHaveBeenCalled();
    });

    it('should stop event propagation and prevent default if enableCollapse is false or __gestureDetect is true', () => {
        component.enableCollapse = false;
        component.__gestureDetect = true;

        component.__toggle(event, activeItem);

        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should remove "swipe" class from activeItem if it contains it', () => {
        activeItem.classList.contains.and.returnValue(true);

        component.__toggle(event, activeItem);

        expect(activeItem.classList.remove).toHaveBeenCalledWith('swipe');
    });

    it('should emit editSelection event on __change', () => {
        const event = { checked: true };
        spyOn(component.editSelection, 'emit');

        component.__change(event);

        expect(component.editSelection.emit).toHaveBeenCalledWith({ selected: event.checked });
    });

    it('should return true if ontouchstart is in document.documentElement', () => {
        Object.defineProperty(document.documentElement, 'ontouchstart', {});

        const result = component.__hasTouchEvent();

        expect(result).toBe(true);
    });

    describe('__simpleActionClick', () => {
        let event: any;
        let type: string;

        beforeEach(() => {
            event = {
                stopImmediatePropagation: jasmine.createSpy('stopImmediatePropagation'),
                preventDefault: jasmine.createSpy('preventDefault')
            };
            type = 'test';
        });

        it('should emit simpleActionClick event if actionDisabled is false', () => {
            component.actionDisabled = false;
            spyOn(component.simpleActionClick, 'emit');

            component.__simpleActionClick(event, type);

            expect(component.simpleActionClick.emit).toHaveBeenCalledWith({ event, type });
        });

        it('should stop event propagation and prevent default if actionDisabled is true', () => {
            component.actionDisabled = true;

            component.__simpleActionClick(event, type);

            expect(event.stopImmediatePropagation).toHaveBeenCalled();
            expect(event.preventDefault).toHaveBeenCalled();
        });
    });

    describe('__setClass', () => {
        it('should return correct class object', () => {
            component.__hasGesture = true;
            component.actionDisabled = false;

            const result = component.__setClass();

            expect(result).toEqual({
                'd-flex': true,
                'flex-shrink-0': true,
                'align-self-stretch': true,
                'align-items-center': true,
                draggable: true,
                action: true,
                disabled: false
            });
        });

        it('should return correct class object when __hasGesture and actionDisabled are false', () => {
            component.__hasGesture = false;
            component.actionDisabled = true;

            const result = component.__setClass();

            expect(result).toEqual({
                'd-flex': true,
                'flex-shrink-0': true,
                'align-self-stretch': true,
                'align-items-center': true,
                draggable: false,
                action: true,
                disabled: true
            });
        });
    });

    describe('__swipe', () => {
        let event: any;
        let status: string;

        beforeEach(() => {
            event = {
                changedTouches: [{ clientX: 100, clientY: 100 }],
                currentTarget: { classList: { add: jasmine.createSpy('add') } }
            };
            status = 'start';
        });

        it('should set __swipeCoord and __swipeTime on swipe start', () => {
            component.__hasGesture = true;
            (component as any)._action = true;

            component.__swipe(event, status);

            expect(component.__swipeCoord).toEqual([100, 100]);
            expect(component.__swipeTime).toBeDefined();
        });

        it('should emit swipeEvent on swipe end with left direction', fakeAsync(() => {
            status = 'end';
            event.changedTouches[0].clientX = 50;
            component.__hasGesture = true;
            (component as any)._action = true;
            component.__swipeCoord = [100, 100];
            component.__swipeTime = new Date().getTime() - 500;
            spyOn(component.swipeEvent, 'emit');

            component.__swipe(event, status);

            tick(1000);

            expect(event.currentTarget.classList.add).toHaveBeenCalledWith('swipe');
            expect(component.__gestureDetect).toBe(true);
            expect(component.swipeEvent.emit).toHaveBeenCalledWith({ direction: 'left' });
        }));

        it('should not emit swipeEvent on swipe end with right direction', fakeAsync(() => {
            const status = 'end';
            event.changedTouches[0].clientX = 150;
            component.__hasGesture = true;
            (component as any)._action = true;
            component.__swipeCoord = [100, 100];
            component.__swipeTime = new Date().getTime() - 500;
            spyOn(component.swipeEvent, 'emit');

            component.__swipe(event, status);

            tick(1000);

            expect(event.currentTarget.classList.add).not.toHaveBeenCalled();
            expect(component.__gestureDetect).toBeFalse();
            expect(component.swipeEvent.emit).not.toHaveBeenCalled();
        }));
    });

    it('should set _transition to true if fromState is falsy and toState is truthy', () => {
        const event = { fromState: false, toState: true };
        (component as any)._transition = false;

        component.__startTransition(event);

        expect((component as any)._transition).toBe(true);
    });

    it('should set _transition to false if fromState is truthy and toState is falsy', () => {
        const event = { fromState: true, toState: false };
        (component as any)._transition = true;

        component.__endTransition(event);

        expect((component as any)._transition).toBe(false);
    });

    describe('getItemSelection', () => {
        it('should return _selector.checked if _selector is truthy', () => {
            (component as any)._selector = { checked: true };

            const result = component.getItemSelection();

            expect(result).toBe(true);
        });

        it('should return false if _selector is falsy', () => {
            (component as any)._selector = null;

            const result = component.getItemSelection();

            expect(result).toBe(false);
        });
    });
});