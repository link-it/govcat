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
 *
 */
package org.govway.catalogo.core.dao.specifications;

/**
 * Trattamento delle entita` in stato archiviato nelle ricerche.
 *
 * Il valore di default delle Specification e` {@link #INCLUDI}, che non aggiunge
 * alcun predicato: i chiamanti che non esprimono una preferenza mantengono cosi`
 * il comportamento che avevano prima dell'introduzione del filtro.
 *
 * Il filtro e` applicato solo se e` noto anche il nome dello stato archiviato
 * (configurabile via workflow), altrimenti non c'e` nulla su cui filtrare.
 */
public enum FiltroArchiviati {

	/** Le entita` archiviate sono omesse dai risultati. */
	ESCLUDI,

	/** Nessun filtro: le entita` archiviate compaiono insieme alle altre. */
	INCLUDI,

	/** Sono restituite esclusivamente le entita` archiviate. */
	SOLO;

}
