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

import java.util.Collection;
import java.util.List;

import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface AdesioneRateLimitingRepository extends JpaRepositoryImplementation<AdesioneRateLimitingEntity, Long> {

	/**
	 * Quote assegnate, per API, ambiente, periodo e stato dell'adesione, ai fruitori delle adesioni
	 * non archiviate del servizio. Lo stato consente di distinguere le quote delle adesioni
	 * autorizzate, i cui stati dipendono dalla configurazione.
	 */
	interface QuotaAssegnata {
		Long getIdApi();
		AmbienteEnum getAmbiente();
		RateLimitingPeriodo getPeriodo();
		String getStato();
		Long getQuota();
		Long getNumeroFruitori();
	}

	@Query(value = "SELECT r.api.id AS idApi, r.ambiente AS ambiente, r.periodo AS periodo, r.adesione.stato AS stato, "
			+ "SUM(r.quota) AS quota, COUNT(r) AS numeroFruitori "
			+ "FROM AdesioneRateLimitingEntity r WHERE r.adesione.servizio.id = ?1 AND r.adesione.stato <> ?2 "
			+ "GROUP BY r.api.id, r.ambiente, r.periodo, r.adesione.stato")
	List<QuotaAssegnata> getQuoteAssegnate(Long idServizio, String statoArchiviato);

	/** Come {@link #getQuoteAssegnate(Long, String)}, per un ambiente e senza le quote dell'adesione indicata. */
	@Query(value = "SELECT r.api.id AS idApi, r.ambiente AS ambiente, r.periodo AS periodo, r.adesione.stato AS stato, "
			+ "SUM(r.quota) AS quota, COUNT(r) AS numeroFruitori "
			+ "FROM AdesioneRateLimitingEntity r WHERE r.adesione.servizio.id = ?1 AND r.adesione.stato <> ?2 "
			+ "AND r.ambiente = ?3 AND r.adesione.id <> ?4 "
			+ "GROUP BY r.api.id, r.ambiente, r.periodo, r.adesione.stato")
	List<QuotaAssegnata> getQuoteAssegnateAltreAdesioni(Long idServizio, String statoArchiviato, AmbienteEnum ambiente, Long idAdesione);

	/**
	 * Adesioni che usano una finalita` PDND: l'identificativo, normalizzato in minuscolo e senza
	 * spazi, e il numero delle adesioni del servizio negli stati indicati che lo riportano nella
	 * proprieta` custom indicata per l'ambiente.
	 */
	interface AdesioniFinalita {
		String getPurposeId();
		Long getNumeroAdesioni();
	}

	@Query(value = "SELECT LOWER(TRIM(e.valore)) AS purposeId, COUNT(DISTINCT e.adesione.id) AS numeroAdesioni "
			+ "FROM EstensioneAdesioneEntity e WHERE e.adesione.servizio.id = ?1 AND e.ambiente = ?2 AND e.gruppo = ?3 AND e.nome = ?4 "
			+ "AND e.adesione.stato IN ?5 AND e.valore IS NOT NULL AND TRIM(e.valore) <> '' "
			+ "GROUP BY LOWER(TRIM(e.valore))")
	List<AdesioniFinalita> getAdesioniFinalita(Long idServizio, AmbienteEnum ambiente, String gruppo, String nome, Collection<String> stati);

	/** Somma delle quote di una finalita` PDND nel periodo indicato. */
	interface QuotaFinalita {
		String getPurposeId();
		Long getQuota();
	}

	/**
	 * Come {@link #getAdesioniFinalita(Long, AmbienteEnum, String, String, Collection)}, con la somma
	 * delle quote del periodo indicato: dell'API della proprieta`, se specifica per API, altrimenti di
	 * tutte le API dell'adesione. Le adesioni senza quote nel periodo non compaiono.
	 */
	@Query(value = "SELECT LOWER(TRIM(e.valore)) AS purposeId, SUM(r.quota) AS quota "
			+ "FROM EstensioneAdesioneEntity e, AdesioneRateLimitingEntity r "
			+ "WHERE r.adesione = e.adesione AND r.ambiente = e.ambiente AND r.periodo = ?6 AND (e.api IS NULL OR r.api = e.api) "
			+ "AND e.adesione.servizio.id = ?1 AND e.ambiente = ?2 AND e.gruppo = ?3 AND e.nome = ?4 "
			+ "AND e.adesione.stato IN ?5 AND e.valore IS NOT NULL AND TRIM(e.valore) <> '' "
			+ "GROUP BY LOWER(TRIM(e.valore))")
	List<QuotaFinalita> getQuoteFinalita(Long idServizio, AmbienteEnum ambiente, String gruppo, String nome, Collection<String> stati,
			RateLimitingPeriodo periodo);

	@Query(value = "SELECT COUNT(r) FROM AdesioneRateLimitingEntity r "
			+ "WHERE r.api.id = ?1 AND r.ambiente = ?2 AND r.periodo = ?3 AND r.adesione.stato <> ?4")
	long countFruitori(Long idApi, AmbienteEnum ambiente, RateLimitingPeriodo periodo, String statoArchiviato);

	@Query(value = "SELECT COUNT(r) FROM AdesioneRateLimitingEntity r "
			+ "WHERE r.api.id = ?1 AND r.ambiente = ?2 AND r.periodo = ?3 AND r.quota > ?4 AND r.adesione.stato <> ?5")
	long countFruitoriOltreQuota(Long idApi, AmbienteEnum ambiente, RateLimitingPeriodo periodo, Integer quota, String statoArchiviato);

}
