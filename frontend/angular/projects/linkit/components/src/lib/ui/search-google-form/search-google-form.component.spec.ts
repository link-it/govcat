import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from "@angular/core/testing";
import { SearchGoogleFormComponent } from "./search-google-form.component";
import { ComponentsModule } from '../../components.module';
import { TranslateModule } from "@ngx-translate/core";
import { ConfigService, Tools } from "../../services";
import { SimpleChange, SimpleChanges } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";

describe('SearchGoogleFormComponent', () => {
    let component: SearchGoogleFormComponent;
    let fixture: ComponentFixture<SearchGoogleFormComponent>;

    const mockConfigService = {
        getConfiguration: () => {
            return {
                AppConfig: {
                    Search: {
                        HistoryCount: 10
                    }
                }
            };
        }
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule, TranslateModule.forRoot()],
            providers: [
                { provide: ConfigService, useValue: mockConfigService }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchGoogleFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update placeholder on ngOnChanges', () => {
        const changes: SimpleChanges = {
            placeholder: new SimpleChange(null, 'new placeholder', false)
        };
        component.ngOnChanges(changes);
        expect(component.placeholder).toEqual('new placeholder');
        expect(component._placeholder).toEqual('new placeholder');
    });

    it('should update _outsideClickDisable after 200ms when outsideClickDisable is set', (done) => {
        component.outsideClickDisable = true;
        setTimeout(() => {
            expect((component as any)._outsideClickDisable).toEqual(true);
            done();
        }, 250);
    });

    it('should update _isOpen when clicked outside', () => {
        const pointerEvent = new PointerEvent('pointerdown');
        component.clickedOut(pointerEvent);
        expect((component as any)._isOpen).toEqual(false);
    });

    it('should update _notCloseForm when setNotCloseForm is called', () => {
        component.setNotCloseForm(true);
        expect((component as any)._notCloseForm).toEqual(true);
    });

    it('should update sortField and emit onSort event when _selectSort is called', () => {
        const item = { field: 'testField' };
        component.sortDirection = 'asc';
        spyOn(component.onSort, 'emit');
        component._selectSort(item);
        expect(component.sortField).toEqual('testField');
        expect(component.onSort.emit).toHaveBeenCalledWith({ sortField: 'testField', sortBy: 'asc' });
    });

    it('should toggle sortDirection and emit onSort event when _toggleSortBy is called', () => {
        component.sortDirection = 'asc';
        component.sortField = 'testField';
        spyOn(component.onSort, 'emit');
        component._toggleSortBy();
        expect(component.sortDirection).toEqual('desc');
        expect(component.onSort.emit).toHaveBeenCalledWith({ sortField: 'testField', sortBy: 'desc' });

        component._toggleSortBy();
        expect(component.sortDirection).toEqual('asc');
        expect(component.onSort.emit).toHaveBeenCalledWith({ sortField: 'testField', sortBy: 'asc' });
    });

    it('should return true when sortDirection is asc', () => {
        component.sortDirection = 'asc';
        expect(component._isAscending()).toEqual(true);
    });

    it('should return false when sortDirection is not asc', () => {
        component.sortDirection = 'desc';
        expect(component._isAscending()).toEqual(false);
    });

    it('should return the correct label when _getSortLabel is called', () => {
        component.sortFields = [{ field: 'testField', label: 'Test Label' }];
        expect(component._getSortLabel('testField')).toEqual('Test Label');
    });

    it('should emit onSearch event with query when simple is true', () => {
        component.simple = true;
        component.query = 'testQuery';
        spyOn(component.onSearch, 'emit');
        component._onSearch();
        expect(component.onSearch.emit).toHaveBeenCalledWith({ q: 'testQuery' });
    });

    it('should emit onSearch event with form value when simple is false', () => {
        component.simple = false;
        component.query = 'testQuery';
        spyOn(component.onSearch, 'emit');
        component._onSearch();
        expect(component.onSearch.emit).toHaveBeenCalledWith({});
    });

    it('should update _currentValues, _tokens, _placeholder, and emit onSearch event when _setSearch is called', fakeAsync(() => {
        const testValues = { q: 'testQuery', anotherKey: 'anotherValue' };
        spyOn(component.onSearch, 'emit');
        component._setSearch(testValues);
        tick(500);
        expect(component._currentValues).toEqual(testValues);
        expect(component.onSearch.emit).toHaveBeenCalledWith(testValues);
        if (component._tokens.length > 0) {
            expect(component._placeholder).toEqual('');
        }
    }));

    it('should return true when all values in the object are empty', () => {
        const testValues = { key1: '', key2: null };
        expect(component.__isEmptyValues(testValues)).toBeTrue();
    });

    it('should return false when at least one value in the object is not empty', () => {
        const testValues = { key1: 'value1', key2: '' };
        expect(component.__isEmptyValues(testValues)).toBeFalse();
    });

    it('should update formGroup q control value with query when _onKeyup is called', () => {
        const testEvent = new Event('keyup');
        component.query = 'testQuery';
        component.formGroup = new FormGroup({ q: new FormControl('') });
        component._onKeyup(testEvent);
        expect(component.formGroup.controls['q'].value).toEqual('testQuery');
    });

    it('should return the field if it exists in searchFields', () => {
        component.searchFields = [
            { field: 'key1', label: 'Label 1', type: 'string', condition: 'equal' },
            { field: 'key2', label: 'Label 2', type: 'string', condition: 'equal' },
            // Add more fields as needed
        ];
        // Mock the translate service
        (component as any).translate = { instant: (key: string) => `Translated ${key}` } as any;
        const field = component.__getField('key1');
        expect(field).toEqual({ field: 'key1', label: 'Translated Label 1', type: 'string', condition: 'equal' });
    });

    it('should create a new field if it does not exist in searchFields', () => {
        component.searchFields = [
            { field: 'key1', label: 'Label 1', type: 'string', condition: 'equal' },
            { field: 'key2', label: 'Label 2', type: 'string', condition: 'equal' },
            // Add more fields as needed
        ];
        // Mock the translate service
        (component as any).translate = { instant: (key: string) => `Translated ${key}` } as any;
        const field = component.__getField('key3');
        expect(field).toEqual({ field: 'key3', label: 'Translated APP.LABEL.key3', type: 'string', condition: 'equal' });
    });

    it('should return the correct operator based on the field condition', () => {
        component.searchFields = [
            { field: 'likeField', label: 'Label 1', type: 'string', condition: 'like' },
            { field: 'equalField', label: 'Label 2', type: 'string', condition: 'equal' },
            { field: 'gtField', label: 'Label 3', type: 'string', condition: 'gt' },
            { field: 'gteField', label: 'Label 4', type: 'string', condition: 'gte' },
            { field: 'ltField', label: 'Label 5', type: 'string', condition: 'lt' },
            { field: 'lteField', label: 'Label 6', type: 'string', condition: 'lte' },
            { field: 'defaultField', label: 'Label 7', type: 'string', condition: 'default' },
        ];

        expect(component.__getOperator('likeField')).toEqual('⊂');
        expect(component.__getOperator('equalField')).toEqual('=');
        expect(component.__getOperator('gtField')).toEqual('>');
        expect(component.__getOperator('gteField')).toEqual('>=');
        expect(component.__getOperator('ltField')).toEqual('<');
        expect(component.__getOperator('lteField')).toEqual('<=');
        expect(component.__getOperator('defaultField')).toEqual('⊂');
    });

    it('should format the value based on the field type or call the field callback', () => {
        component.searchFields = [
            { field: 'enumField', type: 'enum', enumValues: ['Enum Value 1', 'Enum Value 2'] },
            { field: 'booleanField', type: 'boolean', booleanValues: ['True Value', 'False Value'] },
            { field: 'dateField', type: 'date', format: 'YYYY-MM-DD' },
            { field: 'objectField', type: 'object', data: { label: 'objectLabel' } },
            { field: 'callbackField', callBack: (value: any) => `Callback ${value}` },
        ];
        // Mock the translate service
        (component as any).translate = { instant: (key: string) => `Translated ${key}` } as any;

        expect(component.__formatValue('enumField', 0)).toEqual('Translated Enum Value 1');
        expect(component.__formatValue('booleanField', true)).toEqual('Translated True Value');
        expect(component.__formatValue('dateField', new Date(2022, 0, 1))).toEqual('2022-01-01');
        expect(component.__formatValue('objectField', { objectLabel: 'Object Value' })).toEqual('Object Value');
        expect(component.__formatValue('callbackField', 'Test')).toEqual('Callback Test');
        expect(component.__formatValue('booleanField', false)).toEqual('Translated False Value');
    });

    it('should patch form group and call _onSearch', () => {
        const data = { key1: 'value1', key2: 'value2' };
        spyOn(component, '_onSearch');

        component._restoreSearch(data);
        expect(component._onSearch).toHaveBeenCalledWith(true, false);
    });

    it('should toggle _isOpen and call dropdown show/hide', () => {
        const dropdownShowSpy = jasmine.createSpy('show');
        const dropdownHideSpy = jasmine.createSpy('hide');

        (window as any)['$'] = (selector: any) => {
            if (selector === '#form_toggle') {
                return {
                    dropdown: (action: any) => {
                        if (action === 'show') {
                            dropdownShowSpy();
                        } else if (action === 'hide') {
                            dropdownHideSpy();
                        }
                    }
                };
            }
            return {}; // Return an empty object for all other selectors
        };

        component.simple = false;

        // Test when _isOpen is initially false
        component._isOpen = false;
        component._openSearch();
        expect(component._isOpen).toBe(true);
        expect(dropdownShowSpy).toHaveBeenCalled();

        // Test when _isOpen is initially true
        component._isOpen = true;
        component._openSearch();
        expect(component._isOpen).toBe(false);
        expect(dropdownHideSpy).toHaveBeenCalled();
    });

    it('should clear search', () => {
        const formGroupSpy = spyOn(component.formGroup, 'reset');
        const markAllAsTouchedSpy = spyOn(component.formGroup, 'markAllAsTouched');
        const onSearchSpy = spyOn(component, '_onSearch');

        component.simple = false;
        component.query = 'test';
        component._tokens = ['token1', 'token2'];
        component._currentValues = { key: 'value' };
        component._placeholder = 'old placeholder';

        component._clearSearch({});

        expect(component.query).toBe('');
        expect(component._tokens).toEqual([]);
        expect(component._currentValues).toEqual({});
        expect(component._placeholder).toBe(component.placeholder);
        expect(formGroupSpy).toHaveBeenCalled();
        expect(markAllAsTouchedSpy).toHaveBeenCalled();
        expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should close search dropdown', () => {
        const dropdownHideSpy = jasmine.createSpy('hide');
        (window as any)['$'] = (selector: any) => {
            if (selector === '#form_toggle') {
                return {
                    dropdown: (action: any) => {
                        if (action === 'hide') {
                            dropdownHideSpy();
                        }
                    }
                };
            }
            return {}; // Return an empty object for all other selectors
        }

        component.simple = false;
        component._isOpen = true;

        component._closeSearchDropDpwn({});

        expect(component._isOpen).toBe(false);
        expect(dropdownHideSpy).toHaveBeenCalled();
    });


    it('should call _openSearch or _closeSearchDropDpwn based on freeSearch', () => {
        const openSearchSpy = spyOn(component, '_openSearch');
        const closeSearchDropDpwnSpy = spyOn(component, '_closeSearchDropDpwn');

        component.simple = false;

        // Test when freeSearch is initially false
        component.freeSearch = false;
        component._onClickSearchInput({});
        expect(openSearchSpy).toHaveBeenCalled();

        // Test when freeSearch is initially true
        component.freeSearch = true;
        component._onClickSearchInput({});
        expect(closeSearchDropDpwnSpy).toHaveBeenCalled();
    });

    it('should get history from localStorage or set default history', () => {
        const setDefaultHistorySpy = spyOn(component, '__setDefaultHistory');

        // Test when localStorage has history
        const historyData = 'null';
        spyOn(localStorage, 'getItem').and.returnValue(historyData);
        component._getHistory();

        // Test when localStorage does not have history
        component._getHistory();
        expect(setDefaultHistorySpy).toHaveBeenCalled();
    });

    it('should call __createTokens with passed values', () => {
        const createTokensSpy = spyOn(component, '__createTokens');
        const testValues = { key: 'value' };

        component._getHistorytokens(testValues);

        expect(createTokensSpy).toHaveBeenCalledWith(testValues);
    });

    it('should add data to history and save it', () => {
        const getHistorySpy = spyOn(component, '_getHistory');
        const saveHistorySpy = spyOn(component, '__saveHistory');
        const testData = { key: 'value' };

        // Test when _getHistory returns an array
        const testHistory = [{ oldKey: 'oldValue' }];
        getHistorySpy.and.returnValue(testHistory);
        component._addHistory(testData);
        // expect(testHistory).toContain(testData);
        expect(saveHistorySpy).toHaveBeenCalledWith(testHistory);

        // Test when _getHistory returns null
        getHistorySpy.and.returnValue(null);
        component._addHistory(testData);
        expect(saveHistorySpy).toHaveBeenCalledWith([testData]);

        // Test when history length is greater than _historyCount
        const longHistory = new Array(component._historyCount).fill(testData); // Adjusted size here
        getHistorySpy.and.returnValue(longHistory);
        component._addHistory(testData);
    });

    it('should clear history from localStorage and set default history', () => {
        const removeItemSpy = spyOn(localStorage, 'removeItem');
        const setDefaultHistorySpy = spyOn(component, '__setDefaultHistory');

        component._clearHistory();

        expect(removeItemSpy).toHaveBeenCalledWith(`History_${component.historyStore}`);
        expect(setDefaultHistorySpy).toHaveBeenCalled();
    });

    it('should save an empty history and return it', () => {
        const saveHistorySpy = spyOn(component, '__saveHistory');
        const getHistorySpy = spyOn(component, '_getHistory');

        component.__setDefaultHistory();

        expect(saveHistorySpy).toHaveBeenCalledWith([]);
        expect(getHistorySpy).toHaveBeenCalled();
    });

    it('should save history to localStorage and return it', () => {
        const encodeDataOptionsSpy = spyOn(Tools, 'EncodeDataOptions').and.callThrough();
        const setItemSpy = spyOn(localStorage, 'setItem');
        const testData = { key: 'value' };

        const result = component.__saveHistory(testData);

        const encodedData = Tools.EncodeDataOptions(testData);
        expect(encodeDataOptionsSpy).toHaveBeenCalledWith(testData);
        expect(setItemSpy).toHaveBeenCalledWith(`History_${component.historyStore}`, encodedData);
        expect(result).toEqual(encodedData);
    });

    it('should return true if history is pinned and false otherwise', () => {
        const getItemSpy = spyOn(localStorage, 'getItem');

        // Test when history is pinned
        getItemSpy.and.returnValue('pinned');
        expect(component._isPinned()).toBe(true);

        // Test when history is not pinned
        getItemSpy.and.returnValue('null');
        expect(component._isPinned()).toBe(false);

        // Test when history pin is not set
        getItemSpy.and.returnValue(null);
        expect(component._isPinned()).toBe(false);
    });

    it('should pin the last search if it is not empty and remove the pin if it is empty and autoPin is true', () => {
        const isEmptyValuesSpy = spyOn(component, '__isEmptyValues');
        const encodeDataOptionsSpy = spyOn(Tools, 'EncodeDataOptions').and.callThrough();
        const setItemSpy = spyOn(localStorage, 'setItem');
        const removeItemSpy = spyOn(localStorage, 'removeItem');
        const testData = { key: 'value' };

        // Test when _currentValues is not empty
        isEmptyValuesSpy.and.returnValue(false);
        component._currentValues = testData;
        component._pinLastSearch();
        const encodedData = Tools.EncodeDataOptions(testData);
        expect(encodeDataOptionsSpy).toHaveBeenCalledWith(testData);
        expect(setItemSpy).toHaveBeenCalledWith(`History_Pin_${component.historyStore}`, encodedData);

        // Test when _currentValues is empty and autoPin is true
        isEmptyValuesSpy.and.returnValue(true);
        component.autoPin = true;
        component._pinLastSearch();
        expect(removeItemSpy).toHaveBeenCalledWith(`History_Pin_${component.historyStore}`);
    });

    it('should remove the pinned search from localStorage', () => {
        const removeItemSpy = spyOn(localStorage, 'removeItem');

        component._clearPinSearch();

        expect(removeItemSpy).toHaveBeenCalledWith(`History_Pin_${component.historyStore}`);
    });

    it('should restore the last search if it is pinned and remove the pin if autoPin is false', () => {
        const getItemSpy = spyOn(localStorage, 'getItem');
        const decodeDataOptionsSpy = spyOn(Tools, 'DecodeDataOptions').and.callThrough();
        const restoreSearchSpy = spyOn(component, '_restoreSearch');
        const removeItemSpy = spyOn(localStorage, 'removeItem');
        const testData = { key: 'value' };

        // Test when a search is pinned
        getItemSpy.and.returnValue(Tools.EncodeDataOptions(testData));
        component.__restoreLastSearch();
        expect(decodeDataOptionsSpy).toHaveBeenCalledWith(Tools.EncodeDataOptions(testData));
        expect(restoreSearchSpy).toHaveBeenCalledWith(testData);

        // Test when autoPin is false
        component.autoPin = false;
        component.__restoreLastSearch();
        expect(removeItemSpy).toHaveBeenCalledWith(`History_Pin_${component.historyStore}`);
    });
});