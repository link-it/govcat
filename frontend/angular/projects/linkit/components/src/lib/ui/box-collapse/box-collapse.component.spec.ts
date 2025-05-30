import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SimpleChange } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

import { BoxCollapseComponent } from "./box-collapse.component";

describe('BoxCollapseComponent', () => {
    let component: BoxCollapseComponent;
    let fixture: ComponentFixture<BoxCollapseComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot()],
            declarations: [BoxCollapseComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(BoxCollapseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update _opened on ngOnChanges', () => {
        component.ngOnChanges({
            opened: new SimpleChange(null, true, true)
        });
        expect(component['_opened']).toBeTrue();
    });

    it('should add "show" class on ngAfterViewInit if _opened is true', () => {
        component['_id'] = 'test';
        const div = document.createElement('div');
        div.id = component['_id'];
        document.body.appendChild(div);
        component['_opened'] = true;
        component.ngAfterViewInit();
        expect(div.classList.contains('show')).toBeTrue();
        document.body.removeChild(div);
    });

    it('should not add "show" class on ngAfterViewInit if _opened is false', () => {
        const div = document.createElement('div');
        div.id = component['_id'];
        document.body.appendChild(div);
        component['_opened'] = false;
        component.ngAfterViewInit();
        expect(div.classList.contains('show')).toBeFalse();
        document.body.removeChild(div);
    });

    it('should toggle _opened on _toggle', () => {
        component['_opened'] = false;
        component['_toggle']();
        expect(component['_opened']).toBeTrue();
        component['_toggle']();
        expect(component['_opened']).toBeFalse();
    });
});