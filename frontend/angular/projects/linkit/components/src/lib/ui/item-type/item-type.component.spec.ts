import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ItemTypeComponent } from "./item-type.component";
import { ComponentsModule } from "../../components.module";
import { TranslateModule } from "@ngx-translate/core";
import moment from "moment";

describe('ItemTypeComponent', () => {
    let component: any;
    let fixture: ComponentFixture<ItemTypeComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule, TranslateModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ItemTypeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return _elem.emptySpace when emptySpace getter is called', () => {
        component._elem = { emptySpace: true };
        expect(component.emptySpace).toEqual(true);
    });

    it('should return _elem.blockSpace when blockSpace getter is called', () => {
        component._elem = { blockSpace: true };
        expect(component.blockSpace).toEqual(true);
    });

    it('should format _value as date when elem.type is date', () => {
        component._elem = { type: 'date', field: 'testField', format: 'DD/MM/YYYY' };
        component._data = { source: { testField: '2022-01-01T00:00:00Z' } };
        component.ngOnInit();
        expect(component._value).toEqual('01/01/2022');
    });

    it('should format _value as timeago when elem.type is timeago', () => {
        component._elem = { type: 'timeago', field: 'testField' };
        component._data = { source: { testField: moment().subtract(1, 'hours').toISOString() } };
        component.ngOnInit();
        expect(component._value).toEqual('an hour ago');
    });

    it('should format _value as mstime when elem.type is mstime', () => {
        component._elem = { type: 'mstime', field: 'testField' };
        component._data = { source: { testField: 3600000 } }; // 1 hour in milliseconds
        component.ngOnInit();
        expect(component._value).toEqual('1 h 0 ms');
    });

    it('should format _value as status when elem.type is status', () => {
        component._config = {
            options: {
                statusLabel: 'Status',
                status: { active: { background: '#1f1f1f', border: '#1f1f1f', color: '#fff' } },
                statusSmall: false,
                active: { values: { active: { label: 'Active' } } } // include values here
            }
        };
        component._elem = { type: 'status', field: 'testField', options: 'active' };
        component._data = { source: { testField: 'active' } };
        component.ngOnInit();
        expect(component._value).toEqual('Active');
    });

    it('should format _value as label when elem.type is label', () => {
        component._config = {
            options: {
                active: {
                    label: 'Active Label',
                    small: false,
                    values: {
                        active: { label: 'Active', background: '#1f1f1f', border: '#1f1f1f', color: '#fff' },
                        default: { background: '#1f1f1f', border: '#1f1f1f', color: '#fff' }
                    }
                }
            }
        };
        component._elem = { type: 'label', field: 'testField', options: 'active' };
        component._data = { source: { testField: 'active' } };
        component.ngOnInit();
        expect(component._value).toEqual('Active');
    });

    it('should use default values when _origValue is not defined in options', () => {
        component._config = {
            options: {
                active: {
                    label: 'Active Label',
                    small: false,
                    values: {
                        default: { label: 'Default', background: '#1f1f1f', border: '#1f1f1f', color: '#fff' }
                    }
                }
            }
        };
        component._elem = { type: 'label', field: 'testField', options: 'active' };
        component._data = { source: { testField: 'nonexistent' } }; // _origValue will be 'nonexistent', which is not defined in options
        component.ngOnInit();
        expect(component._background).toEqual('#1f1f1f');
        expect(component._border).toEqual('#1f1f1f');
        expect(component._color).toEqual('#fff');
    });

    it('should format _value as tag when elem.type is tag', () => {
        component._config = {
            options: {
                active: {
                    small: false,
                    values: {
                        active: { label: 'Active', background: '#1f1f1f', border: '#1f1f1f', color: '#fff' },
                        default: { background: '#1f1f1f', border: '#1f1f1f', color: '#fff' }
                    }
                }
            }
        };
        component._elem = { type: 'tag', field: 'testField', options: 'active', class: 'testClass' };
        component._data = { source: { testField: 'active' } };
        component.ngOnInit();
        expect(component._value).toEqual('Active');
        expect(component._background).toEqual('#1f1f1f');
        expect(component._border).toEqual('#1f1f1f');
        expect(component._color).toEqual('#fff');
        expect(component._class).toEqual('badge badge-pill testClass gl-badge');
    });

    it('should format _value as labelI18n when elem.type is labelI18n', () => {
        component._config = {
            options: {
                active: {
                    values: {
                        active: { label: 'Active' },
                        default: { label: 'Default' }
                    }
                }
            }
        };
        component._elem = { type: 'labelI18n', field: 'testField', options: 'active', appendValue: 'appendField' };
        component._data = { source: { testField: 'active', appendField: 'Appended' } };
        component.ngOnInit();
        expect(component._value).toEqual('Active');
        expect(component._appendOriginalValue).toEqual('Appended');
    });

    it('should set _tooltip when elem.type is image and elem.tooltip is defined', () => {
        component._elem = { type: 'image', tooltip: 'tooltipField' };
        component._data = { source: { tooltipField: 'Tooltip Text' } };
        component.ngOnInit();
        expect(component._tooltip).toEqual('Tooltip Text');
    });

    it('should set _tooltip when elem.type is avatar and elem.tooltip is defined', () => {
        component._elem = { type: 'avatar', tooltip: 'tooltipField' };
        component._data = { source: { tooltipField: 'Tooltip Text' } };
        component.ngOnInit();
        expect(component._tooltip).toEqual('Tooltip Text');
    });

    it('should set _tooltip when elem.type is avatar-image and elem.tooltip is defined', () => {
        component._elem = { type: 'avatar-image', tooltip: 'tooltipField' };
        component._data = { source: { tooltipField: 'Tooltip Text' } };
        component.ngOnInit();
        expect(component._tooltip).toEqual('Tooltip Text');
    });

    it('should set _tooltip when elem.type is gravatar-image and elem.tooltip is defined', () => {
        component._elem = { type: 'gravatar-image', tooltip: 'tooltipField' };
        component._data = { source: { tooltipField: 'Tooltip Text' } };
        component.ngOnInit();
        expect(component._tooltip).toEqual('Tooltip Text');
    });

    it('should truncate _value when elem.type is text and elem.truncate is defined', () => {
        component._elem = { type: 'text', truncate: 10, field: 'testField' };
        component._value = 'This is a long text that should be truncated';
        component._data = { source: { testField: 'This is a long text that should be truncated' } };
        component.ngOnInit();
        expect(component._value).toEqual('This is a...');
    });

    it('should set _tooltip to time format when elem.type is mstime and elem.tooltip is defined', () => {
        component._elem = { type: 'mstime', tooltip: 'tooltipField' };
        component._data = { source: { tooltipField: 60000 } }; // 1 minute in milliseconds
        component.ngOnInit();
        expect(component._tooltip).toEqual('1 m 0 ms');
    });

    it('should set _value, _class, and _tooltip when elem.type is icon and config.options is defined', () => {
        const mockTranslate = jasmine.createSpyObj('TranslateService', ['instant']);
        mockTranslate.instant.and.callFake((arg: any) => arg);
        component.translate = mockTranslate;

        component._data = {
            source: {
                value1: {
                    icon: 'icon1',
                    tooltip: 'tooltip1',
                    tooltipPlacement: 'top',
                    tooltip2: 'tooltip2'
                }
            }
        };
        component._elem = { type: 'icon', options: 'value1', class: 'class1' };
        component._value = 'value1';
        component._config = {
            options: {
                value1: {
                    values: component._data.source
                }
            }
        };

        component.ngOnInit();

        expect(component._class).toEqual('class1');
        expect(component._tooltipPlacement).toEqual('top');
    });

    it('should truncate text by rows when text contains line breaks', () => {
  const text = 'line1\nline2\nline3';
  const result = component.truncateRows(text, 2);
  expect(result).toEqual('line1\nline2...');
});

it('should truncate text by maxchars when text length exceeds maxchars', () => {
  const text = 'a'.repeat(161);
  const result = component.truncateRows(text, 2, 160);
  expect(result).toEqual('a'.repeat(160) + '...');
});

it('should truncate text by rows when number of lines exceeds rows', () => {
  const text = 'line1\nline2\nline3';
  const result = component.truncateRows(text, 1, 160);
  expect(result).toEqual('line1...');
});

it('should return original text when text length does not exceed maxchars and number of lines does not exceed rows', () => {
  const text = 'line1\nline2';
  const result = component.truncateRows(text, 2, 160);
  expect(result).toEqual(text);
});

    it('should set event.target.src to default avatar image when onAvatarError is called', () => {
        const event = { target: { src: 'initial-src' } };
        component.onAvatarError(event);
        expect(event.target.src).toEqual('./assets/images/avatar.png');
    });
});