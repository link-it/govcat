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
import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';

@Directive({
  selector: '[appMarkAsterisk]',
  standalone: false

})
export class MarkAsteriskDirective implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;
  @Input() useOptional: boolean = false;

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit(): void {
    const control = this.formGroup.get(this.controlName);
    if(!control){
      console.warn(`FormControl with name ${this.controlName} does not exist in FormGroup`);
      return;
    }
    control.valueChanges.subscribe(_ => this.checkAsterisk(control));
    this.checkAsterisk(control);
  }

  private checkAsterisk(control: AbstractControl){
    const isRequired = control.hasValidator(Validators.required);
    if (isRequired) {
      this.elementRef.nativeElement.innerHTML = this.useOptional ? '' : '*';
    }else{
      this.elementRef.nativeElement.innerHTML = this.useOptional ? '(optional)' : '';
    }
  }
}
