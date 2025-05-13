import { ChangeDetectorRef, Component, EventEmitter, HostBinding, Input, OnInit, Optional, Output, ViewChild } from '@angular/core';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { MatCheckbox } from '@angular/material/checkbox';
import { animate, AUTO_STYLE, group, state, style, transition, trigger } from '@angular/animations';

import { EditColor } from '../classes/definitions';

@Component({
    selector: 'ui-collapse-item',
    templateUrl: './collapse-item.component.html',
    styleUrls: [
        './collapse-item.component.scss'
    ],
    animations: [
        trigger('transition', [
            state('false', style({ height: '0', opacity: 0 })),
            state('true', style({ height: AUTO_STYLE, opacity: 1 })),
            transition('false => true', [
                group([
                    animate('.250s .15s linear', style({ opacity: 1 })),
                    animate('.250s linear', style({ height: AUTO_STYLE }))
                ])
            ]),
            transition('true => false', [
                group([
                    animate('.250s linear', style({ opacity: 0 })),
                    animate('.250s .15s linear', style({ height: 0 }))
                ])
            ])
        ])
    ],
    standalone: false
})
export class CollapseItemComponent extends CdkAccordionItem implements OnInit {
  get show(): boolean {
    return this._show;
  }
  @Input('show') set show(value: boolean) {
    this._show = value;
    this.expanded = value;
  }
  @HostBinding('class.no-feedback') get noFeedbackClass(): boolean {
    return !this.hoverFeedback;
  }
  @HostBinding('class.transition') get transitionState(): boolean {
    return this._transition;
  }
  @ViewChild('cb') _selector!: MatCheckbox;

  private _show: boolean = false;
  private _transition: boolean = false;
  @Input('primaryText') _primaryText: string = '';
  @Input('secondaryText') _secondaryText: string = '';
  @Input('metadata') _metadata: string = '';
  @Input('secondaryMetadata') _secondaryMetadata: string = '';
  @Input('secondaryFeedback') _secondaryFeedback: string = 'transparent';
  @Input('secondaryTextColor') _secondaryTextColor: string = 'inherit';
  @Input('action') _action: string = '';
  @Input('checkDisabled') _checkDisabled: boolean = false;
  @Input('editMode') _editMode: boolean = false;
  @Input('actionBackgroundColor') _actionBackgroundColor: string = '';
  @Input('actionHoverColor') _actionHoverColor: string = '';
  @Input('checkboxColor') _checkboxColor!: EditColor;
  @Input() actionDisabled: boolean = false;
  @Input() enableCollapse: boolean = false;
  @Input() hoverFeedback: boolean = true;

  @Output() editSelection: EventEmitter<any> = new EventEmitter();
  @Output() simpleActionClick: EventEmitter<any> = new EventEmitter();
  @Output() swipeEvent: EventEmitter<any> = new EventEmitter();

  readonly keepTextFormat: boolean = false;
  __ripple: string = 'rgba(0,0,0,.05)';
  __hasGesture: boolean = false;
  __gestureDetect: boolean = false;
  __swipeCoord!: [number, number];
  __swipeTime!: number;

  constructor(@Optional() accordion: CdkAccordion, _changeDetectorRef: ChangeDetectorRef, _expansionDispatcher: UniqueSelectionDispatcher) {
    super(accordion, _changeDetectorRef, _expansionDispatcher);
  }

  ngOnInit() {
    this.__hasGesture = this.__hasTouchEvent();
  }

  __toggle(event: any, activeItem: any) {
    if (this.enableCollapse && !this.__gestureDetect) {
      this.toggle();
    } else {
      event.stopImmediatePropagation();
      event.preventDefault();
      this.__gestureDetect = false;
      if (activeItem.classList.contains('swipe')) {
        activeItem.classList.remove('swipe');
      }
    }
  }

  __change(event: any) {
    this.editSelection.emit({ selected: event.checked });
  }

  __hasTouchEvent(): boolean {
    return 'ontouchstart' in document.documentElement;
  }

  __simpleActionClick(event: any, type: string) {
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

  __swipe(event: any, status: string): void {
    if (this.__hasGesture && this._action) {
      const coord: [number, number] = [event.changedTouches[0].clientX, event.changedTouches[0].clientY];
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

  __startTransition(event: any) {
    if (!event.fromState && event.toState) {
      this._transition = true;
    }
  }

  __endTransition(event: any) {
    if (event.fromState && !event.toState) {
      this._transition = false;
    }
  }

  public getItemSelection(): boolean {
    if (this._selector) {
      return this._selector.checked;
    }

    return false;
  }
}
