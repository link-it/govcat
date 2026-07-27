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
import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, Optional, Self } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

/**
 * Espone lo stato di accessibilità dei ng-select sull'input interno (role="combobox"),
 * che altrimenti non riceve aria-required/aria-invalid/aria-describedby.
 * Si applica automaticamente a ogni <ng-select> nei componenti che importano le direttive condivise.
 */
@Directive({
  selector: 'ng-select',
  standalone: true
})
export class NgSelectAriaDirective implements AfterViewInit, OnDestroy {

  /** id opzionale dell'elemento che contiene il messaggio d'errore (per aria-describedby). */
  @Input() errorId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() private ngControl: NgControl | null
  ) {}

  ngAfterViewInit(): void {
    const control = this.ngControl?.control;
    if (!control) {
      return;
    }
    // `events` emette anche i cambi di touched/pristine (non solo di validità/valore).
    control.events
      ?.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateAria());
    this.updateAria();
  }

  @HostListener('focusout')
  onFocusOut(): void {
    this.updateAria();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get comboboxInput(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('input[role="combobox"]');
  }

  private updateAria(): void {
    const input = this.comboboxInput;
    const control = this.ngControl?.control;
    if (!input || !control) {
      return;
    }
    const required = control.hasValidator(Validators.required);
    this.toggle(input, 'aria-required', required ? 'true' : null);

    const invalid = control.invalid && control.touched;
    this.toggle(input, 'aria-invalid', invalid ? 'true' : null);
    this.toggle(input, 'aria-describedby', invalid && this.errorId ? this.errorId : null);
  }

  private toggle(el: HTMLElement, attr: string, value: string | null): void {
    if (value === null) {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, value);
    }
  }
}
