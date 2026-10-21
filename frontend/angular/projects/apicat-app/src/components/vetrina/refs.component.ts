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
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

/**
 * Item generico di un referente per il rendering nella pagina
 * vetrina. Volutamente piatto e content-agnostic: il parent
 * (adesione-view / servizio-view) si occupa di mappare il modello
 * reale (`Referent`, `ReferentView`, ecc.) in questa shape.
 */
export interface LnkRefItem {
  id?: string;
  nome: string;
  ruolo: string;
  /** Categoria — usata come modificatore CSS (`r-<tag>`). Es. dom/serv/ades/tec. */
  tag?: string;
  email?: string;
  /** Altri ruoli dello stesso utente, gia` tradotti: mostrati nel tooltip del `+N`. */
  ruoliAggiuntivi?: string[];
}

/** Modificatore CSS (`r-<tag>`) del ruolo: dom/tec/serv/ades. */
export function tagForRuolo(t: string): string {
  const s = (t || '').toLowerCase();
  if (s.includes('dominio')) return 'dom';
  if (s.includes('tecnico')) return 'tec';
  if (s.includes('servizio')) return 'serv';
  if (s.includes('adesione')) return 'ades';
  return '';
}

/** Ruolo leggibile ricavato dal tipo (es. `referente_servizio` -> "Referente Servizio"). */
export function humanizeRuolo(t: string): string {
  if (!t) return '';
  return t
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const PALETTES: [string, string][] = [
  ['#ff4050', '#ff4050'],
];

function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return h;
}

export function gradientFor(name: string): string {
  const [a, b] = PALETTES[hash(name) % PALETTES.length];
  // -> return `linear-gradient(135deg, ${a}, ${b})`;
  return `var(--accent)`; // per ora, usiamo un unico colore da CSS invece di gradienti randomizzati per l'accessibilità (contrasto più prevedibile). In futuro, potremmo reintrodurre i gradienti randomizzati con palette più curate e accessibili.
}

export function initialsOf(name: string): string {
  return name.split(/[\s-]/).filter(Boolean).slice(0, 2).map((s: string) => s[0].toUpperCase()).join('');
}

/**
 * Lista referenti per la pagina vetrina. Due varianti di rendering:
 *  - `cards`  : una card per referente (nome + ruolo + avatar)
 *  - `overlap`: stack di 4 avatar sovrapposti + lista ruoli inline
 *
 * Estratto da `mock-views/app/shared/refs.component.ts`,
 * riscritto col nuovo control flow Angular e con interface
 * tipizzata `LnkRefItem` invece del mock `Referente`.
 */
@Component({
  selector: 'lnk-refs',
  standalone: true,
  imports: [CommonModule, TranslateModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant === 'overlap') {
      <div class="refs-overlap">
        <div class="stack">
          @for (r of list.slice(0, 4); track r.nome) {
            <div class="ref-av"
                 [style.background]="gradient(r.nome)">{{ initials(r.nome) }}</div>
          }
          @if (list.length > 4) {
            <div class="more">+{{ list.length - 4 }}</div>
          }
        </div>
        <div class="info">
          <div><b>{{ list.length }}</b> referenti</div>
          <div class="roles">
            @for (r of list; track r.nome) {
              <span class="r" [ngClass]="r.tag ? 'r-' + r.tag : ''">
                {{ lastWord(r.ruolo) }}
              </span>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="refs">
        @for (r of list; track r.nome; let i = $index) {
          <div class="ref">
            <div class="ref-av" [style.background]="gradient(r.nome)">{{ initials(r.nome) }}</div>
            <div class="ref-body">
              <div class="ref-name">{{ r.nome }}</div>
              <div class="ref-tags">
                <div class="ref-tag" [ngClass]="r.tag ? 'r-' + r.tag : ''">{{ r.ruolo }}</div>
                @if (r.ruoliAggiuntivi?.length) {
                  <button type="button" class="ref-more"
                          [tooltip]="altriRuoliTpl"
                          placement="bottom"
                          container="body"
                          [attr.aria-label]="'+' + r.ruoliAggiuntivi!.length + ' ' + ('APP.LABEL.AltriRuoli' | translate)"
                          [attr.aria-describedby]="_idBase + '-' + i">
                    +{{ r.ruoliAggiuntivi!.length }}
                  </button>
                  <span class="visually-hidden" [id]="_idBase + '-' + i">
                    @for (ruolo of r.ruoliAggiuntivi; track $index) {
                      {{ 'APP.LABEL.AncheRuolo' | translate: { ruolo: lowerFirst(ruolo) } }}.
                    }
                  </span>
                  <ng-template #altriRuoliTpl>
                    @for (ruolo of r.ruoliAggiuntivi; track $index) {
                      <div>{{ 'APP.LABEL.AncheRuolo' | translate: { ruolo: lowerFirst(ruolo) } }}</div>
                    }
                  </ng-template>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class RefsComponent {
  private static _seq = 0;
  @Input() list: LnkRefItem[] = [];
  readonly _idBase = `lnk-refs-${++RefsComponent._seq}`;
  @Input() variant: 'cards' | 'overlap' = 'cards';
  gradient = gradientFor;
  initials = initialsOf;
  lastWord(s: string): string { return s.split(' ').pop() ?? ''; }
  lowerFirst(s: string): string { return s ? s.charAt(0).toLowerCase() + s.slice(1) : ''; }
}
