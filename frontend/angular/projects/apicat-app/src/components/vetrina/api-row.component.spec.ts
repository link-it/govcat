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
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { ApiRowComponent, LnkApiTag } from './api-row.component';

describe('ApiRowComponent', () => {
  let fixture: ComponentFixture<ApiRowComponent>;

  const tags: LnkApiTag[] = [
    { label: 'Profilo:PDND', variant: 'profilo' },
    { label: 'PDND', value: 'v.1', variant: 'pdnd' },
    { label: 'Custom 1' },
    { label: 'Custom 2' }
  ];

  const crea = (valori: Partial<ApiRowComponent> = {}) => {
    fixture.componentRef.setInput('nome', 'TEST 157');
    fixture.componentRef.setInput('versione', 1);
    Object.entries(valori).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ApiRowComponent, TranslateModule.forRoot()] });
    fixture = TestBed.createComponent(ApiRowComponent);
  });

  it('should expose the action as a button named after the API, not as a row with role button', () => {
    const el = crea();
    expect(el.querySelector('[role="button"]')).toBeNull();
    const pulsante = el.querySelector('button.api-link') as HTMLButtonElement;
    expect(pulsante.textContent!.replace(/\s+/g, ' ').trim()).toBe('TEST 157 v.1');
    let emessa = 0;
    fixture.componentInstance.action.subscribe(() => emessa++);
    pulsante.click();
    expect(emessa).toBe(1);
  });

  it('should keep the overflow button outside the action button, with a name that starts with its visible text', () => {
    const el = crea({ tags, maxTags: 3 } as any);
    const altri = el.querySelector('button.tag-more') as HTMLButtonElement;
    expect(altri.closest('.api-link')).toBeNull();
    expect(altri.getAttribute('aria-label')).toBeNull();
    expect(altri.textContent!.replace(/\s+/g, ' ').trim()).toBe('+2 APP.LABEL.TagNascosti');
    let emessa = 0;
    fixture.componentInstance.action.subscribe(() => emessa++);
    altri.click();
    expect(emessa).toBe(0);
  });
});
