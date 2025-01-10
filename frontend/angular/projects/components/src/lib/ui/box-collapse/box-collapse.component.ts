import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, AfterViewInit } from '@angular/core';

@Component({
  selector: 'ui-box-collapse',
  template: `
    <div class="settings {{ _id }} {{ _class }}" [class.expanded]="_opened">
      <div class="settings-header">
        <ng-container *ngIf="!_showCollapse">
          <h4 class="settings-title collapsed">{{ _title }}</h4>
        </ng-container>
        <ng-container *ngIf="_showCollapse">
          <h4 class="settings-title collapsed" data-bs-toggle="collapse" [attr.data-bs-target]="'#'+_id" (click)="_toggle()">{{ _title }}</h4>
          <button class="btn gl-button btn-default js-settings-toggle collapsed" type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#'+_id" (click)="_toggle()" *ngIf="_showCollapse">
            <span *ngIf="_opened">{{ 'APP.BUTTON.Collapse' | translate }}</span>
            <span *ngIf="!_opened">{{ 'APP.BUTTON.Expand' | translate }}</span>
          </button>
        </ng-container>
        <p markdown>{{ _subTitle }}</p>
      </div>
      <div [attr.id]="_id" class="settings-content collapse">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class BoxCollapseComponent implements OnInit, AfterViewInit, OnChanges {

  @Input('id') _id: string = '';
  @Input('title') _title: string = '';
  @Input('subTitle') _subTitle: string = '';
  @Input('opened') _opened: boolean = false;
  @Input('class') _class: string = '';
  @Input('showCollapse') _showCollapse: boolean = true;

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.opened) {
      this._opened = changes.opened.currentValue;
    }
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const elem = window.document.getElementById(this._id);
    if (elem && this._opened) {
      elem.classList.add('show');
    }
  }

  _toggle() {
    this._opened = !this._opened;
  }
}
