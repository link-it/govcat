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