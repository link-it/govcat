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
import { formatNumber } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

/** Locale Angular registrato (AppComponent) per la lingua dell'interfaccia. */
export function localeDaLingua(lingua: string | null | undefined): string {
  const _lingua = (lingua || '').toLowerCase();
  if (_lingua.startsWith('en')) { return 'en-gb'; }
  if (_lingua.startsWith('fr')) { return 'fr'; }
  return 'it';
}

/** Numero formattato secondo la lingua corrente dell'interfaccia (si aggiorna al cambio di lingua). */
@Pipe({
  name: 'localeNumber',
  standalone: true,
  pure: false
})
export class LocaleNumberPipe implements PipeTransform {
  constructor(private readonly translate: TranslateService) {}

  transform(value: number | string | null | undefined, digitsInfo?: string): string | null {
    if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) { return null; }
    return formatNumber(Number(value), localeDaLingua(this.translate.currentLang || this.translate.getDefaultLang()), digitsInfo);
  }
}
