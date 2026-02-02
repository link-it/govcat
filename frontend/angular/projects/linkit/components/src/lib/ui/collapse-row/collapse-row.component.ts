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
import { ChangeDetectorRef, Component, EventEmitter, HostBinding, Input, OnInit, Optional, Output } from '@angular/core';
import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { UniqueSelectionDispatcher } from '@angular/cdk/collections';
import { animate, AUTO_STYLE, group, state, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'ui-collapse-row',
    templateUrl: './collapse-row.component.html',
    styleUrls: [
        './collapse-row.component.scss'
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
export class CollapseRowComponent extends CdkAccordionItem implements OnInit {
  get show(): boolean {
    return this._show;
  }
  @Input('show') set show(show: boolean) {
    if(!show) return;
    setTimeout(() => {
      this.toggle();
    });
  }
  @HostBinding('class.no-feedback') get noFeedbackClass(): boolean {
    return !this.hoverFeedback;
  }
  @HostBinding('class.transition') get transitionState(): boolean {
    return this._transition;
  }

  private _show: boolean = false;
  private _transition: boolean = false;
  @Input('data') _data: any = null;
  @Input('config') _config: any = null;
  @Input() actionDisabled: boolean = false;
  @Input() enableCollapse: boolean = false;
  @Input() hoverFeedback: boolean = true;
  @Input() hasLink: boolean = false;
  @Input() hasAction: boolean = false;
  @Input() iconAction: string = 'download';
  @Input() iconClass: string = '';
  @Input() actionText: string = 'download';
  @Input() actionTooltip: string = 'download';
  @Input() hostBackground: string = '#ffffff';
  @Input() configRow: string = 'itemRow';

  @Output() itemClick: EventEmitter<any> = new EventEmitter();
  @Output() actionClick: EventEmitter<any> = new EventEmitter();

  _itemRowConfig: any = null;

  constructor(@Optional() accordion: CdkAccordion, _changeDetectorRef: ChangeDetectorRef, _expansionDispatcher: UniqueSelectionDispatcher) {
    super(accordion, _changeDetectorRef, _expansionDispatcher);
  }

  ngOnInit() {
    document.documentElement.style.setProperty('--collapse-item-background-color', this.hostBackground);

    this._itemRowConfig = this._config ? this._config[this.configRow] || this._config.itemRow || this._config.simpleItem : null;

  }

  __toggle(event: any, activeItem: any) {
    if (this.enableCollapse) {
      this.toggle();
    } else {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  __itemClick(event: MouseEvent) {
    if (!this.actionDisabled) {
      this.itemClick.emit({ data: this._data, event });
    } else {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  __actionClick(event: any) {
    event.stopImmediatePropagation();
    event.preventDefault();
    this.actionClick.emit(this._data);
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
}
