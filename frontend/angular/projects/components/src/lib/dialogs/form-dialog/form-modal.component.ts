import { AfterViewInit, Component, ComponentRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-modal',
  template: `
    <form [formGroup]="formGroup">
      <ng-content></ng-content>
    </form>
    <ui-fab-extended [valid]="formGroup.valid" (submit)="_onSubmitModal()"
                      [submitIcon]="submitIcon" [submitLabel]="submitLabel">
    </ui-fab-extended>
  `,
  styles: [`
    link-fab-extended {
      position: fixed;
      right: 3rem;
      bottom: 3rem;
      z-index: 1;
    }
  `]
})
export class FormModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() element: ComponentRef<any>;

  @Input() formGroup: UntypedFormGroup = new UntypedFormGroup({});
  @Input() data: any = null;
  @Input() callback: (json: any, formGroup: any) => {};
  @Input() submitLabel: string = 'Salva';
  @Input() submitIcon: string = 'save';

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this.formGroup) {
      this.formGroup.reset();
    }
  }

  _onSubmitModal() {
    const json: any = this.formGroup.getRawValue();
    if (this.callback && json) {
      this.callback(json, this.formGroup);
    }
  }

}
