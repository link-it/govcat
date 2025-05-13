import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslateModule } from "@ngx-translate/core";

import { ItemRowComponent } from "./item-row.component";
import { ComponentsModule } from "../../components.module";

describe('ItemRowComponent', () => {
    let component: ItemRowComponent;
    let fixture: ComponentFixture<ItemRowComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot(),
                ComponentsModule
            ]
        });
        fixture = TestBed.createComponent(ItemRowComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return notify when notifyClass getter is called', () => {
        component.notify = true;
        expect(component.notifyClass).toEqual(true);
    });

    it('should set _tooltipBox1, _tooltipPlacementBox1, _tooltipBox2, and _tooltipPlacementBox2 when _itemRowConfig has boxStatus1 and boxStatus2', () => {
        const mockConfig = {
            itemRow: {
                boxStatus1: 'status1',
                boxStatus2: 'status2'
            }
        };
        const mockSetTooltip = jasmine.createSpy('setTooltip');
        const mockSetTooltipPlacement = jasmine.createSpy('setTooltipPlacement');
        component._config = mockConfig;
        component.configRow = 'itemRow';
        component._setTooltip = mockSetTooltip;
        component._setTooltipPlacement = mockSetTooltipPlacement;

        component.ngOnInit();

        expect(mockSetTooltip).toHaveBeenCalledWith('status1');
        expect(mockSetTooltip).toHaveBeenCalledWith('status2');
        expect(mockSetTooltipPlacement).toHaveBeenCalledWith('status1');
        expect(mockSetTooltipPlacement).toHaveBeenCalledWith('status2');
    });

    it('should emit itemClick event with _data when rowClick is false', () => {
        const mockEventEmitter = jasmine.createSpyObj('EventEmitter', ['emit']);
        component.itemClick = mockEventEmitter;
        component.rowClick = false;
        component._data = { id: 1 };

        component.__itemClick({}, {});

        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ id: 1 });
    });

    it('should emit itemClick event with _data when rowClick is true', () => {
        const mockEventEmitter = jasmine.createSpyObj('EventEmitter', ['emit']);
        component.itemClick = mockEventEmitter;
        component.rowClick = true;
        component._data = { id: 1 };

        component.__itemClickRow({}, {});

        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ id: 1 });
    });

    it('should stop event propagation, prevent default, and emit actionClick event with _data', () => {
        const mockEvent = jasmine.createSpyObj('Event', ['stopImmediatePropagation', 'preventDefault']);
        const mockEventEmitter = jasmine.createSpyObj('EventEmitter', ['emit']);
        component.actionClick = mockEventEmitter;
        component._data = { id: 1 };

        component.__actionlick(mockEvent);

        expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return false when _value is falsy and field.hideEmpty is true', () => {
        const mockUtilsLib = { getObjectValue: jasmine.createSpy('getObjectValue').and.returnValue(null) };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        const field = { field: 'test', hideEmpty: true };

        const result = component._showEmpty(field);

        expect(result).toEqual(false);
    });

    it('should return true when _value is truthy or field.hideEmpty is false', () => {
        const mockUtilsLib = { getObjectValue: jasmine.createSpy('getObjectValue').and.returnValue('value') };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        const field = { field: 'test', hideEmpty: false };

        const result = component._showEmpty(field);

        expect(result).toEqual(true);
    });

    it('should return the correct background when boxOptions.background is an object', () => {
        const mockUtilsLib = { getObjectValue: jasmine.createSpy('getObjectValue').and.returnValue('value') };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        component._config = { options: { optionName: { values: { value: { background: 'red' } } } } };
        const boxOptions = { background: { field: 'test', options: 'optionName' } };

        const result = component._getBackground(boxOptions);

        expect(result).toEqual('red');
    });

    it('should return the correct background when boxOptions.background is not an object', () => {
        const boxOptions = { background: 'blue' };

        const result = component._getBackground(boxOptions);

        expect(result).toEqual('blue');
    });

    it('should return the correct color when boxOptions.background is an object', () => {
        const mockUtilsLib = { getObjectValue: jasmine.createSpy('getObjectValue').and.returnValue('value') };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        component._config = { options: { optionName: { values: { value: { color: 'red' } } } } };
        const boxOptions = { background: { field: 'test', options: 'optionName' } };

        const result = component._getColor(boxOptions);

        expect(result).toEqual('red');
    });

    it('should return the correct color when boxOptions.background is not an object', () => {
        const boxOptions = { color: 'blue' };

        const result = component._getColor(boxOptions);

        expect(result).toEqual('blue');
    });

    it('should return the correct tooltip when boxOptions.tooltip is an object', () => {
        const mockUtilsLib = { getObjectValue: jasmine.createSpy('getObjectValue').and.returnValue('value'), msToTime: jasmine.createSpy('msToTime').and.returnValue('time') };
        const mockTranslate = { instant: jasmine.createSpy('instant').and.returnValue('translated') };
        (component as any).utilsLib = mockUtilsLib;
        (component as any).translate = mockTranslate;
        component._data = { source: {} };
        component._config = { options: { optionName: { values: { value: { icon: 'icon', tooltip: 'tooltip', tooltip2: 'tooltip2' } } } } };
        const boxOptions = { tooltip: { field: 'test', options: 'optionName', type: 'mstime', label: 'label' } };

        const result = component._setTooltip(boxOptions);

        expect(result).toEqual('translated<br><br>translated');
    });

    it('should return the correct tooltip when boxOptions.tooltip is not an object', () => {
        const mockTranslate = { instant: jasmine.createSpy('instant').and.returnValue('translated') };
        (component as any).translate = mockTranslate;
        const boxOptions = { tooltip: 'tooltip' };

        const result = component._setTooltip(boxOptions);

        expect(result).toEqual('translated');
    });

    it('should return the correct tooltip placement when boxOptions.tooltip is an object', () => {
        const boxOptions = { tooltip: { placement: 'bottom' } };

        const result = component._setTooltipPlacement(boxOptions);

        expect(result).toEqual('bottom');
    });

    it('should return "top" as default tooltip placement when boxOptions.tooltip is an object but placement is not defined', () => {
        const boxOptions = { tooltip: {} };

        const result = component._setTooltipPlacement(boxOptions);

        expect(result).toEqual('top');
    });

    it('should return "top" as default tooltip placement when boxOptions.tooltip is not an object', () => {
        const boxOptions = { tooltip: 'tooltip' };

        const result = component._setTooltipPlacement(boxOptions);

        expect(result).toEqual('top');
    });
});