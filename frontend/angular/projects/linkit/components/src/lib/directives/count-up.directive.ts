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
import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { animationFrameScheduler, BehaviorSubject, combineLatest, interval } from 'rxjs';
import { distinctUntilChanged, endWith, map, switchMap, takeUntil, takeWhile } from 'rxjs/operators';

import { Destroy } from './destroy';

/**
 * Quadratic Ease-Out Function: f(x) = x * (2 - x)
 */
const easeOutQuad = (x: number): number => x * (2 - x);

@Directive({
    selector: '[countUp]',
    providers: [Destroy],
    standalone: false
})
export class CountUpDirective implements OnInit {
  private readonly count$ = new BehaviorSubject(0);
  private readonly duration$ = new BehaviorSubject(2000);

  private readonly currentCount$ = combineLatest([
    this.count$,
    this.duration$,
  ]).pipe(
    switchMap(([count, duration]) => {
      // get the time when animation is triggered
      const startTime = animationFrameScheduler.now();

      return interval(0, animationFrameScheduler).pipe(
        // calculate elapsed time
        map(() => animationFrameScheduler.now() - startTime),
        // calculate progress
        map((elapsedTime) => elapsedTime / duration),
        // complete when progress is greater than 1
        takeWhile((progress) => progress <= 1),
        // apply quadratic ease-out function
        // for faster start and slower end of counting
        map(easeOutQuad),
        // calculate current count
        map((progress) => Math.round(progress * count)),
        // make sure that last emitted value is count
        endWith(count),
        distinctUntilChanged()
      );
    }),
  );

  @Input('countUp')
  set count(count: number) {
    this.count$.next(count);
  }

  @Input()
  set duration(duration: number) {
    this.duration$.next(duration);
  }

  @Input() language = 'it-IT';

  constructor(
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2,
    private readonly destroy$: Destroy
  ) { }

  ngOnInit(): void {
    this.displayCurrentCount();
  }

  private displayCurrentCount(): void {
    this.currentCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentCount) => {
        const currentCountFormat = Number(currentCount).toLocaleString(this.language);
        this.renderer.setProperty(
          this.elementRef.nativeElement,
          'innerHTML',
          currentCountFormat
        );
      });
  }
}

// function map(arg0: () => number): import("rxjs").OperatorFunction<number, unknown> {
//   throw new Error('Function not implemented.');
// }
