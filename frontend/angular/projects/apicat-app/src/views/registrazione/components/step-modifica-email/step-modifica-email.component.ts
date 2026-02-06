import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-step-modifica-email',
  templateUrl: './step-modifica-email.component.html',
  standalone: false
})
export class StepModificaEmailComponent implements OnInit {

  @Input() emailCorrente: string = '';

  @Output() inviaEmail = new EventEmitter<string>();
  @Output() annulla = new EventEmitter<void>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      confermaEmail: ['', [Validators.required, Validators.email]]
    }, {
      validators: this.emailMatchValidator
    });
  }

  emailMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const email = group.get('email')?.value;
    const confermaEmail = group.get('confermaEmail')?.value;
    if (email && confermaEmail && email !== confermaEmail) {
      return { emailMismatch: true };
    }
    return null;
  }

  onInvia(): void {
    if (this.form.valid) {
      this.inviaEmail.emit(this.form.get('email')?.value);
    }
  }

  onAnnulla(): void {
    this.annulla.emit();
  }

  get emailControl() {
    return this.form.get('email');
  }

  get confermaEmailControl() {
    return this.form.get('confermaEmail');
  }
}
