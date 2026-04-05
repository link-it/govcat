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
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BreadcrumbComponent } from "./breadcrumb.component";
import { EventsManagerService } from "../../services";
import { BreadcrumbService } from "./breadcrumb.service";
import { SimpleChange, SimpleChanges } from "@angular/core";
import { EventType } from "../../classes";
import { Location } from "@angular/common";

describe('BreadcrumbComponent', () => {
    let component: BreadcrumbComponent;
    let fixture: ComponentFixture<BreadcrumbComponent>;

    const mockLocation = {
        prepareExternalUrl: vi.fn().mockImplementation((url: string) => url)
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BreadcrumbComponent],
            providers: [
                EventsManagerService,
                BreadcrumbService,
                { provide: Location, useValue: mockLocation }
            ]
        });
        fixture = TestBed.createComponent(BreadcrumbComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    it('should call _updateBreadcrumbs when UPDATE_BREADCRUMBS event is emitted', () => {
        const eventsManagerService = TestBed.inject(EventsManagerService);
        vi.spyOn(component, '_updateBreadcrumbs');

        eventsManagerService.broadcast('UPDATE_BREADCRUMBS', {});

        expect(component._updateBreadcrumbs).toHaveBeenCalled();
    });

    describe('ngOnChanges', () => {
        it('should update breadcrumbs and call _updateBreadcrumbs when breadcrumbs input changes', () => {
            const changes: SimpleChanges = {
                breadcrumbs: new SimpleChange(null, ['breadcrumb1', 'breadcrumb2'], false)
            };
            vi.spyOn(component, '_updateBreadcrumbs');

            component.ngOnChanges(changes);

            expect(component.breadcrumbs).toEqual(['breadcrumb1', 'breadcrumb2']);
            expect(component._breadcrumbs).toEqual(['breadcrumb1', 'breadcrumb2']);
            expect(component._updateBreadcrumbs).toHaveBeenCalled();
        });

        it('should update useGroups and call _updateBreadcrumbs when useGroups input changes', () => {
            const changes: SimpleChanges = {
                useGroups: new SimpleChange(null, true, false)
            };
            const spy = vi.spyOn(component, '_updateBreadcrumbs').mockImplementation(() => {});

            component.ngOnChanges(changes);

            expect(component.useGroups).toBe(true);
            expect(spy).toHaveBeenCalled();
        });
    });

    it('should update breadcrumbs when groupsBreadcrumbs is truthy and useGroups is true', () => {
        const groupsBreadcrumbs = { groupsBreadcrumbs: ['groupBreadcrumb1', 'groupBreadcrumb2'] };
        vi.spyOn((component as any).breadcrumbService, 'getBreadcrumbs').mockReturnValue(groupsBreadcrumbs);
        component.useGroups = true;
        component._breadcrumbs = [{ url: 'breadcrumb1' }, { url: 'breadcrumb2' }, { url: 'breadcrumb3' }, { url: 'breadcrumb4' }];

        component._updateBreadcrumbs();

        // The new logic takes _breadcrumbs.slice(0,1), sets group=true, url='root' on first element,
        // then appends groupsBreadcrumbs, then _breadcrumbs.slice(1)
        const expectedBreadcrumbs = [
            { url: 'root', group: true },
            'groupBreadcrumb1',
            'groupBreadcrumb2',
            { url: 'breadcrumb2' },
            { url: 'breadcrumb3' },
            { url: 'breadcrumb4' }
        ];
        expect(component.breadcrumbs).toEqual(expectedBreadcrumbs);
    });

    describe('_onClick', () => {
        it('should call _onGoupsBreadcrumbs and emit onClick event when item.group is true', () => {
            const item = { group: true };
            const event = new MouseEvent('click');
            vi.spyOn(component, '_onGoupsBreadcrumbs');
            vi.spyOn(component.onClick, 'emit');

            component._onClick(event, item);

            expect(component._onGoupsBreadcrumbs).toHaveBeenCalledWith(item);
            expect(component.onClick.emit).toHaveBeenCalledWith(item);
        });

        it('should emit onClick event when item.group is false and item.url is truthy', () => {
            const item = { group: false, url: 'url' };
            const event = new MouseEvent('click');
            vi.spyOn(component.onClick, 'emit');

            component._onClick(event, item);

            expect(component.onClick.emit).toHaveBeenCalledWith(item);
        });
    });

    it('should broadcast NAVBAR_OPEN event when _onOpenSidebar is called', () => {
        vi.spyOn((component as any).eventsManagerService, 'broadcast');

        component._onOpenSidebar();

        expect((component as any).eventsManagerService.broadcast).toHaveBeenCalledWith(EventType.NAVBAR_OPEN, { value: EventType.NAVBAR_OPEN });
    });

    it('should update groupsBreadcrumbs and breadcrumbs and call storeBreadcrumbs when _onGoupsBreadcrumbs is called', () => {
        const group = { url: 'url2' };
        component.groupsBreadcrumbs = [{ url: 'url1' }, { url: 'url2' }, { url: 'url3' }];
        component._breadcrumbs = ['breadcrumb1', 'breadcrumb2'];
        vi.spyOn((component as any).breadcrumbService, 'storeBreadcrumbs');

        component._onGoupsBreadcrumbs(group);

        const expectedGroupsBreadcrumbs = [{ url: 'url1' }, { url: 'url2' }];
        const expectedBreadcrumbs = ['breadcrumb1', 'breadcrumb2', { url: 'url1' }, { url: 'url2' }];
        const expectedData = {
            currIdGruppoPadre: 'url2',
            gruppoPadreNull: false,
            groupsBreadcrumbs: expectedGroupsBreadcrumbs
        };
        expect(component.groupsBreadcrumbs).toEqual(expectedGroupsBreadcrumbs);
        expect(component.breadcrumbs).toEqual(expectedBreadcrumbs);
        expect((component as any).breadcrumbService.storeBreadcrumbs).toHaveBeenCalledWith(expectedData);
    });

    it('should handle group.url equal to "root" when _onGoupsBreadcrumbs is called', () => {
        const group = { url: 'root' };
        component.groupsBreadcrumbs = [{ url: 'url1' }, { url: 'root' }, { url: 'url3' }];
        component._breadcrumbs = ['breadcrumb1', 'breadcrumb2'];
        vi.spyOn((component as any).breadcrumbService, 'storeBreadcrumbs');

        component._onGoupsBreadcrumbs(group);

        const expectedGroupsBreadcrumbs = [{ url: 'url1' }, { url: 'root' }];
        const expectedBreadcrumbs = ['breadcrumb1', 'breadcrumb2', { url: 'url1' }, { url: 'root' }];
        const expectedData = {
            currIdGruppoPadre: '',
            gruppoPadreNull: true,
            groupsBreadcrumbs: expectedGroupsBreadcrumbs
        };
        expect(component.groupsBreadcrumbs).toEqual(expectedGroupsBreadcrumbs);
        expect(component.breadcrumbs).toEqual(expectedBreadcrumbs);
        expect((component as any).breadcrumbService.storeBreadcrumbs).toHaveBeenCalledWith(expectedData);
    });
});