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
import { Subject } from 'rxjs';

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
