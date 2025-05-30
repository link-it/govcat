import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InputHelpComponent } from "./input-help.component";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslateService } from "@ngx-translate/core";

describe('InputHelpComponent', () => {
    let component: InputHelpComponent;
    let fixture: ComponentFixture<InputHelpComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [InputHelpComponent],
            providers: [
                { provide: DomSanitizer, useValue: { bypassSecurityTrustHtml: (html: string) => html } },
                { provide: TranslateService, useValue: { instant: (key: string) => key } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InputHelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set _text and _existsValue', () => {
        component.field = 'field';
        component.context = 'context';
        component.params = { param: 'value' };
        component.ngOnChanges({
            field: {
                currentValue: 'field', previousValue: 'some',
                firstChange: false,
                isFirstChange: function (): boolean {
                    throw new Error("Function not implemented.");
                }
            }
        });
        expect(component._text).toBe('APP.LABEL_HELP.context.field');
        expect(component._existsValue).toBe(false);
    });
});