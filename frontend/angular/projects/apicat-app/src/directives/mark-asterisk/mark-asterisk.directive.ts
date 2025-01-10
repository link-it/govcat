import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';

@Directive({
  selector: '[appMarkAsterisk]'
})
export class MarkAsteriskDirective implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;

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
      this.elementRef.nativeElement.innerHTML = '*';
    }else{
      this.elementRef.nativeElement.innerHTML = '';
    }
  }
}
