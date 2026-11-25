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
package org.govway.catalogo.core.dto;

/**
 * Quota di rate limiting assegnata all'aderente per un'API, nell'ambiente di configurazione e in
 * un periodo.
 */
public class DTOQuotaRateLimiting {

	public enum PERIODO {
		MINUTO,
		ORA,
		GIORNO
	}

	private final PERIODO periodo;
	private final Integer quota;

	public DTOQuotaRateLimiting(PERIODO periodo, Integer quota) {
		this.periodo = periodo;
		this.quota = quota;
	}

	public PERIODO getPeriodo() {
		return periodo;
	}

	public Integer getQuota() {
		return quota;
	}

	@Override
	public String toString() {
		return periodo + "=" + quota;
	}
}
