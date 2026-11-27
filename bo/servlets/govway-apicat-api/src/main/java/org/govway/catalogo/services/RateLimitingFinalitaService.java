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

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

import org.govway.catalogo.cache.Cache;
import org.govway.catalogo.cache.CacheConfiguration;
import org.govway.catalogo.core.dao.repositories.AdesioneRateLimitingRepository;
import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneRateLimitingEntity;
import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.EstensioneAdesioneEntity;
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.pdnd.controllers.FinalitaRifiutataException;
import org.govway.catalogo.pdnd.controllers.IPDNDClient;
import org.govway.catalogo.pdnd.controllers.PDNDClientFactory;
import org.govway.catalogo.servlets.model.ConfigurazioneRiferimentoProprietaCustom;
import org.govway.catalogo.servlets.model.RateLimitingFinalitaErroreEnum;
import org.govway.catalogo.servlets.pdnd.model.Purpose;
import org.govway.catalogo.servlets.pdnd.model.PurposeState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Confronto delle quote di rate limiting delle adesioni con le finalita` PDND (Issue 446).
 *
 * La finalita` di un'adesione e` il valore della proprieta` custom indicata per l'ambiente in
 * adesione.rate_limiting.finalita: si considerano le sole adesioni autorizzate per l'ambiente (vedi
 * {@link RateLimitingRegole#getStatiAutorizzati(AmbienteEnum)}) e il solo periodo giorno, l'unico
 * confrontabile con le chiamate giornaliere della finalita`. Se la proprieta` e` specifica per API
 * la quota e` quella dell'API, altrimenti la somma delle quote giornaliere delle API dell'adesione,
 * perche' la PDND conta le chiamate per finalita`.
 *
 * I dati del DB si leggono nella transazione della richiesta, le finalita` dalla PDND dopo: le
 * chiamate esterne non tengono occupata la connessione al DB. Ogni finalita` e` letta una sola volta
 * per richiesta, con una cache delle letture riuscite; una finalita` che non si riesce a leggere non
 * fa fallire la richiesta ma riporta il motivo. Una finalita` senza quota concessa (in bozza, in
 * attesa della prima approvazione o rifiutata) e` una lettura riuscita, con un motivo dedicato e
 * senza quota (Issue 486).
 */
@Service
public class RateLimitingFinalitaService {

	private static final RateLimitingPeriodo PERIODO = RateLimitingPeriodo.GIORNO;

	/** Finalita` usata dalle adesioni autorizzate del servizio, con la somma delle quote giornaliere. */
	public record FinalitaAssegnata(String purposeId, long quotaAssegnata, int numeroAdesioni) {}

	/**
	 * Finalita` indicata da un'adesione: idApi valorizzato se la proprieta` e` specifica per API;
	 * quotaRichiesta null se l'adesione non ha quote giornaliere.
	 */
	public record FinalitaAdesione(String idApi, String purposeId, Long quotaRichiesta) {}

	/**
	 * Finalita` letta dalla PDND: errore valorizzato se la quota non e` confrontabile. Se la finalita`
	 * non e` stata letta mancano gli altri dati; se e` stata letta ma non e` approvata o e` rifiutata
	 * manca solo la quota.
	 */
	public record FinalitaPdnd(RateLimitingFinalitaErroreEnum errore, String titolo, Integer quota, String stato, Integer quotaInAttesa) {
		static FinalitaPdnd errore(RateLimitingFinalitaErroreEnum errore) {
			return new FinalitaPdnd(errore, null, null, null, null);
		}
	}

	/** Finalita` assegnata con i dati letti dalla PDND. */
	public record Finalita(FinalitaAssegnata assegnata, FinalitaPdnd pdnd) {}

	private final Logger logger = LoggerFactory.getLogger(RateLimitingFinalitaService.class);

	@Autowired
	private RateLimitingRegole rateLimitingRegole;

	@Autowired
	private AdesioneRateLimitingRepository adesioneRateLimitingRepository;

	@Autowired
	private PDNDClientFactory pdndClientFactory;

	@Value("${pdnd.finalita.cache.enabled:true}")
	private boolean cacheEnabled;

	/** Secondi di validita` di una finalita` letta dalla PDND. */
	@Value("${pdnd.finalita.cache.ttl:300}")
	private long cacheTtl;

	@Value("${pdnd.finalita.cache.maxElements:1000}")
	private Integer cacheMaxElements;

	private Cache<FinalitaPdnd> cache;

	@PostConstruct
	void initCache() {
		CacheConfiguration cacheConfiguration = new CacheConfiguration();
		cacheConfiguration.setEnabled(this.cacheEnabled);
		cacheConfiguration.setTtl(this.cacheTtl);
		cacheConfiguration.setMaxElements(this.cacheMaxElements);
		this.cache = new Cache<>(cacheConfiguration);
	}

	/** Il confronto con le finalita` e` configurato per l'ambiente. */
	public boolean isAbilitata(AmbienteEnum ambiente) {
		return this.rateLimitingRegole.getProprietaFinalita(ambiente).isPresent();
	}

	// ==================== DB, nella transazione ====================

	/**
	 * Finalita` usate dalle adesioni autorizzate del servizio per ciascun ambiente in cui il
	 * confronto e` configurato, ordinate per identificativo. Mappa vuota se non lo e` in nessuno.
	 */
	public Map<AmbienteEnum, List<FinalitaAssegnata>> getFinalitaAssegnate(ServizioEntity servizio) {
		Map<AmbienteEnum, List<FinalitaAssegnata>> finalita = new LinkedHashMap<>();
		for(AmbienteEnum ambiente: List.of(AmbienteEnum.COLLAUDO, AmbienteEnum.PRODUZIONE)) {
			if(isAbilitata(ambiente)) {
				finalita.put(ambiente, getFinalitaAssegnate(servizio, ambiente));
			}
		}
		return finalita;
	}

	/** Finalita` usate dalle adesioni autorizzate del servizio nell'ambiente, vuota se il confronto non e` configurato. */
	public List<FinalitaAssegnata> getFinalitaAssegnate(ServizioEntity servizio, AmbienteEnum ambiente) {
		Optional<ConfigurazioneRiferimentoProprietaCustom> proprieta = this.rateLimitingRegole.getProprietaFinalita(ambiente);
		List<String> stati = this.rateLimitingRegole.getStatiAutorizzati(ambiente);
		if(proprieta.isEmpty() || stati.isEmpty()) {
			return List.of();
		}
		String gruppo = proprieta.get().getNomeGruppo();
		String nome = proprieta.get().getNomeProprieta();

		Map<String, Long> quote = new TreeMap<>();
		this.adesioneRateLimitingRepository.getQuoteFinalita(servizio.getId(), ambiente, gruppo, nome, stati, PERIODO)
			.forEach(q -> quote.put(q.getPurposeId(), q.getQuota()));

		return this.adesioneRateLimitingRepository.getAdesioniFinalita(servizio.getId(), ambiente, gruppo, nome, stati).stream()
				.map(a -> new FinalitaAssegnata(a.getPurposeId(), Objects.requireNonNullElse(quote.get(a.getPurposeId()), 0L),
						a.getNumeroAdesioni().intValue()))
				.sorted(Comparator.comparing(FinalitaAssegnata::purposeId))
				.toList();
	}

	/**
	 * Finalita` indicate dall'adesione nell'ambiente, ordinate per identificativo; vuota se
	 * l'adesione non e` autorizzata per l'ambiente o se il confronto non e` configurato.
	 */
	public List<FinalitaAdesione> getFinalitaAdesione(AdesioneEntity adesione, AmbienteEnum ambiente) {
		Optional<ConfigurazioneRiferimentoProprietaCustom> proprieta = this.rateLimitingRegole.getProprietaFinalita(ambiente);
		if(proprieta.isEmpty() || !this.rateLimitingRegole.getStatiAutorizzati(ambiente).contains(adesione.getStato())) {
			return List.of();
		}

		return adesione.getEstensioni().stream()
				.filter(e -> ambiente.equals(e.getAmbiente())
						&& proprieta.get().getNomeGruppo().equals(e.getGruppo())
						&& proprieta.get().getNomeProprieta().equals(e.getNome())
						&& e.getValore() != null && !e.getValore().isBlank())
				.map(e -> new FinalitaAdesione(e.getApi() != null ? e.getApi().getIdApi() : null, normalizza(e.getValore()),
						getQuotaRichiesta(adesione, ambiente, e)))
				.sorted(Comparator.comparing(FinalitaAdesione::purposeId)
						.thenComparing(FinalitaAdesione::idApi, Comparator.nullsFirst(Comparator.naturalOrder())))
				.toList();
	}

	/** Stessa normalizzazione delle query: senza spazi e in minuscolo. */
	private static String normalizza(String purposeId) {
		return purposeId.trim().toLowerCase(Locale.ROOT);
	}

	private Long getQuotaRichiesta(AdesioneEntity adesione, AmbienteEnum ambiente, EstensioneAdesioneEntity estensione) {
		ApiEntity api = estensione.getApi();
		List<AdesioneRateLimitingEntity> quote = adesione.getRateLimiting().stream()
				.filter(r -> ambiente.equals(r.getAmbiente()) && PERIODO.equals(r.getPeriodo()))
				.filter(r -> api == null || r.getApi().getId().equals(api.getId()))
				.toList();
		return quote.isEmpty() ? null : quote.stream().mapToLong(AdesioneRateLimitingEntity::getQuota).sum();
	}

	// ==================== PDND, fuori dalla transazione ====================

	/** Le finalita` assegnate di ciascun ambiente, con i dati letti dalla PDND. */
	public Map<AmbienteEnum, List<Finalita>> leggiFinalita(Map<AmbienteEnum, List<FinalitaAssegnata>> assegnate) {
		Map<AmbienteEnum, List<Finalita>> finalita = new LinkedHashMap<>();
		assegnate.forEach((ambiente, lista) -> finalita.put(ambiente, List.copyOf(leggiFinalita(ambiente, lista).values())));
		return finalita;
	}

	/**
	 * Le finalita` assegnate dell'ambiente usate dalle adesioni indicate, con i dati letti dalla
	 * PDND, per identificativo. Una finalita` di un'adesione assente fra le assegnate (adesione
	 * autorizzata dopo la lettura) e` riportata con la sola quota dell'adesione.
	 */
	public Map<String, Finalita> leggiFinalita(AmbienteEnum ambiente, List<FinalitaAssegnata> assegnate, Collection<FinalitaAdesione> usate) {
		Map<String, FinalitaAssegnata> perId = new TreeMap<>();
		for(FinalitaAdesione f: usate) {
			perId.computeIfAbsent(f.purposeId(), id -> assegnate.stream()
					.filter(a -> a.purposeId().equals(id))
					.findAny()
					.orElseGet(() -> new FinalitaAssegnata(id, Objects.requireNonNullElse(f.quotaRichiesta(), 0L), 1)));
		}
		return leggiFinalita(ambiente, perId.values());
	}

	private Map<String, Finalita> leggiFinalita(AmbienteEnum ambiente, Collection<FinalitaAssegnata> assegnate) {
		Map<String, Finalita> finalita = new LinkedHashMap<>();
		for(FinalitaAssegnata a: assegnate) {
			finalita.put(a.purposeId(), new Finalita(a, leggiFinalita(ambiente, a.purposeId())));
		}
		return finalita;
	}

	private FinalitaPdnd leggiFinalita(AmbienteEnum ambiente, String purposeId) {
		UUID id;
		try {
			id = UUID.fromString(purposeId);
		} catch(IllegalArgumentException e) {
			return FinalitaPdnd.errore(RateLimitingFinalitaErroreEnum.NON_VALIDA);
		}

		String chiave = ambiente + "/" + id;
		Optional<FinalitaPdnd> inCache = this.cache.get(chiave);
		if(inCache.isPresent()) {
			return inCache.get();
		}

		try {
			IPDNDClient client = AmbienteEnum.PRODUZIONE.equals(ambiente) ? this.pdndClientFactory.getClientProduzione() : this.pdndClientFactory.getClientCollaudo();
			return this.cache.cache(chiave, toFinalitaPdnd(client.getPurpose(id).getBody()));
		} catch(FinalitaRifiutataException e) {
			// risposta valida della PDND: la finalita` esiste ma non ha una quota concessa
			this.logger.debug("Finalita` [{}] rifiutata sulla PDND di {}", id, ambiente);
			return this.cache.cache(chiave, new FinalitaPdnd(RateLimitingFinalitaErroreEnum.RIFIUTATA, e.getTitolo(), null, e.getStato(), null));
		} catch(ClientApiException e) {
			if(e.getE() != null && e.getE().getCode() == 404) {
				this.logger.warn("Finalita` [{}] non trovata sulla PDND di {}", id, ambiente);
				return FinalitaPdnd.errore(RateLimitingFinalitaErroreEnum.NON_TROVATA);
			}
			this.logger.warn("Lettura della finalita` [{}] dalla PDND di {} non riuscita: {}", id, ambiente, e.getMessage());
			return FinalitaPdnd.errore(RateLimitingFinalitaErroreEnum.NON_DISPONIBILE);
		} catch(RuntimeException e) {
			this.logger.warn("Lettura della finalita` [{}] dalla PDND di {} non riuscita: {}", id, ambiente, e.getMessage());
			return FinalitaPdnd.errore(RateLimitingFinalitaErroreEnum.NON_DISPONIBILE);
		}
	}

	/**
	 * Dati della finalita` letta. In bozza o in attesa della prima approvazione la finalita` non ha
	 * una quota concessa dall'erogatore: la quota resta assente, cosi` non entra nel confronto, e la
	 * quota richiesta in attesa di approvazione resta visibile. Con la v1 la quota di una finalita` in
	 * attesa e` quella della versione in attesa, anche se la PDND non la riporta a parte.
	 */
	private static FinalitaPdnd toFinalitaPdnd(Purpose purpose) {
		PurposeState stato = purpose.getState();
		Integer quotaInAttesa = purpose.getWaitingForApproval() != null ? purpose.getWaitingForApproval().getThroughput() : null;
		String valoreStato = stato != null ? stato.getValue() : null;

		if(PurposeState.DRAFT.equals(stato) || PurposeState.WAITING_FOR_APPROVAL.equals(stato)) {
			if(quotaInAttesa == null && PurposeState.WAITING_FOR_APPROVAL.equals(stato)) {
				quotaInAttesa = purpose.getThroughput();
			}
			return new FinalitaPdnd(RateLimitingFinalitaErroreEnum.NON_APPROVATA, purpose.getTitle(), null, valoreStato, quotaInAttesa);
		}
		return new FinalitaPdnd(null, purpose.getTitle(), purpose.getThroughput(), valoreStato, quotaInAttesa);
	}
}
