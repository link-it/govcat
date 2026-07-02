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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LnkHeroKind = 'placeholder' | 'placeholder-blue';
export type LnkHeroObjectFit = 'cover' | 'contain' | 'fill';

/**
 * Illustrazione decorativa per il blocco hero delle pagine
 * "vetrina" (adesione, servizio).
 *
 * Modalita`:
 *  - `[src]` valorizzato -> renderizza l'immagine reale (es. logo
 *    servizio caricato dall'utente). `[alt]` per accessibilita`,
 *    `(error)` re-emette un evento utile al parent per fallback
 *    (es. switch a SVG illustrazione).
 *  - `[src]` vuoto -> rende l'illustrazione SVG default in 2
 *    varianti di palette (`welfare` rosso, `welfare-blue` blu).
 *
 * Componente puro: nessuna dipendenza esterna oltre Angular.
 * Estratto da `mock-views/app/shared/hero-image.component.ts` e
 * generalizzato per servizio-view (rev. NEW VETRINA).
 */
@Component({
  selector: 'lnk-hero-image',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      overflow: hidden;
    }
    .lnk-hero-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      border-radius: inherit;
    }
  `,
  template: `
    @if (src) {
      <img [src]="src" [alt]="alt" (error)="imgError.emit($event)"
           [style.object-fit]="objectFit"
           [style.object-position]="objectPosition"
           style="width:100%;height:100%;display:block;border-radius:inherit;">
    } @else {
      <!-- Placeholder generico: logo project con tinta soft di
           sfondo (palette placeholder rosso, placeholder-blue blu). -->
      <div class="lnk-hero-placeholder"
           [style.background]="tone().bg">
        <img src="./assets/images/logo-placeholder.png"
             alt=""
             aria-hidden="true"
             style="max-width:60%;max-height:60%;object-fit:contain;opacity:.85;">
      </div>
    }
  `,
})
export class HeroImageComponent {
  private readonly _kind = signal<LnkHeroKind>('placeholder');
  @Input() set kind(v: LnkHeroKind) { this._kind.set(v); }
  /** URL dell'immagine reale; se valorizzato sostituisce l'SVG.
   *  Accetta `string | SafeUrl` (output del pipe `httpImgSrc`) — tipato
   *  come `any` per compatibilita`. */
  @Input() src: any = null;
  /** `alt` per accessibilita`. */
  @Input() alt: string = '';
  /**
   * Strategia di fit dell'immagine reale (`[src]`) all'interno del
   * container hero. Default `cover` (riempie il box, possibile crop).
   * - `cover`:   riempie, mantiene aspect ratio, crop sui lati lunghi.
   * - `contain`: contiene interamente, mantiene aspect ratio, eventuali
   *              bande vuote sui lati corti.
   * - `fill`:    deforma per riempire (no aspect ratio preserve).
   * Non applicato al placeholder SVG (resta `contain` decorativo).
   */
  @Input() objectFit: LnkHeroObjectFit = 'cover';
  /**
   * `object-position` CSS dell'immagine reale: controlla quale
   * porzione viene mostrata quando `object-fit` causa crop o
   * bande vuote (rilevante soprattutto con `cover`). Valori
   * supportati: keyword (`center`, `top`, `bottom`, `left`,
   * `right`, `top right`, ...) o coppie `<x> <y>` in percentuale
   * / pixel (es. `50% 25%`). Default `center`.
   */
  @Input() objectPosition: string = 'center';
  /** Re-emette l'evento `error` di `<img>` (utile per fallback). */
  @Output() imgError = new EventEmitter<Event>();

  tone = computed(() => this._kind() === 'placeholder-blue'
    ? { bg: '#e3eff5', stroke: '#2e445a', accent: '#5a91d8' }
    : { bg: '#fff5f5', stroke: '#b81e2b', accent: '#ff7a85' });
}
