import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, AfterViewInit } from '@angular/core';

@Component({
  selector: 'ui-data-collapse',
  template: `
    <div class="{{ _id }} {{ _class }}" [class.expanded]="_opened">
      <div class="w-100">
        <button type="button" class="btn gl-button btn-default js-settings-toggle button-action" (click)="_toggle()">
          <span *ngIf="!_opened">{{ _titleOpen | translate }} <i class="bi bi-chevron-down ms-1"></i></span>
          <span *ngIf="_opened">{{ _titleClose | translate }} <i class="bi bi-chevron-up ms-1"></i></span>
        </button>
      </div>
      <div [attr.id]="_id" class="collapse mt-1" [class.show]="_opened">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class DataCollapseComponent implements OnInit, AfterViewInit, OnChanges {

  @Input('id') _id: string = '';
  @Input('titleOpen') _titleOpen: string = '';
  @Input('titleClose') _titleClose: string = '';
  @Input('opened') _opened: boolean = false;
  @Input('class') _class: string = '';

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
