import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageloaderService {

  private jobs: number[] = [];
  private loading$ = new BehaviorSubject(false);

  constructor() { }

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
}
