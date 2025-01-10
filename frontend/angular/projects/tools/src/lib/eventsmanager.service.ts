import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsManagerService {

  private listeners: any;
  private eventsSubject: any;
  private events;

  constructor() {
    this.listeners = {};
    this.eventsSubject = new Subject();

    this.events = this.eventsSubject.asObservable();

    this.events.subscribe(
      (response: any) => {
        const name: string = response.name;
        const args: any = response.args;
        if (this.listeners[name]) {
          for (const listener of this.listeners[name]) {
            listener(...args);
          }
        }
      });
  }

  on(name: string, listener: any) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }

    this.listeners[name].push(listener);
  }

  off(name: string) {
    if (this.listeners[name]) {
      // console.log('Removing listener for event: ' + name);
      delete this.listeners[name];
    }
  }

  broadcast(name: string, ...args: any[]) {
    this.eventsSubject.next({
      name,
      args
    });
  }
}
