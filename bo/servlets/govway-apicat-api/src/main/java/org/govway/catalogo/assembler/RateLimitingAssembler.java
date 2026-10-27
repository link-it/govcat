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
package org.govway.catalogo.assembler;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.govway.catalogo.core.dao.repositories.AdesioneRateLimitingRepository.QuotaAssegnata;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.servlets.model.ItemRateLimitingFruitore;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingAdesione;
import org.govway.catalogo.servlets.model.RateLimitingAdesioneApi;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.RateLimitingRiepilogo;
import org.govway.catalogo.servlets.model.RateLimitingServizio;
import org.govway.catalogo.servlets.model.RateLimitingServizioApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RateLimitingAssembler {

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;

	public List<RateLimiting> toModel(ApiConfigEntity config) {
		return config.getRateLimiting().stream()
				.sorted(Comparator.comparing(ApiConfigRateLimitingEntity::getPeriodo))
				.map(e -> new RateLimiting().quota(e.getQuota()).periodo(toModel(e.getPeriodo())))
				.toList();
	}

	public RateLimitingAdesione toModel(List<AdesioneRateLimitingEntity> rateLimiting) {
		return new RateLimitingAdesione().rateLimiting(rateLimiting.stream().map(this::toModel).toList());
	}

	private RateLimitingAdesioneApi toModel(AdesioneRateLimitingEntity e) {
		return new RateLimitingAdesioneApi()
				.idApi(UUID.fromString(e.getApi().getIdApi()))
				.quota(e.getQuota())
				.periodo(toModel(e.getPeriodo()));
	}

	public ItemRateLimitingFruitore toFruitore(AdesioneEntity adesione, List<AdesioneRateLimitingEntity> rateLimiting) {
		return new ItemRateLimitingFruitore()
				.idAdesione(UUID.fromString(adesione.getIdAdesione()))
				.idLogico(adesione.getIdLogico())
				.soggetto(this.soggettoItemAssembler.toModel(adesione.getSoggetto()))
				.stato(adesione.getStato())
				.rateLimiting(rateLimiting.stream().map(this::toModel).toList());
	}

	/**
	 * Riepilogo delle API del servizio erogate dal soggetto del dominio, ordinate per nome e
	 * versione, con le quote complessive confrontate con quelle assegnate ai fruitori.
	 */
	public RateLimitingServizio toRiepilogo(ServizioEntity servizio, List<QuotaAssegnata> quoteAssegnate) {

		Map<String, QuotaAssegnata> assegnate = new HashMap<>();
		for(QuotaAssegnata q: quoteAssegnate) {
			assegnate.put(getChiave(q.getIdApi(), q.getAmbiente(), q.getPeriodo()), q);
		}

		List<RateLimitingServizioApi> api = servizio.getApi().stream()
				.filter(a -> RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(a.getRuolo()))
				.sorted(Comparator.comparing(ApiEntity::getNome).thenComparing(ApiEntity::getVersione))
				.map(a -> new RateLimitingServizioApi()
						.idApi(UUID.fromString(a.getIdApi()))
						.nome(a.getNome())
						.versione(a.getVersione())
						.collaudo(toRiepilogo(a, a.getCollaudo(), AmbienteEnum.COLLAUDO, assegnate))
						.produzione(toRiepilogo(a, a.getProduzione(), AmbienteEnum.PRODUZIONE, assegnate)))
				.toList();

		return new RateLimitingServizio().api(api);
	}

	private List<RateLimitingRiepilogo> toRiepilogo(ApiEntity api, ApiConfigEntity config, AmbienteEnum ambiente, Map<String, QuotaAssegnata> assegnate) {

		if(config == null) {
			return List.of();
		}

		return config.getRateLimiting().stream()
				.sorted(Comparator.comparing(ApiConfigRateLimitingEntity::getPeriodo))
				.map(e -> {
					QuotaAssegnata q = assegnate.get(getChiave(api.getId(), ambiente, e.getPeriodo()));
					long quotaAssegnata = q != null ? q.getQuota() : 0;
					long residua = e.getQuota() - quotaAssegnata;
					return new RateLimitingRiepilogo()
							.periodo(toModel(e.getPeriodo()))
							.quota(e.getQuota())
							.quotaAssegnata(quotaAssegnata)
							.quotaResidua(residua)
							.numeroFruitori(q != null ? q.getNumeroFruitori().intValue() : 0)
							.superata(residua < 0);
				})
				.toList();
	}

	private String getChiave(Long idApi, AmbienteEnum ambiente, RateLimitingPeriodo periodo) {
		return idApi + "/" + ambiente + "/" + periodo;
	}

	private RateLimitingPeriodoEnum toModel(RateLimitingPeriodo periodo) {
		// I valori dei due enum hanno lo stesso nome
		return RateLimitingPeriodoEnum.valueOf(periodo.name());
	}
}
