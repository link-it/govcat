import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RepeaterComponent } from "./repeater.component";
import { ComponentsModule } from "../../components.module";


describe('RepeaterComponent', () => {
    let component: RepeaterComponent;
    let fixture: ComponentFixture<RepeaterComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(RepeaterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set list', () => {
        const value = [{}];
        component.list = value;
        expect(component._data).toBe(value);
    });

    it('should get list', () => {
        const value = [{}];
        component._data = value;
        const result = component.list;
        expect(result).toBe(value);
    });

    it('__onKeyRemove should call __remove when Enter key is pressed', () => {
        const event = new KeyboardEvent('keydown', { keyCode: 13 });
        const target = {};
        const index = 0;
        spyOn(component, '__remove');

        component.__onKeyRemove(event, target, index);

        expect(component.__remove).toHaveBeenCalledWith(event, target, index);
    });

    it('__onKeyRemove should call __remove when Enter key is pressed', () => {
        const event = new KeyboardEvent('keydown', { code: 'Enter' });
        const target = {};
        const index = 0;
        spyOn(component, '__remove');

        component.__onKeyRemove(event, target, index);

        expect(component.__remove).toHaveBeenCalledWith(event, target, index);
    });

    it('__remove should remove data and emit remove event when not disabled', () => {
        const event = { preventDefault: jasmine.createSpy(), stopImmediatePropagation: jasmine.createSpy() };
        const target = {};
        const index = 0;
        component._data = [target];
        spyOn(component.remove, 'emit');

        component.__remove(event as any, target, index);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopImmediatePropagation).toHaveBeenCalled();
        expect(component._data.length).toBe(0);
        expect(component.remove.emit).toHaveBeenCalledWith({ target, index });
    });

    it('__onKeyAdd should call __add when Enter key is pressed', () => {
        const event = new KeyboardEvent('keydown', { keyCode: 13 });
        spyOn(component, '__add');

        component.__onKeyAdd(event);

        expect(component.__add).toHaveBeenCalledWith(event);
    });

    it('__onKeyAdd should call __add when Enter key is pressed', () => {
        const event = new KeyboardEvent('keydown', { code: 'Enter' });
        spyOn(component, '__add');

        component.__onKeyAdd(event);

        expect(component.__add).toHaveBeenCalledWith(event);
    });

    it('__add should emit insert event when trigger is not disabled', () => {
        const event = {};
        component.trigger = true;
        component.disableTrigger = false;
        spyOn(component.insert, 'emit');

        component.__add(event);

        expect(component.insert.emit).toHaveBeenCalledWith({ event });
    });

    it('add should add target to data', () => {
        const target = {};
        component._data = [];

        component.add(target);

        expect(component._data).toContain(target);
    });

    it('eliminate should remove target from data and emit remove event', () => {
        const target = {};
        component._data = [target];
        spyOn(component.remove, 'emit');

        component.eliminate(0);

        expect(component._data.length).toBe(0);
        expect(component.remove.emit).toHaveBeenCalledWith({ target, index: 0 });
    });

    it('validate should return true when required and data is not empty', () => {
        component.required = true;
        component._data = [{}];

        const result = component.validate();

        expect(result).toBe(true);
    });

    it('validate should return true when not required', () => {
        component.required = false;

        const result = component.validate();

        expect(result).toBe(true);
    });
});