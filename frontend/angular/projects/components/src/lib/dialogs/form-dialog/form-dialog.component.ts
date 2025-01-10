import { Component, ComponentFactoryResolver, Inject, Injector, AfterViewInit, ViewChild, ViewContainerRef, ComponentRef } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-form-dialog',
  template: `
    <div class="d-flex align-items-center mb-5">
      <h1 class="mb-0 me-3 text-break">{{ dialogData.title }}</h1>
    </div>
    <form [formGroup]="dialogData.formGroup">
      <mat-dialog-content class="py-2">
        <div class="container px-0">
          <div class="row">
            <div class="col-12">
              <ng-container #fdc></ng-container>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      <div class="d-block form-actions text-right">
        <button mat-button color="accent" type="button" (click)="_closeDialog(false)">{{ dialogData.NOLabel }}</button>
        <button mat-button color="accent" type="button" [disabled]="!dialogData.formGroup.valid" *ngIf="dialogData.formGroup.valid"
                (click)="_closeDialog(true)">{{ dialogData.YESLabel }}</button>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }

    .mr-n {
      margin-right: -12px;
    }
  `]
})
export class FormDialogComponent implements AfterViewInit {

  @ViewChild('fdc', { read: ViewContainerRef, static: false }) _fdc!: ViewContainerRef;

  element!: ComponentRef<any>;
  dialogData: any = {
    formGroup: new UntypedFormGroup({}),
    data: null,
    callback: null,
    type: null,
    title: 'Modifica',
    YESLabel: 'Conferma',
    NOLabel: 'Annulla'
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
              public dialog: MatDialogRef<FormDialogComponent>,
              private cfr: ComponentFactoryResolver,
              private inj: Injector) {
    this.dialogData = { ...this.dialogData, ...data };
  }

  ngAfterViewInit() {
    this._fdc.clear();
    if (this.dialogData.type) {
      const factoryElement = this.cfr.resolveComponentFactory(this.dialogData.type);
      setTimeout(() => {
        this.element = this._fdc.createComponent(factoryElement, undefined, this.inj);
        this.dialogData.formGroup = this.element.instance.formGroup;
        if (!this.dialogData.callback) {
          this.dialogData.callback = (this.element.instance.callback || null);
        }
        if (this.dialogData.data && this.element.instance.hasOwnProperty('data')) {
          this.element.instance.data = this.dialogData.data;
        }
      });
    }
  }

  _closeDialog(procedi: boolean) {
    const json: any = (procedi)?this.dialogData.formGroup.getRawValue():null;
    if (this.dialogData.callback && json) {
      this.dialogData.callback(json);
    }
    if (!this.dialogData.callback || !procedi) {
      this.dialog.close({ type: 'FormDialogComponent', response: json });
    }
  }
}
