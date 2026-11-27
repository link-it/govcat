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
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ServizioNotaVetrinaComponent } from './servizio-nota-vetrina.component';

describe('ServizioNotaVetrinaComponent', () => {
  let fixture: ComponentFixture<ServizioNotaVetrinaComponent>;

  const popover = () => fixture.nativeElement.querySelector('.snv-pannello') as HTMLElement | null;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [ServizioNotaVetrinaComponent, TranslateModule.forRoot()] });
    fixture = TestBed.createComponent(ServizioNotaVetrinaComponent);
    fixture.componentRef.setInput('nota', 'Prima riga\n<b>seconda</b> riga');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  const pulsante = () => fixture.nativeElement.querySelector('button.snv-btn') as HTMLButtonElement;

  it('should show a closed button with an accessible name', () => {
    expect(pulsante().getAttribute('aria-label')).toBe('APP.SERVICES.NOTA_VETRINA.Mostra');
    expect(pulsante().getAttribute('aria-expanded')).toBe('false');
    expect(popover()).toBeNull();
  });

  it('should open the note as plain text, keeping the line breaks, with the focus left on the button', () => {
    pulsante().focus();
    pulsante().click();
    fixture.detectChanges();
    vi.runAllTimers();
    const testo = popover()!.querySelector('.snv-testo')!;
    expect(testo.textContent).toBe('Prima riga\n<b>seconda</b> riga');
    expect(testo.querySelector('b')).toBeNull();
    expect(popover()!.getAttribute('role')).toBeNull();
    expect(popover()!.querySelector('button')).toBeNull();
    expect(pulsante().getAttribute('aria-controls')).toBe(popover()!.id);
    expect(pulsante().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(pulsante());
  });

  it('should close with a second click on the button', () => {
    pulsante().click();
    fixture.detectChanges();
    pulsante().click();
    fixture.detectChanges();
    expect(popover()).toBeNull();
    expect(pulsante().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(pulsante());
  });

  it('should close with Escape and with a click outside, the latter without moving the focus', () => {
    pulsante().click();
    fixture.detectChanges();
    vi.runAllTimers();
    popover()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(pulsante());
    pulsante().click();
    fixture.detectChanges();
    popover()!.click();
    fixture.detectChanges();
    expect(popover()).not.toBeNull();
    document.body.click();
    fixture.detectChanges();
    expect(popover()).toBeNull();
  });

  it('should keep the panel inside the window, on the right of the button', () => {
    vi.spyOn(pulsante(), 'getBoundingClientRect').mockReturnValue({ right: window.innerWidth - 4, bottom: 40, width: 40 } as DOMRect);
    pulsante().click();
    fixture.detectChanges();
    expect(popover()!.style.right).toBe('16px');
    expect(popover()!.style.top).toBe('48px');
  });

  it('should keep the panel inside the window also on the left, on narrow screens', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    vi.spyOn(pulsante(), 'getBoundingClientRect').mockReturnValue({ right: 326, bottom: 40, width: 40 } as DOMRect);
    pulsante().click();
    fixture.detectChanges();
    expect(popover()!.style.right).toBe('16px');
  });
});
