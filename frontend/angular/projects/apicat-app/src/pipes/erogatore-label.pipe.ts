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

/** Ente erogatore di un servizio intermediato: l'organizzazione, con il soggetto se ne ha piu' di uno. */
@Pipe({
  name: 'erogatoreLabel',
  standalone: true
})
export class ErogatoreLabelPipe implements PipeTransform {
  transform(soggetto: any): string {
    const organizzazione: string = soggetto?.organizzazione?.nome || '';
    if (!organizzazione) {
      return soggetto?.nome || '';
    }
    return (soggetto?.organizzazione?.multi_soggetto && soggetto?.nome) ? `${organizzazione} (${soggetto.nome})` : organizzazione;
  }
}
