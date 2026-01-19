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
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlighter',
    standalone: false
})
export class HighlighterPipe implements PipeTransform {

  transform(value: any, args: any, type: string): unknown {
    if (!args) return value;
    if (type === 'full') {
      const re = new RegExp("\\b(" + args + "\\b)", 'igm');
      value = value.replace(re, '<span class="highlighted-text">$1</span>');
    }
    else {
      const re = new RegExp(args, 'igm');
      value = value.replace(re, '<span class="highlighted-text">$&</span>');
    }

    return value;
  }

}
