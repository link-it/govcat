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
import { NO_ERRORS_SCHEMA } from "@angular/core";

import { ItemRowComponent } from "./item-row.component";
import { ConfigService } from "../../services/config.service";
import { UtilsLib } from "../../utils/utils.lib";

describe('ItemRowComponent', () => {
    let component: ItemRowComponent;
    let fixture: ComponentFixture<ItemRowComponent>;

    const mockConfigService = {
        getAppConfig: vi.fn().mockReturnValue({ Layout: { enableOpenInNewTab: false } })
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ItemRowComponent,
                TranslateModule.forRoot()
            ],
            providers: [
                { provide: ConfigService, useValue: mockConfigService },
                UtilsLib
            ],
            schemas: [NO_ERRORS_SCHEMA]
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
        const mockSetTooltip = vi.fn();
        const mockSetTooltipPlacement = vi.fn();
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
        const mockEventEmitter = { emit: vi.fn() } as any;
        component.itemClick = mockEventEmitter;
        component.rowClick = false;
        component._data = { id: 1 };

        const mouseEvent = new MouseEvent('click');
        component.__itemClick(mouseEvent, {});

        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ data: { id: 1 }, event: mouseEvent });
    });

    it('should emit itemClick event with _data when rowClick is true', () => {
        const mockEventEmitter = { emit: vi.fn() } as any;
        component.itemClick = mockEventEmitter;
        component.rowClick = true;
        component._data = { id: 1 };

        const mouseEvent = new MouseEvent('click');
        component.__itemClickRow(mouseEvent, {});

        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ data: { id: 1 }, event: mouseEvent });
    });

    it('should stop event propagation, prevent default, and emit actionClick event with _data', () => {
        const mockEvent = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;
        const mockEventEmitter = { emit: vi.fn() } as any;
        component.actionClick = mockEventEmitter;
        component._data = { id: 1 };

        component.__actionlick(mockEvent);

        expect(mockEvent.stopImmediatePropagation).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEventEmitter.emit).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return false when _value is falsy and field.hideEmpty is true', () => {
        const mockUtilsLib = { getObjectValue: vi.fn().mockReturnValue(null) };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        const field = { field: 'test', hideEmpty: true };

        const result = component._showEmpty(field);

        expect(result).toEqual(false);
    });

    it('should return true when _value is truthy or field.hideEmpty is false', () => {
        const mockUtilsLib = { getObjectValue: vi.fn().mockReturnValue('value') };
        (component as any).utilsLib = mockUtilsLib;
        component._data = { source: {} };
        const field = { field: 'test', hideEmpty: false };

        const result = component._showEmpty(field);

        expect(result).toEqual(true);
    });

    it('should return the correct background when boxOptions.background is an object', () => {
        const mockUtilsLib = { getObjectValue: vi.fn().mockReturnValue('value') };
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
        const mockUtilsLib = { getObjectValue: vi.fn().mockReturnValue('value') };
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
        const mockUtilsLib = { getObjectValue: vi.fn().mockReturnValue('value'), msToTime: vi.fn().mockReturnValue('time') };
        const mockTranslate = { instant: vi.fn().mockReturnValue('translated') };
        (component as any).utilsLib = mockUtilsLib;
        (component as any).translate = mockTranslate;
        component._data = { source: {} };
        component._config = { options: { optionName: { values: { value: { icon: 'icon', tooltip: 'tooltip', tooltip2: 'tooltip2' } } } } };
        const boxOptions = { tooltip: { field: 'test', options: 'optionName', type: 'mstime', label: 'label' } };

        const result = component._setTooltip(boxOptions);

        expect(result).toEqual('translated<br><br>translated');
    });

    it('should return the correct tooltip when boxOptions.tooltip is not an object', () => {
        const mockTranslate = { instant: vi.fn().mockReturnValue('translated') };
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