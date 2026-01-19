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
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Data, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private static BREADCRUMBS_STORAGE: string = 'Groups';

  // Subject emitting the breadcrumb hierarchy
  private readonly _breadcrumbs$ = new BehaviorSubject<Breadcrumb[]>([]);

  // Observable exposing the breadcrumb hierarchy
  readonly breadcrumbs$ = this._breadcrumbs$.asObservable();

  constructor(private router: Router) {
    const naviagationEnd = this.router.events.pipe(
      // Filter the NavigationEnd events as the breadcrumb is updated only when the route reaches its end
      filter((event) => event instanceof NavigationEnd)
    ) as Observable<NavigationEnd>;
    
    naviagationEnd.subscribe(event => {
      const root = this.router.routerState.snapshot.root;
      const breadcrumbs: Breadcrumb[] = [];
      this.addBreadcrumb(root, [], breadcrumbs);

      // Emit the new hierarchy
      this._breadcrumbs$.next(breadcrumbs);
    });

    naviagationEnd.pipe(pairwise()).subscribe(([previousEvent, currentEvent]) => {
         // split the urls into segments and check if first segement has changed then clear the breadcrumbs
          const previousUrlSegments = previousEvent.urlAfterRedirects.split('/');
          const currentUrlSegments = currentEvent.urlAfterRedirects.split('/');
          
          if (previousUrlSegments[1] !== currentUrlSegments[1]) {
            this.clearBreadcrumbs();
          }
    });
  }

  private addBreadcrumb(route: ActivatedRouteSnapshot | null, parentUrl: string[], breadcrumbs: Breadcrumb[]) {
    if (route) {
      // Construct the route URL
      const routeUrl = parentUrl.concat(route.url.map(url => url.path));

      // Add an element for the current route part
      if (route.data['breadcrumb']) {
        const breadcrumb = {
          label: this.getLabel(route.data),
          url: '/' + routeUrl.join('/')
        };
        breadcrumbs.push(breadcrumb);
      }

      // Add another element for the next route part
      this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
    }
  }

  private getLabel(data: Data) {
    // The breadcrumb can be defined as a static string or as a function to construct the breadcrumb element out of the route data
    return typeof data['breadcrumb'] === 'function' ? data['breadcrumb'](data) : data['breadcrumb'];
  }

  public clearBreadcrumbs() {
    sessionStorage.removeItem(BreadcrumbService.BREADCRUMBS_STORAGE);
  }

  public getBreadcrumbs() {
    const storage = sessionStorage.getItem(BreadcrumbService.BREADCRUMBS_STORAGE);
    if (storage) {
      const breadcrumbs = JSON.parse(decodeURI(atob(storage)));
      return breadcrumbs;
    }
    return null;
  }

  public storeBreadcrumbs(data: any) {
    const breadcrumbs = btoa(encodeURI(JSON.stringify(data)));
    sessionStorage.setItem(BreadcrumbService.BREADCRUMBS_STORAGE, breadcrumbs);
  }
}
