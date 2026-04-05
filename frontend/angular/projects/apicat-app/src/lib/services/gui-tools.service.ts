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
import {ElementRef, Injectable} from '@angular/core';
import {interval, Subscription} from 'rxjs';
import {finalize, map, take} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GuiToolsService {

  private static readonly DELTA_HEIGHT = 50;
  private static readonly SCROLL_EASE_PERIOD = 10; // ms
  private static readonly SCROLL_EASE_STEPS = 25; // total animation duration is equal to period * steps

  private subscriptions: Map<string, Subscription> = new Map<string, Subscription>();

  public scrollTo(scrollableElement: ElementRef<HTMLElement>, getElement: () => Element | null): void {
    setTimeout(() => {
      const element = getElement();
      if (!element) {
        return;
      }
      const scrollHeight = scrollableElement.nativeElement.offsetHeight;
      const scrollTop = scrollableElement.nativeElement.getBoundingClientRect().top;
      const scrollBottom = scrollTop + scrollHeight;
      const elementTop = element.getBoundingClientRect().top;
      const elementBottom = element.getBoundingClientRect().bottom;
      const deltaBottom = scrollBottom - GuiToolsService.DELTA_HEIGHT - elementBottom;
      const deltaTop = elementTop - (scrollTop + GuiToolsService.DELTA_HEIGHT);
      if (deltaBottom < 0) {
        this.easeScroll(scrollableElement.nativeElement, Math.abs(deltaBottom));
      } else if (deltaTop < 0) {
        this.easeScroll(scrollableElement.nativeElement, -Math.abs(deltaTop));
      }
    });
  }

  private easeOutQuart(t: number): number {
    return 1 - (--t) * t * t * t;
  }

  private easeScroll(nativeElement: HTMLElement, delta: number) {
    const id = nativeElement.id;
    if (this.subscriptions.has(id)) {
      const subscription = this.subscriptions.get(id);
      if (subscription) {
        subscription.unsubscribe();
      }
    }

    const start = nativeElement.scrollTop;
    const steps = GuiToolsService.SCROLL_EASE_STEPS;
    const period = GuiToolsService.SCROLL_EASE_PERIOD;

    const subscription = interval(period).pipe(take(steps),
      map(t => t / (steps - 1)), // set time in [0,1] interval
      map(this.easeOutQuart), // easing out
      map(x => start + (x * delta)),
      finalize(() => nativeElement.scrollTop = start + delta) // force end value when unsubscribed
    ).subscribe(value => nativeElement.scrollTop = value);

    this.subscriptions.set(id, subscription);
  }

  public copyToClipboard(text: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }
}
