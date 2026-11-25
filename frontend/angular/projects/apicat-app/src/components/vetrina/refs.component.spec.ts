import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RefsComponent, humanizeRuolo, tagForRuolo } from './refs.component';

describe('RefsComponent', () => {
  it('should map a role to its tag', () => {
    expect(tagForRuolo('referente_tecnico_dominio')).toBe('dom');
    expect(tagForRuolo('referente_tecnico_servizio')).toBe('tec');
    expect(tagForRuolo('referente_servizio')).toBe('serv');
    expect(tagForRuolo('referente_adesione')).toBe('ades');
    expect(tagForRuolo('')).toBe('');
  });

  it('should make a role readable', () => {
    expect(humanizeRuolo('referente_servizio')).toBe('Referente Servizio');
    expect(humanizeRuolo('')).toBe('');
  });

  it('should lowercase the first letter of the additional roles', () => {
    const component = new RefsComponent();
    expect(component.lowerFirst('Referente dominio (Arti)')).toBe('referente dominio (Arti)');
    expect(component.lowerFirst('')).toBe('');
  });

  it('should flag only the referents without a valid role', () => {
    TestBed.configureTestingModule({ imports: [RefsComponent, TranslateModule.forRoot()] });
    const fixture = TestBed.createComponent(RefsComponent);
    fixture.componentInstance.list = [
      { nome: 'Mario Rossi', ruolo: 'Referente', nonValido: true },
      { nome: 'Anna Bianchi', ruolo: 'Referente' }
    ];
    fixture.detectChanges();
    const refs = fixture.nativeElement.querySelectorAll('.ref');
    expect(refs[0].querySelector('lnk-ruolo-non-valido')).not.toBeNull();
    expect(refs[1].querySelector('lnk-ruolo-non-valido')).toBeNull();
  });
});
