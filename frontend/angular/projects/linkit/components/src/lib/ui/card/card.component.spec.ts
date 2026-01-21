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

// import { ComponentFixture, TestBed } from "@angular/core/testing";
// import { ComponentsModule } from "../../components.module";

// import { CardComponent, CardType } from "./card.component";

// describe('CardComponent', () => {
//     let component: CardComponent;
//     let fixture: ComponentFixture<CardComponent>;


//     beforeEach(() => {
//         TestBed.configureTestingModule({
//             imports: [ComponentsModule],
//         }).compileComponents();

//         fixture = TestBed.createComponent(CardComponent);
//         component = fixture.componentInstance;
//         component._primaryText = 'Primary text';
//         component._numberCharLogoText = 2;
//         component._image = 'image.jpg';
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should call __simpleClick if _type is CardType.Simple', () => {
//         const event = {};
//         component._type = CardType.Simple;
//         spyOn(component, '__simpleClick');

//         component.onClick(event);

//         expect(component.__simpleClick).toHaveBeenCalledWith(event);
//     });

//     it('should set _logoText', () => {
//         expect(component._logoText).toBe('Pr');
//     });

//     it('should set _backColor', () => {
//         expect(component._backColor).toBe('#f1f1f1');
//     });

//     it('should set _textColor', () => {
//         expect(component._textColor).toBe('#000000');
//     });

//     it('should set _textColor', () => {
//         expect(component._textColor).toBe('#000000');
//     });

//     it('should emit simpleClick event', () => {
//         spyOn(component.simpleClick, 'emit');
//         component.__simpleClick('event');
//         expect(component.simpleClick.emit).toHaveBeenCalledWith('event');
//     });

//     it('should emit editSelection event', () => {
//         spyOn(component.editSelection, 'emit');
//         component.__change({ checked: true });
//         expect(component.editSelection.emit).toHaveBeenCalledWith({ selected: true });
//     });

//     it('should not emit simpleClick event', () => {
//         spyOn(component.simpleClick, 'emit');
//         component._editMode = true;
//         component.__simpleClick('event');
//         expect(component.simpleClick.emit).not.toHaveBeenCalled();
//     });

//     it('should not emit simpleClick event', () => {
//         spyOn(component.simpleClick, 'emit');
//         component._editMode = true;
//         component.__simpleClick('event');
//         expect(component.simpleClick.emit).not.toHaveBeenCalled();
//     });

//     it('should not emit simpleClick event', () => {
//         spyOn(component.simpleClick, 'emit');
//         component._editMode = true;
//         component.__simpleClick('event');
//         expect(component.simpleClick.emit).not.toHaveBeenCalled();
//     });

//     it('should not emit simpleClick event', () => {
//         spyOn(component.simpleClick, 'emit');
//         component._editMode = true;
//         component.__simpleClick('event');
//         expect(component.simpleClick.emit).not.toHaveBeenCalled();
//     });
// });
