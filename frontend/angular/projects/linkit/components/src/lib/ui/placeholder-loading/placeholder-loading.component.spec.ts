import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ComponentsModule } from "../../components.module";
import { PlaceholderLoadingComponent } from "./placeholder-loading.component";

describe('PlaceholderLoadingComponent', () => {
    let component: PlaceholderLoadingComponent;
    let fixture: ComponentFixture<PlaceholderLoadingComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ComponentsModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlaceholderLoadingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set type', () => {
        const value = 'card';
        component.type = value;
        expect(component.type).toBe(value);
    });

    it('should set count', () => {
        const value = 5;
        component.count = value;
        expect(component.count).toBe(value);
    });

    it('should set col', () => {
        const value = 5;
        component.col = value;
        expect(component.col).toBe(value);
    });

    it('should set title', () => {
        const value = 'title';
        component.title = value;
        expect(component.title).toBe(value);
    });

    it('should set icon', () => {
        const value = 'icon';
        component.icon = value;
        expect(component.icon).toBe(value);
    });

    it('should set rounded', () => {
        const value = true;
        component.rounded = value;
        expect(component.rounded).toBe(value);
    });

    it('should set range_arr when count changes', () => {
        const changes = {
            count: {
                currentValue: 5,
            },
        };
        component.ngOnChanges(changes as any);
        expect(component.range_arr).toEqual([1, 2, 3, 4, 5]);
    });
});