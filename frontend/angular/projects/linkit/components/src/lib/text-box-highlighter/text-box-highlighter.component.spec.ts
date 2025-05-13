import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextBoxHighlighterComponent } from './text-box-highlighter.component';

describe('TextBoxHighlighterComponent', () => {
    let component: TextBoxHighlighterComponent;
    let fixture: ComponentFixture<TextBoxHighlighterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TextBoxHighlighterComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TextBoxHighlighterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should decode text if isBase64 is true', () => {
        component.text = 'SGVsbG8gd29ybGQ='; // 'Hello world' in base64
        component.isBase64 = true;
        component.ngOnInit();
        expect(component._textDecoded).toEqual('Hello world');
    });

    it('should not decode text if isBase64 is false', () => {
        component.text = 'Hello world';
        component.isBase64 = false;
        component.ngOnInit();
        expect(component._textDecoded).toEqual('Hello world');
    });

    it('should highlight and create text rows if config is not empty', () => {
        component.text = 'Hello world';
        component.config = [{ position: '1-1-5', label: 'Hello', class: 'highlight', color: 'red' }];
        spyOn(component, '_highlightText');
        spyOn(component, '_createTextRows');
        component.ngOnInit();
        expect(component._highlightText).toHaveBeenCalled();
        expect(component._createTextRows).toHaveBeenCalled();
    });

    it('should not highlight and create text rows if config is empty', () => {
        component.text = 'Hello world';
        component.config = [];
        spyOn(component, '_highlightText');
        spyOn(component, '_createTextRows');
        component.ngOnInit();
        expect(component._highlightText).not.toHaveBeenCalled();
        expect(component._createTextRows).not.toHaveBeenCalled();
    });

    it('should highlight text based on config', () => {
        component.text = 'Hello world';
        component.config = [
            { position: '1-1-5', label: 'Hello', class: 'highlight', color: 'red' },
            { position: '1-7-12', label: 'world', class: 'highlight', color: 'blue' }
        ];
        const highlightedText = component._highlightText(component.text);
        const expectedText = '<span class="highlight-item highlight" style="color: red" title="Hello">Hello<span class="highlight-tooltip">Hello</span></span> <span class="highlight-item highlight" style="color: blue" title="world">world<span class="highlight-tooltip">world</span></span>';
        expect(highlightedText).toEqual(expectedText);
    });

    it('should create text rows based on config', () => {
        component.text = 'Hello\nworld';
        component.config = [
            { pr: '1-1-5', label: 'Hello', class: 'highlight', color: 'red' },
            { pr: '2-1-5', label: 'world', class: 'highlight', color: 'blue' }
        ];
        component._createTextRows(component.text);
        const expectedItemList = [
            [
                { row: 0, content: '', type: 'text' },
                { row: 0, content: 'Hello', type: 'highlight', option: component.config[0] },
                { row: 0, content: '', type: 'text' }
            ],
            [
                { row: 1, content: '', type: 'text' },
                { row: 1, content: 'world', type: 'highlight', option: component.config[1] },
                { row: 1, content: '', type: 'text' }
            ]
        ];
        const expectedDisplayRows = [
            '<span class="highlight-item highlight" style="color: red" data-bs-toggle="tooltip" data-bs-placement="top" title="Hello">Hello<span class="highlight-tooltip">Hello</span></span>',
            '<span class="highlight-item highlight" style="color: blue" data-bs-toggle="tooltip" data-bs-placement="top" title="world">world<span class="highlight-tooltip">world</span></span>'
        ];
        expect(component._itemList).toEqual(expectedItemList);
        expect(component._displayRows).toEqual(expectedDisplayRows);
    });

    it('should decode base64 string', () => {
        const base64String = btoa(encodeURIComponent('Hello world'));
        const decodedString = component._decodeB64(base64String);
        expect(decodedString).toEqual('Hello%20world');
    });

    it('should return empty string for incorrect format', () => {
        spyOn(console, 'log');
        const incorrectFormatString = 'incorrect format';
        const decodedString = component._decodeB64(incorrectFormatString);
        expect(decodedString).toEqual('');
        expect(console.log).toHaveBeenCalledWith('Formato non corretto');
    });
});