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
import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, merge } from 'rxjs';

@Directive({
  selector: '[appMarkAsterisk]',
  standalone: false

})
export class MarkAsteriskDirective implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;
  @Input() useOptional: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private elementRef: ElementRef) {
  }

  ngOnInit(): void {
    const control = this.formGroup.get(this.controlName);
    if(!control){
      console.warn(`FormControl with name ${this.controlName} does not exist in FormGroup`);
      return;
    }
    // Ascolta sia valueChanges che statusChanges per rilevare quando cambiano i validatori
    merge(control.valueChanges, control.statusChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(_ => this.checkAsterisk(control));
    this.checkAsterisk(control);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
