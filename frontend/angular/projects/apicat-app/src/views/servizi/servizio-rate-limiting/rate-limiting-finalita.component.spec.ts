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
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { TranslateModule } from '@ngx-translate/core';

import { RateLimitingFinalitaComponent } from './rate-limiting-finalita.component';
import { RateLimitingAdesioneFinalita, RateLimitingFinalita } from '../rate-limiting';

describe('RateLimitingFinalitaComponent', () => {
  let fixture: ComponentFixture<RateLimitingFinalitaComponent>;

  const finalita = (valori: Partial<RateLimitingFinalita> = {}): RateLimitingFinalita => ({
    purpose_id: '7f3c2a10-0000-0000-0000-000000000001', titolo: 'Verifica della residenza', quota: 1000, stato: 'ACTIVE',
    quota_assegnata: 800, numero_adesioni: 1, superata: false, ...valori
  });

  const crea = (f: RateLimitingFinalita, esito: RateLimitingAdesioneFinalita | null = null, nomeApi = '') => {
    fixture.componentRef.setInput('finalita', f);
    fixture.componentRef.setInput('esito', esito);
    fixture.componentRef.setInput('nomeApi', nomeApi);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const testi = (el: HTMLElement, selettore: string) => Array.from(el.querySelectorAll(selettore)).map((n) => n.textContent!.trim());

  beforeAll(() => registerLocaleData(localeIt));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RateLimitingFinalitaComponent, TranslateModule.forRoot()] });
    fixture = TestBed.createComponent(RateLimitingFinalitaComponent);
  });

  it('should show title, purpose id and quotas of the purpose', () => {
    const el = crea(finalita());
    expect(el.querySelector('.rlf-titolo')!.textContent).toBe('Verifica della residenza');
    expect(el.querySelector('.rlf-id')!.textContent).toBe('7f3c2a10-0000-0000-0000-000000000001');
    expect(testi(el, '.rlf-dati dd')).toEqual(['1.000', '800', '1']);
    expect(el.querySelector('.rlf.is-errore')).toBeNull();
    expect(el.querySelectorAll('.rlf-chip')).toHaveLength(0);
  });

  it('should signal the shared purpose exceeded, the state not active and the increase waiting for approval', () => {
    const el = crea(finalita({ numero_adesioni: 3, quota_assegnata: 1500, superata: true, stato: 'SUSPENDED', quota_in_attesa: 1500 }));
    expect(el.querySelector('.rlf.is-errore')).not.toBeNull();
    expect(testi(el, '.rlf-chip')).toEqual(['APP.SERVICES.RATE_LIMITING.FINALITA.Condivisa', 'APP.SERVICES.RATE_LIMITING.FINALITA.StatoNonAttivo (APP.SUBSCRIBERS.PURPOSE_STATE.SUSPENDED)']);
    expect(el.querySelector('.rlf-avviso')!.textContent).toContain('APP.SERVICES.RATE_LIMITING.FINALITA.Superata');
    expect(el.querySelector('.rlf-nota')!.textContent).toContain('1.500');
  });

  it('should show the reason of a purpose not read from PDND, without quotas', () => {
    const el = crea({ purpose_id: 'p-sconosciuta', errore: 'non_trovata', quota_assegnata: 0, numero_adesioni: 1, superata: false });
    expect(el.querySelector('.rlf-titolo')!.textContent).toBe('p-sconosciuta');
    expect(el.querySelector('.rlf-id')).toBeNull();
    expect(el.querySelector('.rlf-dati')).toBeNull();
    expect(el.querySelector('.rlf-nota')!.textContent).toBe('APP.SERVICES.RATE_LIMITING.FINALITA.ERRORE.non_trovata');
  });

  it('should show the data and the requested quota of a purpose waiting for the first approval, without its quota', () => {
    const f = finalita({ errore: 'non_approvata', quota: undefined, stato: 'WAITING_FOR_APPROVAL', quota_in_attesa: 5000 });
    const el = crea(f, { esito: 'non_verificabile', quota_richiesta: 60, finalita: f });
    expect(el.querySelector('.rlf-titolo')!.textContent).toBe('Verifica della residenza');
    expect(el.querySelector('.rlf-motivo')!.textContent).toBe('APP.SERVICES.RATE_LIMITING.FINALITA.ERRORE.non_approvata');
    expect(testi(el, '.rlf-dati dd')).toEqual(['-', '60', '800', '1']);
    expect(testi(el, '.rlf-nota')[1]).toContain('APP.SERVICES.RATE_LIMITING.FINALITA.QuotaRichiestaInAttesa: 5.000');
    expect(testi(el, '.rlf-chip')).toEqual([
      'APP.SERVICES.RATE_LIMITING.FINALITA.ESITO.non_verificabile',
      'APP.SERVICES.RATE_LIMITING.FINALITA.StatoNonAttivo (APP.SUBSCRIBERS.PURPOSE_STATE.WAITING_FOR_APPROVAL)'
    ]);
    expect(el.querySelector('.rlf.is-errore')).toBeNull();
  });

  it('should show the data of a rejected purpose with the specific reason, not as PDND unreachable', () => {
    const el = crea(finalita({ errore: 'rifiutata', quota: undefined, stato: 'REJECTED' }));
    expect(el.querySelector('.rlf-motivo')!.textContent).toBe('APP.SERVICES.RATE_LIMITING.FINALITA.ERRORE.rifiutata');
    expect(testi(el, '.rlf-dati dd')).toEqual(['-', '800', '1']);
    expect(el.querySelectorAll('.rlf-nota')).toHaveLength(1);
    expect(testi(el, '.rlf-chip')).toEqual(['APP.SERVICES.RATE_LIMITING.FINALITA.StatoNonAttivo (APP.SUBSCRIBERS.PURPOSE_STATE.REJECTED)']);
  });

  it('should compare the purpose with the subscription quota, marking the subscriber over the purpose as an error', () => {
    const el = crea(finalita(), { id_api: 'a1', esito: 'superiore', quota_richiesta: 1200, finalita: finalita() }, 'API 1 v1');
    const chip = el.querySelector('.rlf-chip')!;
    expect(chip.textContent!.trim()).toBe('APP.SERVICES.RATE_LIMITING.FINALITA.ESITO.superiore');
    expect(chip.getAttribute('data-tono')).toBe('errore');
    expect(testi(el, '.rlf-dati dd')).toEqual(['1.000', '1.200', '800', '1']);
    expect(el.querySelector('.rlf-api')!.textContent).toBe('API 1 v1');
    expect(el.querySelector('.rlf.is-errore')).not.toBeNull();
  });

  it('should show a warning for the subscriber below the purpose quota', () => {
    const el = crea(finalita(), { esito: 'inferiore', quota_richiesta: 500, finalita: finalita() });
    expect(el.querySelector('.rlf-chip')!.getAttribute('data-tono')).toBe('avviso');
    expect(el.querySelector('.rlf.is-errore')).toBeNull();
  });
});
