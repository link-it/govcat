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
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

/** Area visibile (in % dell'immagine) di un ritaglio centrato con la proporzione data. */
export interface AreaRitaglio {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Area che resta visibile mostrando un'immagine `larghezza`x`altezza` in un riquadro con
 * proporzione `ratio` (larghezza/altezza), ritagliata e centrata come `cover`.
 * Null se l'immagine ha gia` quella proporzione.
 */
export function areaRitaglio(larghezza: number, altezza: number, ratio: number | null): AreaRitaglio | null {
  if (!larghezza || !altezza || !ratio) { return null; }
  const _ratio = larghezza / altezza;
  if (Math.abs(_ratio - ratio) / ratio < 0.01) { return null; }
  if (_ratio > ratio) {
    const width = ratio / _ratio * 100;
    return { left: (100 - width) / 2, top: 0, width, height: 100 };
  }
  const height = _ratio / ratio * 100;
  return { left: 0, top: (100 - height) / 2, width: 100, height };
}

/**
 * Immagine intera con sovrapposta l'area che resta visibile dove viene mostrata con un'altra
 * proporzione (es. la card del catalogo): le parti che verranno tagliate sono scurite.
 */
@Component({
  selector: 'lnk-crop-preview',
  standalone: true,
  imports: [CommonModule],
  styles: `
    :host { display: block; }
    .crop-preview {
      position: relative;
      overflow: hidden;
      border-radius: inherit;
      line-height: 0;
    }
    .crop-preview img {
      display: block;
      width: 100%;
      height: auto;
    }
    .crop-area {
      position: absolute;
      pointer-events: none;
      box-shadow: 0 0 0 100vmax rgba(15, 23, 42, .5);
      outline: 2px dashed rgba(255, 255, 255, .9);
      outline-offset: -2px;
    }
  `,
  template: `
    <div class="crop-preview">
      <img [src]="src" [alt]="alt" (load)="_onLoad($event)" />
      @if (showCrop && _area) {
        <div class="crop-area" aria-hidden="true"
             [style.left.%]="_area.left" [style.top.%]="_area.top"
             [style.width.%]="_area.width" [style.height.%]="_area.height"></div>
      }
    </div>
  `
})
export class CropPreviewComponent implements OnChanges {

  @Input() src: string | SafeUrl | null = '';
  @Input() alt: string = '';
  /** Proporzione (larghezza/altezza) del riquadro in cui l'immagine viene mostrata. */
  @Input() ratio: number | null = null;
  @Input() showCrop: boolean = true;

  _area: AreaRitaglio | null = null;
  private _dimensioni: { w: number; h: number } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src']) {
      this._dimensioni = null;
      this._area = null;
    }
    if (changes['ratio']) {
      this._calcola();
    }
  }

  _onLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    this._dimensioni = { w: img.naturalWidth, h: img.naturalHeight };
    this._calcola();
  }

  private _calcola() {
    this._area = this._dimensioni ? areaRitaglio(this._dimensioni.w, this._dimensioni.h, this.ratio) : null;
  }
}
