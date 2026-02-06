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
import { TestBed } from '@angular/core/testing';
import { EventsManagerService } from './eventsmanager.service';

describe('EventsManagerService', () => {
    let service: EventsManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(EventsManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add listener', () => {
        const listener = () => { };
        service.on('event1', listener);
        expect(service['listeners']['event1']).toContain(listener);
    });

    it('should remove listener', () => {
        const listener = () => { };
        service.on('event1', listener);
        service.off('event1');
        expect(service['listeners']['event1']).toBeUndefined();
    });

    it('should not remove listener if event does not exist', () => {
        service.off('event1');
        expect(service['listeners']['event1']).toBeUndefined();
    });

    it('should broadcast event to listeners', (done) => {
        const listener = (arg1: any, arg2: any) => {
            expect(arg1).toBe('arg1');
            expect(arg2).toBe('arg2');
            done();
        };
        service.on('event1', listener);
        service.broadcast('event1', 'arg1', 'arg2');
    });

    it('should not broadcast event if no listeners', () => {
        expect(() => service.broadcast('event1', 'arg1', 'arg2')).not.toThrow();
    });
});