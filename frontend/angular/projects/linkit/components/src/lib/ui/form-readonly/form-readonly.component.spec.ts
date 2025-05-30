import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomSanitizer } from "@angular/platform-browser";

import { FormReadonlyComponent } from "./form-readonly.component";

describe('FormReadonlyComponent', () => {
    let component: FormReadonlyComponent;
    let fixture: ComponentFixture<FormReadonlyComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [FormReadonlyComponent],
            providers: [
                { provide: DomSanitizer, useValue: { bypassSecurityTrustHtml: (html: string) => html } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FormReadonlyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit downloadClick event with correct item', () => {
        const item = { id: 1, name: 'Test' };
        spyOn(component.downloadClick, 'emit');

        component.__downloadClick(item);

        expect(component.downloadClick.emit).toHaveBeenCalledWith({ item });
    });
});
