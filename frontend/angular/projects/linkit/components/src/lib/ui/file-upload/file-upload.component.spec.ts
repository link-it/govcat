import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadComponent } from './file-upload.component';
import { ComponentsModule } from '../../components.module';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ComponentsModule],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should write value', () => {
    component.writeValue(null);
    expect(component.file).toBeNull();
  });

  it('should register on change', () => {
    const fn = () => {};
    component.registerOnChange(fn);
    expect(component.onChange).toEqual(fn);
  });

  it('should register on touched', () => {
    const fn = () => {};
    component.registerOnTouched(fn);
    expect(component.onTouched).toEqual(fn);
  });

  it('should emit files', () => {
    const fn = () => {};
    component.registerOnChange(fn);
    const file = new File([''], 'test.txt');
    const event = {
      item: () => file
    } as any;
    component.emitFiles(event);
    expect(component.file).toEqual(file);
  });
});
