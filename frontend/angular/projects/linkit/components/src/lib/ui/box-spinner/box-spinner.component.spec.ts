import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BoxSpinnerComponent } from "./box-spinner.component";
import { Subscription } from "rxjs";
import { Tools } from "../../services";

describe('BoxSpinnerComponent', () => {
    let component: BoxSpinnerComponent;
    let fixture: ComponentFixture<BoxSpinnerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BoxSpinnerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BoxSpinnerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should unsubscribe from all emergency calls and wait for response', () => {
        const subscription1 = new Subscription();
        const subscription2 = new Subscription();
        spyOn(subscription1, 'unsubscribe');
        spyOn(subscription2, 'unsubscribe');
        Tools.EmergencyCall = [subscription1, subscription2];
        spyOn(Tools, 'WaitForResponse');

        component._rescueCall();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
        expect(Tools.EmergencyCall).toEqual([]);
        expect(Tools.WaitForResponse).toHaveBeenCalledWith(false, true);
    });

});