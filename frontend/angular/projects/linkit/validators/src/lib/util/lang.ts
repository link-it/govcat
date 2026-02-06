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
export function isPresent(obj: any): boolean {
  return obj !== undefined && obj !== null;
}

export function isDate(obj: any): boolean {
  try {
    const date = new Date(obj);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
}

export function parseDate(obj: any): string {
  try {
    // Moment.js
    if (obj._d instanceof Date) {
      const d = obj._d as Date;
      const month = +d.getMonth() + 1;
      const day = +d.getDate();
      return `${d.getFullYear()}-${formatDayOrMonth(month)}-${formatDayOrMonth(day)}`;
    }

    // NgbDateStruct
    if (typeof obj === 'object' && obj.year != null && obj.month != null && obj.day != null) {
      const month = +obj.month;
      const day = +obj.day;
      return `${obj.year}-${formatDayOrMonth(month)}-${formatDayOrMonth(day)}`;
    }
  } catch (e) { }
  return obj;
}

function formatDayOrMonth(month: number): string|number {
  return month < 10 ? `0${month}` : month;
}
