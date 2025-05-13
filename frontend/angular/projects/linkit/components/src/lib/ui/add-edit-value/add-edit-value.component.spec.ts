import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AddEditValueComponent } from "./add-edit-value.component";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

describe('AddEditValueComponent', () => {
    let component: AddEditValueComponent;
    let fixture: ComponentFixture<AddEditValueComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormsModule, TranslateModule.forRoot()],
            declarations: [AddEditValueComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AddEditValueComponent);
        component = fixture.componentInstance;

        component._value = 'test';
        component._placehoder = 'test';

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit save event on _save', () => {
        spyOn(component.save, 'emit');
        component._save();
        expect(component.save.emit).toHaveBeenCalled();
    });
});