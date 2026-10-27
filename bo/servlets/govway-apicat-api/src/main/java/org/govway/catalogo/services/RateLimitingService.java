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
package org.govway.catalogo.services;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.govway.catalogo.authorization.AdesioneAuthorization;
import org.govway.catalogo.authorization.ServizioAuthorization;
import org.govway.catalogo.core.dao.repositories.AdesioneRateLimitingRepository;
import org.govway.catalogo.core.dao.repositories.AdesioneRateLimitingRepository.QuotaAssegnata;
import org.govway.catalogo.core.dao.repositories.AdesioneRepository;
import org.govway.catalogo.core.dao.repositories.ApiConfigRateLimitingRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiConfigEntity;
import org.govway.catalogo.core.orm.entity.ApiConfigRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.govway.catalogo.core.orm.entity.AuthTypeEntity;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.ConfigurazioneProfilo;
import org.govway.catalogo.servlets.model.RateLimiting;
import org.govway.catalogo.servlets.model.RateLimitingAdesioneApi;
import org.govway.catalogo.servlets.model.Ruolo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

/**
 * Rate limiting di API e adesioni.
 *
 * Il servizio dichiara, per ogni API erogata dal soggetto del dominio e per ogni ambiente, le quote
 * complessive, al piu` una per periodo; per le API con un profilo PDND il periodo e` solo giorno.
 * Il fruitore di un'adesione ha una quota per API, ambiente e uno dei periodi dichiarati dal
 * servizio. Che la somma delle quote dei fruitori superi la quota complessiva e` solo segnalato
 * nel riepilogo, mai bloccato; e` invece bloccata la rimozione di un periodo su cui ci sono quote
 * di adesioni non archiviate.
 *
 * Le collezioni figlie non usano orphanRemoval (vedi ApiConfigEntity): le righe dei periodi
 * mantenuti sono aggiornate sul posto, cosi` non si incorre nel vincolo di unicita` per una
 * cancellazione e un inserimento della stessa chiave nello stesso flush, e quelle rimosse sono
 * cancellate esplicitamente.
 */
@Service
public class RateLimitingService {

	private static final Set<AuthTypeEnum> AUTH_TYPE_PDND = EnumSet.of(AuthTypeEnum.PDND, AuthTypeEnum.HTTPS_PDND,
			AuthTypeEnum.SIGN_PDND, AuthTypeEnum.HTTPS_PDND_SIGN);

	private static final Set<Ruolo> RUOLI_GESTIONE_SERVIZIO = EnumSet.of(Ruolo.GESTORE, Ruolo.REFERENTE_SUPERIORE,
			Ruolo.REFERENTE, Ruolo.REFERENTE_TECNICO_SUPERIORE, Ruolo.REFERENTE_TECNICO);

	private static final String STATO_ARCHIVIATO_DEFAULT = "archiviato";

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private ServizioAuthorization servizioAuthorization;

	@Autowired
	private AdesioneAuthorization adesioneAuthorization;

	@Autowired
	private ApiConfigRateLimitingRepository apiConfigRateLimitingRepository;

	@Autowired
	private AdesioneRateLimitingRepository adesioneRateLimitingRepository;

	@Autowired
	private AdesioneRepository adesioneRepository;

	// ==================== API ====================

	/**
	 * Sostituisce integralmente le quote complessive della specifica di un ambiente dell'API.
	 * Lista null: quote invariate.
	 */
	public void setRateLimiting(List<RateLimiting> src, ApiConfigEntity config, ApiEntity api, AmbienteEnum ambiente) {

		if(src == null) {
			return;
		}

		Map<RateLimitingPeriodo, Integer> quote = new HashMap<>();
		for(RateLimiting rl: src) {
			RateLimitingPeriodo periodo = toPeriodo(rl.getPeriodo());
			checkQuota(rl.getQuota());
			if(quote.put(periodo, rl.getQuota()) != null) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_DUPLICATE,
						Map.of("periodo", toString(periodo), "ambiente", toString(ambiente)));
			}
		}

		List<ApiConfigRateLimitingEntity> rimosse = new ArrayList<>();
		for(ApiConfigRateLimitingEntity e: config.getRateLimiting()) {
			Integer quota = quote.remove(e.getPeriodo());
			if(quota != null) {
				e.setQuota(quota);
			} else {
				checkFruitori(api, ambiente, e.getPeriodo());
				rimosse.add(e);
			}
		}

		config.getRateLimiting().removeAll(rimosse);
		this.apiConfigRateLimitingRepository.deleteAll(rimosse);

		// Ordine dei periodi stabile, indipendente da quello della richiesta
		for(RateLimitingPeriodo periodo: RateLimitingPeriodo.values()) {
			Integer quota = quote.get(periodo);
			if(quota != null) {
				ApiConfigRateLimitingEntity e = new ApiConfigRateLimitingEntity();
				e.setApiConfig(config);
				e.setPeriodo(periodo);
				e.setQuota(quota);
				config.getRateLimiting().add(e);
			}
		}
	}

	private void checkFruitori(ApiEntity api, AmbienteEnum ambiente, RateLimitingPeriodo periodo) {
		if(api.getId() == null) {
			return;
		}
		long fruitori = this.adesioneRateLimitingRepository.countFruitori(api.getId(), ambiente, periodo, getStatoArchiviatoAdesione());
		if(fruitori > 0) {
			throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_FRUITORI,
					Map.of("periodo", toString(periodo), "ambiente", toString(ambiente), "numeroAdesioni", String.valueOf(fruitori)));
		}
	}

	/**
	 * Verifica le quote complessive sullo stato finale dell'API, dopo che sono stati applicati
	 * ruolo e profili: previste solo per le API erogate dal soggetto del dominio, solo giornaliere
	 * per le API con un profilo PDND.
	 */
	public void checkRateLimiting(ApiEntity api) {

		List<ApiConfigRateLimitingEntity> quote = new ArrayList<>();
		Optional.ofNullable(api.getCollaudo()).ifPresent(c -> quote.addAll(c.getRateLimiting()));
		Optional.ofNullable(api.getProduzione()).ifPresent(c -> quote.addAll(c.getRateLimiting()));

		if(quote.isEmpty()) {
			return;
		}

		if(!RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(api.getRuolo())) {
			throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_RUOLO,
					Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione())));
		}

		if(isPdnd(api)) {
			quote.stream()
				.filter(q -> !RateLimitingPeriodo.GIORNO.equals(q.getPeriodo()))
				.findAny()
				.ifPresent(q -> {
					throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_PDND,
							Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "periodo", toString(q.getPeriodo())));
				});
		}
	}

	/** L'API ha almeno un profilo con autenticazione PDND: il suo rate limiting e` solo giornaliero. */
	public boolean isPdnd(ApiEntity api) {
		Set<String> profili = new HashSet<>();
		for(AuthTypeEntity at: api.getAuthType()) {
			profili.add(at.getProfilo());
		}
		return this.configurazione.getServizio().getApi().getProfili().stream()
				.filter(p -> profili.contains(p.getCodiceInterno()))
				.map(ConfigurazioneProfilo::getAuthType)
				.anyMatch(AUTH_TYPE_PDND::contains);
	}

	// ==================== ADESIONI ====================

	public List<AdesioneRateLimitingEntity> getRateLimiting(AdesioneEntity adesione, AmbienteEnum ambiente) {
		return adesione.getRateLimiting().stream()
				.filter(r -> r.getAmbiente().equals(ambiente))
				.toList();
	}

	/**
	 * Le quote del fruitore sono modificabili da chi gestisce il servizio in ogni stato
	 * dell'adesione tranne archiviato, altrimenti secondo il workflow dei dati dell'ambiente.
	 */
	public void authorizeModifica(AdesioneEntity adesione, AmbienteEnum ambiente) {
		if(isGestoreServizio(adesione.getServizio()) && !isArchiviata(adesione)) {
			return;
		}
		ConfigurazioneClasseDato classeDato = AmbienteEnum.COLLAUDO.equals(ambiente) ? ConfigurazioneClasseDato.COLLAUDO : ConfigurazioneClasseDato.PRODUZIONE;
		this.adesioneAuthorization.authorizeModifica(adesione, List.of(classeDato));
	}

	/**
	 * Sostituisce integralmente le quote del fruitore nell'ambiente indicato.
	 */
	public void setRateLimiting(List<RateLimitingAdesioneApi> src, AdesioneEntity adesione, AmbienteEnum ambiente) {

		if(src == null) {
			throw new BadRequestException(ErrorCode.VAL_400_REQUIRED, Map.of("campo", "rate_limiting"));
		}

		Map<String, AdesioneRateLimitingEntity> nuove = new HashMap<>();
		for(RateLimitingAdesioneApi rl: src) {
			ApiEntity api = adesione.getServizio().getApi().stream()
					.filter(a -> a.getIdApi().equals(String.valueOf(rl.getIdApi())) && RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(a.getRuolo()))
					.findAny()
					.orElseThrow(() -> new BadRequestException(ErrorCode.ADE_400_RATE_LIMITING_API, Map.of("idApi", String.valueOf(rl.getIdApi()))));

			RateLimitingPeriodo periodo = toPeriodo(rl.getPeriodo());
			checkQuota(rl.getQuota());

			ApiConfigEntity config = AmbienteEnum.COLLAUDO.equals(ambiente) ? api.getCollaudo() : api.getProduzione();
			boolean previsto = config != null && config.getRateLimiting().stream().anyMatch(q -> q.getPeriodo().equals(periodo));
			if(!previsto) {
				throw new BadRequestException(ErrorCode.ADE_400_RATE_LIMITING_PERIODO,
						Map.of("periodo", toString(periodo), "nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "ambiente", toString(ambiente)));
			}

			AdesioneRateLimitingEntity e = new AdesioneRateLimitingEntity();
			e.setAdesione(adesione);
			e.setApi(api);
			e.setAmbiente(ambiente);
			e.setPeriodo(periodo);
			e.setQuota(rl.getQuota());

			if(nuove.put(getChiave(api, periodo), e) != null) {
				throw new BadRequestException(ErrorCode.ADE_400_RATE_LIMITING_DUPLICATE,
						Map.of("periodo", toString(periodo), "nome", api.getNome(), "versione", String.valueOf(api.getVersione())));
			}
		}

		List<AdesioneRateLimitingEntity> rimosse = new ArrayList<>();
		for(AdesioneRateLimitingEntity e: getRateLimiting(adesione, ambiente)) {
			AdesioneRateLimitingEntity nuova = nuove.remove(getChiave(e.getApi(), e.getPeriodo()));
			if(nuova != null) {
				e.setQuota(nuova.getQuota());
			} else {
				rimosse.add(e);
			}
		}

		adesione.getRateLimiting().removeAll(rimosse);
		this.adesioneRateLimitingRepository.deleteAll(rimosse);

		// Nell'ordine della richiesta
		for(RateLimitingAdesioneApi rl: src) {
			AdesioneRateLimitingEntity e = nuove.remove(getChiave(rl.getIdApi().toString(), toPeriodo(rl.getPeriodo())));
			if(e != null) {
				adesione.getRateLimiting().add(e);
			}
		}
	}

	private String getChiave(ApiEntity api, RateLimitingPeriodo periodo) {
		return getChiave(api.getIdApi(), periodo);
	}

	private String getChiave(String idApi, RateLimitingPeriodo periodo) {
		return idApi + "/" + periodo;
	}

	// ==================== RIEPILOGO DEL SERVIZIO ====================

	/** Il riepilogo e la modifica delle quote dei fruitori sono riservati a chi gestisce il servizio. */
	public void authorizeGestioneServizio(ServizioEntity servizio) {
		if(!isGestoreServizio(servizio)) {
			throw new NotAuthorizedException(ErrorCode.AUT_403);
		}
	}

	private boolean isGestoreServizio(ServizioEntity servizio) {
		return this.servizioAuthorization.getGrant(servizio).getRuoli().stream().anyMatch(RUOLI_GESTIONE_SERVIZIO::contains);
	}

	/** Quote assegnate ai fruitori delle adesioni non archiviate del servizio, per API, ambiente e periodo. */
	public List<QuotaAssegnata> getQuoteAssegnate(ServizioEntity servizio) {
		return this.adesioneRateLimitingRepository.getQuoteAssegnate(servizio.getId(), getStatoArchiviatoAdesione());
	}

	public Page<AdesioneEntity> getAdesioniNonArchiviate(ServizioEntity servizio, int page, int size) {
		return this.adesioneRepository.findByServizioNonArchiviate(servizio.getId(), getStatoArchiviatoAdesione(),
				PageRequest.of(page, size, Sort.by("id")));
	}

	// ==================== UTILITA` ====================

	private boolean isArchiviata(AdesioneEntity adesione) {
		return getStatoArchiviatoAdesione().equals(adesione.getStato());
	}

	private String getStatoArchiviatoAdesione() {
		String statoArchiviato = this.configurazione.getAdesione().getWorkflow().getStatoArchiviato();
		return statoArchiviato != null ? statoArchiviato : STATO_ARCHIVIATO_DEFAULT;
	}

	private void checkQuota(Integer quota) {
		if(quota == null || quota < 1) {
			throw new BadRequestException(ErrorCode.VAL_400_RATE_LIMITING_QUOTA, Map.of("quota", String.valueOf(quota)));
		}
	}

	private RateLimitingPeriodo toPeriodo(org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum periodo) {
		if(periodo == null) {
			throw new BadRequestException(ErrorCode.VAL_400_REQUIRED, Map.of("campo", "periodo"));
		}
		// I valori dei due enum hanno lo stesso nome
		return RateLimitingPeriodo.valueOf(periodo.name());
	}

	private String toString(RateLimitingPeriodo periodo) {
		return org.govway.catalogo.servlets.model.RateLimitingPeriodoEnum.valueOf(periodo.name()).getValue();
	}

	private String toString(AmbienteEnum ambiente) {
		return org.govway.catalogo.servlets.model.AmbienteEnum.valueOf(ambiente.name()).getValue();
	}
}
