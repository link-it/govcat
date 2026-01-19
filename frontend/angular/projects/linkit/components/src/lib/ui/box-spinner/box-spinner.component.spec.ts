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
import { BoxSpinnerComponent } from "./box-spinner.component";
import { Subscription } from "rxjs";
import { Tools } from "../../services";

describe('BoxSpinnerComponent', () => {
    let component: BoxSpinnerComponent;
    let fixture: ComponentFixture<BoxSpinnerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BoxSpinnerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(BoxSpinnerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should unsubscribe from all emergency calls and wait for response', () => {
        const subscription1 = new Subscription();
        const subscription2 = new Subscription();
        spyOn(subscription1, 'unsubscribe');
        spyOn(subscription2, 'unsubscribe');
        Tools.EmergencyCall = [subscription1, subscription2];
        spyOn(Tools, 'WaitForResponse');

        component._rescueCall();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
        expect(Tools.EmergencyCall).toEqual([]);
        expect(Tools.WaitForResponse).toHaveBeenCalledWith(false, true);
    });

});