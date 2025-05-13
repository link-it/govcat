import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { EditColor } from '../classes/definitions';

@Component({
    selector: 'ui-simple-item',
    templateUrl: './simple-item.component.html',
    styleUrls: [
        './simple-item.component.scss'
    ],
    standalone: false
})
export class SimpleItemComponent implements OnInit {
  @HostBinding('class.notify') get notifyClass(): boolean {
    return this.notify;
  }
  @HostBinding('class.no-feedback') get noFeedbackClass(): boolean {
    return !this.hoverFeedback || this.__gestureDetect;
  }

  @Input('primaryText') _primaryText: string = '';
  @Input('secondaryText') _secondaryText: string = '';
  @Input('metadata') _metadata: string = '';
  @Input('secondaryMetadata') _secondaryMetadata: string = '';
  @Input('action') _action: boolean = false;
  @Input('checkDisabled') _checkDisabled: boolean = false;
  @Input('editMode') _editMode: boolean = false;
  @Input('secondaryFeedback') _secondaryFeedback: string = 'transparent';
  @Input('secondaryTextColor') _secondaryTextColor: string = 'inherit';
  @Input('actionBackgroundColor') _actionBackgroundColor: string = '';
  @Input('actionHoverColor') _actionHoverColor: string = '';
  @Input('checkboxColor') _checkboxColor!: EditColor;
  @Input() actionDisabled: boolean = false;
  @Input() notify: boolean = false;
  @Input() hoverFeedback: boolean = true;
  @Input() hasLink: boolean = false;

  @Output() editSelection: EventEmitter<any> = new EventEmitter();
  @Output() simpleClick: EventEmitter<any> = new EventEmitter();
  @Output() simpleActionClick: EventEmitter<any> = new EventEmitter();
  @Output() swipeEvent: EventEmitter<any> = new EventEmitter();

  readonly keepTextFormat: boolean = false;
  __ripple: string = 'rgba(0,0,0,.05)';
  __hasGesture: boolean = false;
  __gestureDetect: boolean = false;
  __swipeCoord!: [ number, number ];
  __swipeTime!: number;

  ngOnInit() {
    this.__hasGesture = this.__hasTouchEvent();
  }

  __change(event: any) {
    this.editSelection.emit({ selected: event.checked, notify: this.notify });
  }

  __simpleClick(event: any, activeItem: any) {
    if (!this.__gestureDetect) {
      this.simpleClick.emit(event);
    } else {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.__gestureDetect = false;
      if (activeItem.classList.contains('swipe')) {
        activeItem.classList.remove('swipe');
      }
    }
  }

  __simpleActionClick(event: any, type: any) {
    if (!this.actionDisabled) {
      this.simpleActionClick.emit({ event, type });
    } else {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  __setClass() {
    return {
      'd-flex': true,
      'flex-shrink-0': true,
      'align-self-stretch': true,
      'align-items-center': true,
      draggable: this.__hasGesture,
      action: true,
      disabled: this.actionDisabled
    };
  }

  __hasTouchEvent(): boolean {
    return 'ontouchstart' in document.documentElement;
  }

  __swipe(event: any, status: string): void {
    if (this.__hasGesture && this._action) {
      const coord: [ number, number ] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
      const time = new Date().getTime();

      if (status === 'start') {
        this.__swipeCoord = coord;
        this.__swipeTime = time;
      } else if (status === 'end') {
        const direction = [coord[0] - this.__swipeCoord[0], coord[1] - this.__swipeCoord[1]];
        const duration = time - this.__swipeTime;
        if (duration < 1000 && Math.abs(direction[0]) > 30 && Math.abs(direction[0]) > Math.abs(direction[1] * 3)) {
          const swipe = direction[0] < 0 ? 'left' : 'right';
          if (swipe === 'left') {
            event.currentTarget.classList.add('swipe');
            this.__gestureDetect = true;
            this.swipeEvent.emit({ direction: swipe });
          }
        }
      }
    }
  }

}
