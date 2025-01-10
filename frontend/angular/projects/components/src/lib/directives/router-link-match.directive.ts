import { AfterContentInit, ContentChildren, Directive, ElementRef } from '@angular/core';
import { OnChanges, OnDestroy, QueryList, Renderer2, Input } from '@angular/core';
import { NavigationEnd, RouteConfigLoadEnd, Router, RouterLink, RouterLinkWithHref } from '@angular/router';
import { Subscription } from 'rxjs';

export interface MatchExp {
  [classes: string]: string;
}

@Directive({
  selector: '[appRouterLinkMatch]'
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

    /**
     * This a way of causing something to happen in the next micro-task / during a new round
     * of change detection.
     */
    Promise.resolve().then(() => {
      const matchExp = this._matchExp;

      Object.keys(matchExp).forEach(classes => {
        if (matchExp[classes] && typeof matchExp[classes] === 'string') {
          const _splitPath = matchExp[classes].split(' | ');
          _splitPath.forEach(path => {
            const regexp = new RegExp(path);
            this._curRoute = this._curRoute || (this.router.url.split('/'))[1];
            // if (this._curRoute.match(regexp)) {
            if (this._curRoute === path) {
              this._toggleClass(classes, true);
            } else {
              this._toggleClass(classes, false);
            }
          });
        } else {
          throw new TypeError(
            `Could not convert match value to Regular Expression. ` +
            `Unexpected type '${typeof matchExp[classes]}' for value of key '${classes}' ` +
            `in routerLinkMatch directive match expression, expected 'non-empty string'`
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
