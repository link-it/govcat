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
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageloaderService {

  private jobs: number[] = [];
  private loading$ = new BehaviorSubject(false);

  get isLoading() {
    return this.loading$.asObservable();
  }

  showLoader() {
    this.jobs.push(0);
    this.loading$.next(true);
  }

  hideLoader() {
    this.jobs.pop();
    if (this.jobs.length === 0) {
      this.loading$.next(false);
    }
  }

  resetLoader() {
    this.jobs = [];
    this.loading$.next(false);
  }

  closeLoader() {
    this.jobs = [];
    this.loading$.complete();
  }
}
