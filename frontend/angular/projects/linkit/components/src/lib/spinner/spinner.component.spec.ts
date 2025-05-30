import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { SpinnerComponent } from './spinner.component';
import { Tools } from '../services';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinnerComponent ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should unsubscribe from all emergency calls and reset them', () => {
    const subscription1 = new Subscription();
    const subscription2 = new Subscription();
    spyOn(subscription1, 'unsubscribe');
    spyOn(subscription2, 'unsubscribe');
    Tools.EmergencyCall = [subscription1, subscription2];
    component._rescueCall();
    expect(subscription1.unsubscribe).toHaveBeenCalled();
    expect(subscription2.unsubscribe).toHaveBeenCalled();
    expect(Tools.EmergencyCall.length).toEqual(0);
  });

  it('should call WaitForResponse with false and true', () => {
    spyOn(Tools, 'WaitForResponse');
    component._rescueCall();
    expect(Tools.WaitForResponse).toHaveBeenCalledWith(false, true);
  });
});