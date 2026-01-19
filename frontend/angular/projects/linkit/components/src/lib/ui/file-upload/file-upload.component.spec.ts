/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
