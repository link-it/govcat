import { TestBed } from "@angular/core/testing";
import { BreadcrumbService } from "./breadcrumb.service";
import { Router, NavigationEnd } from '@angular/router';
import { of } from 'rxjs';

describe('BreadcrumbService', () => {
    let service: BreadcrumbService;
    let router: Router;

    beforeEach(() => {
        const routerMock = {
            events: of(new NavigationEnd(0, 'http://localhost', 'http://localhost')),
            routerState: {
                snapshot: {
                    root: {
                        routeConfig: {
                            path: 'test-path'
                        },
                        url: [
                            {
                                path: 'test-path'
                            }
                        ],
                        data: {
                            breadcrumb: 'Test Breadcrumb'
                        }
                    }
                }
            }
        };

        TestBed.configureTestingModule({
            providers: [
                BreadcrumbService,
                { provide: Router, useValue: routerMock }
            ]
        });

        service = TestBed.inject(BreadcrumbService);
        router = TestBed.inject(Router);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should subscribe to router events on creation', () => {
        const spy = spyOn(router.events, 'subscribe');
        service = new BreadcrumbService(router);
        expect(spy).toHaveBeenCalled();
    });

    it('should clear breadcrumbs', () => {
        const spy = spyOn(localStorage, 'removeItem');
        service.clearBreadcrumbs();
        expect(spy).toHaveBeenCalledWith('Groups');
    });

    it('should get breadcrumbs', () => {
        const breadcrumbs = [{ name: 'Home', url: '/' }];
        const encodedBreadcrumbs = btoa(encodeURI(JSON.stringify(breadcrumbs)));
        spyOn(localStorage, 'getItem').and.returnValue(encodedBreadcrumbs);
        const result = service.getBreadcrumbs();
        expect(result).toEqual(breadcrumbs);
    });

    it('should return null if no breadcrumbs in storage', () => {
        spyOn(localStorage, 'getItem').and.returnValue(null);
        const result = service.getBreadcrumbs();
        expect(result).toBeNull();
    });

    it('should store breadcrumbs', () => {
        const breadcrumbs = [{ name: 'Home', url: '/' }];
        const encodedBreadcrumbs = btoa(encodeURI(JSON.stringify(breadcrumbs)));
        const spy = spyOn(localStorage, 'setItem');
        service.storeBreadcrumbs(breadcrumbs);
        expect(spy).toHaveBeenCalledWith('Groups', encodedBreadcrumbs);
    });

    it('should return function result when breadcrumb is a function', () => {
        const data = {
            breadcrumb: (data: { name: any; }) => `Hello, ${data.name}!`,
            name: 'World'
        };
        const result = (service as any).getLabel(data);
        expect(result).toEqual('Hello, World!');
    });

    it('should return breadcrumb when breadcrumb is not a function', () => {
        const data = {
            breadcrumb: 'Hello, World!'
        };
        const result = (service as any).getLabel(data);
        expect(result).toEqual('Hello, World!');
    });
});