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
package org.govway.catalogo.core.dao.repositories;

import java.util.List;

import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface AdesioneRateLimitingRepository extends JpaRepositoryImplementation<AdesioneRateLimitingEntity, Long> {

	/** Quote assegnate, per API, ambiente e periodo, ai fruitori delle adesioni non archiviate del servizio. */
	interface QuotaAssegnata {
		Long getIdApi();
		AmbienteEnum getAmbiente();
		RateLimitingPeriodo getPeriodo();
		Long getQuota();
		Long getNumeroFruitori();
	}

	@Query(value = "SELECT r.api.id AS idApi, r.ambiente AS ambiente, r.periodo AS periodo, SUM(r.quota) AS quota, COUNT(r) AS numeroFruitori "
			+ "FROM AdesioneRateLimitingEntity r WHERE r.adesione.servizio.id = ?1 AND r.adesione.stato <> ?2 "
			+ "GROUP BY r.api.id, r.ambiente, r.periodo")
	List<QuotaAssegnata> getQuoteAssegnate(Long idServizio, String statoArchiviato);

	@Query(value = "SELECT COUNT(r) FROM AdesioneRateLimitingEntity r "
			+ "WHERE r.api.id = ?1 AND r.ambiente = ?2 AND r.periodo = ?3 AND r.adesione.stato <> ?4")
	long countFruitori(Long idApi, AmbienteEnum ambiente, RateLimitingPeriodo periodo, String statoArchiviato);

}
