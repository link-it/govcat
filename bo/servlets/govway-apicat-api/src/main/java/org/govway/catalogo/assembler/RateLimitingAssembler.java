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

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.services.RateLimitingService.QuoteAssegnate;
import org.govway.catalogo.servlets.model.ItemRateLimitingFruitore;
import org.govway.catalogo.servlets.model.RateLimitingAdesione;
import org.govway.catalogo.servlets.model.RateLimitingAdesioneApi;
import org.govway.catalogo.servlets.model.RateLimitingApi;
import org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum;
import org.govway.catalogo.servlets.model.RateLimitingRiepilogo;
import org.govway.catalogo.servlets.model.RateLimitingServizio;
import org.govway.catalogo.servlets.model.RateLimitingServizioApi;
import org.govway.catalogo.servlets.model.RateLimitingVerifica;
import org.govway.catalogo.servlets.model.RateLimitingVerificaApi;
import org.govway.catalogo.servlets.model.RateLimitingVerificaPeriodo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RateLimitingAssembler {

	@Autowired
	private SoggettoItemAssembler soggettoItemAssembler;

	public List<RateLimitingApi> toModel(ApiConfigEntity config) {
		return config.getRateLimiting().stream()
				.sorted(Comparator.comparing(ApiConfigRateLimitingEntity::getPeriodo))
				.map(e -> new RateLimitingApi().periodo(toModel(e.getPeriodo())).quota(e.getQuota()).quotaFruitore(e.getQuotaFruitore()))
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

	public ItemRateLimitingFruitore toFruitore(AdesioneEntity adesione, boolean autorizzata, List<AdesioneRateLimitingEntity> rateLimiting) {
		return new ItemRateLimitingFruitore()
				.idAdesione(UUID.fromString(adesione.getIdAdesione()))
				.idLogico(adesione.getIdLogico())
				.soggetto(this.soggettoItemAssembler.toModel(adesione.getSoggetto()))
				.stato(adesione.getStato())
				.autorizzata(autorizzata)
				.rateLimiting(rateLimiting.stream().map(this::toModel).toList());
	}

	/**
	 * Riepilogo delle API del servizio erogate dal soggetto del dominio, ordinate per nome e
	 * versione, con le quote dichiarate confrontate con quelle assegnate ai fruitori, nel complesso e
	 * per le sole adesioni autorizzate.
	 */
	public RateLimitingServizio toRiepilogo(ServizioEntity servizio, List<QuoteAssegnate> quoteAssegnate) {

		Map<String, QuoteAssegnate> assegnate = new HashMap<>();
		for(QuoteAssegnate q: quoteAssegnate) {
			assegnate.put(getChiave(q.idApi(), q.ambiente(), q.periodo()), q);
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

	private List<RateLimitingRiepilogo> toRiepilogo(ApiEntity api, ApiConfigEntity config, AmbienteEnum ambiente, Map<String, QuoteAssegnate> assegnate) {

		if(config == null) {
			return List.of();
		}

		return config.getRateLimiting().stream()
				.sorted(Comparator.comparing(ApiConfigRateLimitingEntity::getPeriodo))
				.map(e -> {
					QuoteAssegnate q = assegnate.get(getChiave(api.getId(), ambiente, e.getPeriodo()));
					long quotaAssegnata = q != null ? q.quota() : 0;
					long quotaAutorizzata = q != null ? q.quotaAutorizzata() : 0;
					Long residua = e.getQuota() != null ? e.getQuota() - quotaAssegnata : null;
					return new RateLimitingRiepilogo()
							.periodo(toModel(e.getPeriodo()))
							.quota(e.getQuota())
							.quotaFruitore(e.getQuotaFruitore())
							.quotaAssegnata(quotaAssegnata)
							.quotaResidua(residua)
							.numeroFruitori(q != null ? q.numeroFruitori() : 0)
							.quotaAutorizzata(quotaAutorizzata)
							.numeroFruitoriAutorizzati(q != null ? q.numeroFruitoriAutorizzati() : 0)
							.quotaResiduaAutorizzata(e.getQuota() != null ? e.getQuota() - quotaAutorizzata : null)
							.superata(residua != null && residua < 0);
				})
				.toList();
	}

	/**
	 * Verifica delle quote dell'adesione in un ambiente rispetto alla quota totale residua, al netto
	 * delle quote delle altre adesioni autorizzate, per le API del servizio erogate dal soggetto del
	 * dominio che dichiarano un rate limiting nell'ambiente.
	 */
	public RateLimitingVerifica toVerifica(AdesioneEntity adesione, AmbienteEnum ambiente, List<AdesioneRateLimitingEntity> quoteAdesione,
			List<QuoteAssegnate> quoteAltreAdesioni) {

		Map<String, Integer> richieste = new HashMap<>();
		for(AdesioneRateLimitingEntity e: quoteAdesione) {
			richieste.put(getChiave(e.getApi().getId(), ambiente, e.getPeriodo()), e.getQuota());
		}
		Map<String, QuoteAssegnate> altre = new HashMap<>();
		for(QuoteAssegnate q: quoteAltreAdesioni) {
			altre.put(getChiave(q.idApi(), q.ambiente(), q.periodo()), q);
		}

		List<RateLimitingVerificaApi> api = adesione.getServizio().getApi().stream()
				.filter(a -> RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(a.getRuolo()))
				.filter(a -> {
					ApiConfigEntity config = AmbienteEnum.PRODUZIONE.equals(ambiente) ? a.getProduzione() : a.getCollaudo();
					return config != null && !config.getRateLimiting().isEmpty();
				})
				.sorted(Comparator.comparing(ApiEntity::getNome).thenComparing(ApiEntity::getVersione))
				.map(a -> new RateLimitingVerificaApi()
						.idApi(UUID.fromString(a.getIdApi()))
						.nome(a.getNome())
						.versione(a.getVersione())
						.rateLimiting(toVerifica(a, AmbienteEnum.PRODUZIONE.equals(ambiente) ? a.getProduzione() : a.getCollaudo(),
								ambiente, richieste, altre)))
				.toList();

		return new RateLimitingVerifica()
				.rientra(api.stream().flatMap(a -> a.getRateLimiting().stream()).noneMatch(RateLimitingVerificaPeriodo::isSfora))
				.api(api);
	}

	private List<RateLimitingVerificaPeriodo> toVerifica(ApiEntity api, ApiConfigEntity config, AmbienteEnum ambiente,
			Map<String, Integer> richieste, Map<String, QuoteAssegnate> altre) {

		return config.getRateLimiting().stream()
				.sorted(Comparator.comparing(ApiConfigRateLimitingEntity::getPeriodo))
				.map(e -> {
					String chiave = getChiave(api.getId(), ambiente, e.getPeriodo());
					Integer richiesta = richieste.get(chiave);
					QuoteAssegnate q = altre.get(chiave);
					long autorizzata = q != null ? q.quotaAutorizzata() : 0;
					Long residua = e.getQuota() != null ? e.getQuota() - autorizzata : null;
					return new RateLimitingVerificaPeriodo()
							.periodo(toModel(e.getPeriodo()))
							.quota(e.getQuota())
							.quotaFruitore(e.getQuotaFruitore())
							.quotaRichiesta(richiesta)
							.quotaAutorizzata(autorizzata)
							.numeroFruitoriAutorizzati(q != null ? q.numeroFruitoriAutorizzati() : 0)
							.quotaInAttesa(q != null ? q.quota() - q.quotaAutorizzata() : 0)
							.numeroFruitoriInAttesa(q != null ? q.numeroFruitori() - q.numeroFruitoriAutorizzati() : 0)
							.quotaResidua(residua)
							.sfora(residua != null && richiesta != null && richiesta > residua);
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
