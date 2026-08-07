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
import { Component } from '@angular/core';

/**
 * Icona "relay" per i servizi intermediati (fruizione): tre nodi collegati
 * (nodo intermedio in più; erogatore rappresentato dal cerchio in outline).
 * Usa `currentColor` e si dimensiona con `font-size` del contenitore.
 */
@Component({
  selector: 'app-relay-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <line x1="4.6" y1="6" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="14" y1="6" x2="19.2" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="3" cy="6" r="1.8" fill="currentColor"/>
      <circle cx="11" cy="6" r="3" fill="currentColor"/>
      <circle cx="22" cy="6" r="2.8" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; line-height: 0; vertical-align: middle; color: var(--ink-2, #2e445a); }
    svg { height: 1em; width: auto; display: block; }
  `]
})
export class RelayIconComponent {}
