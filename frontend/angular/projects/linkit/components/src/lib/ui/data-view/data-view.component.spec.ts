import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { DataViewComponent } from "./data-view.component";
import { ComponentsModule } from '../../components.module';
import { TranslateModule } from "@ngx-translate/core";

describe('DataViewComponent', () => {
    let component: DataViewComponent;
    let fixture: ComponentFixture<DataViewComponent>;
    let details = [{
        foo: 'bar'
    }];

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ComponentsModule],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DataViewComponent);
        component = fixture.componentInstance;
        component._config = { details: details };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit on download click', () => {
        spyOn(component.downloadClick, 'emit');
        component.__downloadClick('test');
        expect(component.downloadClick.emit).toHaveBeenCalled();
    });

    it('should show empty', () => {
        component._data = { test: null };
        const field = { field: 'test', hideEmpty: true };
        const result = component._showEmpty(field);
        expect(result).toBeFalse();
    });

    it('should toggle accordion', () => {
        component._accordionOpen = false;
        component.onShowHideAccordion();
        expect(component._accordionOpen).toBeTrue();
    });

    it('should get background', () => {
        const boxOptions = { background: '#fff' };
        const result = component._getBackground(boxOptions);
        expect(result).toEqual('#fff');

        const boxOptions2 = { background: { field: 'test', options: 'test' } };

        component._config = {
            options: {
                test: {
                    values: {
                        test: {
                            background: '#fff',
                            color: '#000'
                        }
                    }
                }
            }
        };
        component._data = { source: { test: 'test' } };
        const result2 = component._getBackground(boxOptions2);
        expect(result2).toEqual('#fff');
    });

    it('should get color', () => {
        const boxOptions = { color: '#fff' };
        const result = component._getColor(boxOptions);
        expect(result).toEqual('#fff');

        const boxOptions2 = { background: { field: 'test', options: 'test' } };

        component._config = {
            options: {
                test: {
                    values: {
                        test: {
                            background: '#fff',
                            color: '#000'
                        }
                    }
                }
            }
        };

        component._data = { source: { test: 'test' } };
        const result2 = component._getColor(boxOptions2);
        expect(result2).toEqual('#000');
    });
});