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
import { AfterContentInit, ContentChildren, Directive, ElementRef } from '@angular/core';
import { OnChanges, OnDestroy, QueryList, Renderer2, Input } from '@angular/core';
import { NavigationEnd, RouteConfigLoadEnd, Router, RouterLink, RouterLinkWithHref } from '@angular/router';
import { Subscription } from 'rxjs';

export interface MatchExp {
  [classes: string]: string;
}

@Directive({
  selector: '[appRouterLinkMatch]',
  standalone: false
})
export class RouterLinkMatchDirective implements OnDestroy, OnChanges, AfterContentInit {
  private _curRoute!: string;
  private _matchExp!: MatchExp;

  private _navSubs!: Subscription;
  private _linkSubs!: Subscription;
  private _linkHrefSubs!: Subscription;

  @ContentChildren(RouterLink, { descendants: true })
  links!: QueryList<RouterLink>;

  @ContentChildren(RouterLinkWithHref, { descendants: true })
  linksWithHrefs!: QueryList<RouterLinkWithHref>;

  @Input('appRouterLinkMatch')
  set routerLinkMatch(matchExp: MatchExp) {
    if (matchExp && typeof matchExp === 'object') {
      this._matchExp = matchExp;
    } else {
      throw new TypeError(
        `Unexpected type '${typeof matchExp}' of value for ` +
        `input of routerLinkMatch directive, expected 'object'`
      );
    }
  }

  constructor(private router: Router, private _renderer: Renderer2, private _ngEl: ElementRef) {
    this._navSubs = router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const _route = (e as NavigationEnd).urlAfterRedirects;
        const _splitRoute = _route.split('/');
        this._curRoute = _splitRoute[1];
        this._update();
      }
    });
  }

  ngOnChanges() {
    this._update();
  }

  ngAfterContentInit() {
    this._linkSubs = this.links.changes.subscribe(() => this._update());
    this._linkHrefSubs = this.linksWithHrefs.changes.subscribe(() => this._update());
    this._update();
  }

  private _update(): void {
    if (!this.links || !this.linksWithHrefs || !this.router.navigated) {
      return;
    }
  
    Promise.resolve().then(() => {
      const matchExp = this._matchExp;
      const currentUrl = this.router.url; // usa l'URL completo
  
      Object.keys(matchExp).forEach(classes => {
        const value = matchExp[classes];
  
        if (value && typeof value === 'string') {
          const _splitPath = value.split(' | ');
          const isMatch = _splitPath.some(path => {
            const regexp = new RegExp(path);
            return currentUrl.match(regexp);
          });
  
          this._toggleClass(classes, isMatch);
        } else {
          throw new TypeError(
            `Invalid match expression value for '${classes}', expected non-empty string`
          );
        }
      });
    });
  }

  private _toggleClass(classes: string, enabled: boolean): void {
    classes
      .split(/\s+/g)
      .filter(cls => !!cls)
      .forEach(cls => {
        if (enabled) {
          this._renderer.addClass(this._ngEl.nativeElement, cls);
        } else {
          this._renderer.removeClass(this._ngEl.nativeElement, cls);
        }
      });
  }

  ngOnDestroy() {
    if (this._navSubs) { this._navSubs.unsubscribe(); }
    if (this._linkSubs) { this._linkSubs.unsubscribe(); }
    if (this._linkHrefSubs) { this._linkHrefSubs.unsubscribe(); }
  }
}
