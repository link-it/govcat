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

/**
 * Chiave del motivo per cui il servizio non e' eliminabile, ricavato dai dati gia' caricati dalla pagina.
 * Il BE verifica nell'ordine adesioni, API e componenti del package: senza API ne' componenti restano
 * solo le adesioni; altrimenti, senza sapere se ci sono adesioni, si usa il testo che le comprende.
 * `haApiOComponenti` e' null finche' API o componenti non sono caricati.
 */
export function motivoNonEliminabile(isPackage: boolean, haApiOComponenti: boolean | null): string {
  if (haApiOComponenti === false) {
    return 'APP.MESSAGE.ERROR.SRV.400.NOT.DELETABLE.ADESIONI';
  }
  return isPackage ? 'APP.TOOLTIP.PackageNonEliminabile' : 'APP.TOOLTIP.ServizioNonEliminabile';
}
