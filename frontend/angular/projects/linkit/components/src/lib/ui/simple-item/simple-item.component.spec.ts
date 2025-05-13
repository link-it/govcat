import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { SimpleItemComponent } from "./simple-item.component";
import { DomSanitizer } from "@angular/platform-browser";
import { ComponentsModule } from '../../components.module';

describe('SimpleItemComponent', () => {
    let component: SimpleItemComponent;
    let fixture: ComponentFixture<SimpleItemComponent>;
    let sanitizer: DomSanitizer;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule],
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SimpleItemComponent);
        component = fixture.componentInstance;
        sanitizer = TestBed.inject(DomSanitizer);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit edit selection', () => {
        spyOn(component.editSelection, 'emit');
        component.__change({ checked: true });
        expect(component.editSelection.emit).toHaveBeenCalled();
    });

    it('should emit simple click', () => {
        spyOn(component.simpleClick, 'emit');
        component.__simpleClick({ stopImmediatePropagation: () => { }, preventDefault: () => { } }, {});
        expect(component.simpleClick.emit).toHaveBeenCalled();
    });

    it('should not emit simple click', () => {
        spyOn(component.simpleClick, 'emit');
        component.__gestureDetect = true;
        component.__simpleClick({ stopImmediatePropagation: () => { }, preventDefault: () => { } }, { classList: { contains: () => true, remove: () => { } } });
        expect(component.simpleClick.emit).not.toHaveBeenCalled();
    });

    it('should emit simpleActionClick when actionDisabled is false', () => {
        spyOn(component.simpleActionClick, 'emit');
        const event = { stopImmediatePropagation: jasmine.createSpy(), preventDefault: jasmine.createSpy() };
        const type = 'testType';
        component.actionDisabled = false;

        component.__simpleActionClick(event, type);

        expect(component.simpleActionClick.emit).toHaveBeenCalledWith({ event, type });
        expect(event.stopImmediatePropagation).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should stop event propagation when actionDisabled is true', () => {
        spyOn(component.simpleActionClick, 'emit');
        const event = { stopImmediatePropagation: jasmine.createSpy(), preventDefault: jasmine.createSpy() };
        const type = 'testType';
        component.actionDisabled = true;

        component.__simpleActionClick(event, type);

        expect(component.simpleActionClick.emit).not.toHaveBeenCalled();
        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should return correct class object', () => {
        component.__hasGesture = true;
        component.actionDisabled = false;

        let result = component.__setClass();

        expect(result).toEqual({
            'd-flex': true,
            'flex-shrink-0': true,
            'align-self-stretch': true,
            'align-items-center': true,
            draggable: true,
            action: true,
            disabled: false
        });

        component.__hasGesture = false;
        component.actionDisabled = true;

        result = component.__setClass();

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

    it('should not do anything if __hasGesture or _action is false', () => {
        component.swipeEvent = jasmine.createSpyObj('swipeEvent', ['emit']);
        const event = { changedTouches: [{ clientX: 100, clientY: 100 }], currentTarget: { classList: { add: jasmine.createSpy() } } };
        component.__hasGesture = false;
        component._action = false;

        component.__swipe(event, 'start');

        expect(component.__swipeCoord).toBeUndefined();
        expect(component.__swipeTime).toBeUndefined();
    });

    it('should set __swipeCoord and __swipeTime on swipe start', () => {
        component.swipeEvent = jasmine.createSpyObj('swipeEvent', ['emit']);
        const event = { changedTouches: [{ clientX: 100, clientY: 100 }], currentTarget: { classList: { add: jasmine.createSpy() } } };
        component.__hasGesture = true;
        component._action = true;

        component.__swipe(event, 'start');

        expect(component.__swipeCoord).toEqual([100, 100]);
        expect(component.__swipeTime).toBeDefined();
    });

    it('should emit swipeEvent on swipe end with left direction', () => {
        component.swipeEvent = jasmine.createSpyObj('swipeEvent', ['emit']);
        const event = { changedTouches: [{ clientX: 50, clientY: 100 }], currentTarget: { classList: { add: jasmine.createSpy() } } };
        component.__hasGesture = true;
        component._action = true;
        component.__swipeCoord = [100, 100];
        component.__swipeTime = new Date().getTime() - 500;

        component.__swipe(event, 'end');

        expect(event.currentTarget.classList.add).toHaveBeenCalledWith('swipe');
        expect(component.__gestureDetect).toBeTrue();
        expect(component.swipeEvent.emit).toHaveBeenCalledWith({ direction: 'left' });
    });

    it('should not emit swipeEvent on swipe end with right direction', () => {
        component.swipeEvent = jasmine.createSpyObj('swipeEvent', ['emit']);
        const event = { changedTouches: [{ clientX: 150, clientY: 100 }], currentTarget: { classList: { add: jasmine.createSpy() } } };
        component.__hasGesture = true;
        component._action = true;
        component.__swipeCoord = [100, 100];
        component.__swipeTime = new Date().getTime() - 500;

        component.__swipe(event, 'end');

        expect(event.currentTarget.classList.add).not.toHaveBeenCalled();
        expect(component.__gestureDetect).toBeFalse();
        expect(component.swipeEvent.emit).not.toHaveBeenCalled();
    });
});