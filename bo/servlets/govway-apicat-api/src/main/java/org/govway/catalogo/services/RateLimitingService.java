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
import java.util.LinkedHashMap;
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
import org.govway.catalogo.core.orm.entity.RateLimitingPeriodo;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.ConfigurazioneClasseDato;
import org.govway.catalogo.servlets.model.RateLimitingApi;
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
 * per periodo, al piu` una voce per periodo: quota totale, massimo per la somma dei fruitori, e
 * quota fruitore, massimo per ciascun fruitore. Periodi ammessi e quote previste dipendono dai
 * profili dell'API (vedi {@link RateLimitingRegole}).
 * Il fruitore di un'adesione ha una quota per API, ambiente e uno dei periodi dichiarati dal
 * servizio, che non supera la quota fruitore. Che la somma delle quote dei fruitori superi la quota
 * totale e` solo segnalato nel riepilogo, mai bloccato; sono invece bloccate la rimozione di un
 * periodo su cui ci sono quote di adesioni non archiviate e la riduzione della quota fruitore sotto
 * quelle gia` assegnate.
 *
 * Le collezioni figlie non usano orphanRemoval (vedi ApiConfigEntity): le righe dei periodi
 * mantenuti sono aggiornate sul posto, cosi` non si incorre nel vincolo di unicita` per una
 * cancellazione e un inserimento della stessa chiave nello stesso flush, e quelle rimosse sono
 * cancellate esplicitamente.
 */
@Service
public class RateLimitingService {

	private static final Set<Ruolo> RUOLI_GESTIONE_SERVIZIO = EnumSet.of(Ruolo.GESTORE, Ruolo.REFERENTE_SUPERIORE,
			Ruolo.REFERENTE, Ruolo.REFERENTE_TECNICO_SUPERIORE, Ruolo.REFERENTE_TECNICO);

	private static final String STATO_ARCHIVIATO_DEFAULT = "archiviato";

	private static final String QUOTA_TOTALE = "quota_totale";
	private static final String QUOTA_FRUITORE = "quota_fruitore";

	/** Quote dichiarate per un'API, per ambiente e periodo: totale e fruitore. */
	public record QuoteApi(Map<String, Integer> totale, Map<String, Integer> fruitore) {
		public static final QuoteApi VUOTE = new QuoteApi(Map.of(), Map.of());
	}

	@Autowired
	private Configurazione configurazione;

	@Autowired
	private RateLimitingRegole rateLimitingRegole;

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
	 * Sostituisce integralmente le quote della specifica di un ambiente dell'API. Lista null: quote
	 * invariate. Periodi e quote ammessi dai profili si verificano sullo stato finale dell'API
	 * ({@link #checkRateLimiting(ApiEntity)}).
	 */
	public void setRateLimiting(List<RateLimitingApi> src, ApiConfigEntity config, ApiEntity api, AmbienteEnum ambiente) {

		if(src == null) {
			return;
		}

		Map<RateLimitingPeriodo, RateLimitingApi> quote = new HashMap<>();
		for(RateLimitingApi rl: src) {
			RateLimitingPeriodo periodo = toPeriodo(rl.getPeriodo());
			Map<String, String> params = Map.of("periodo", toString(periodo), "ambiente", toString(ambiente));
			if(rl.getQuota() == null && rl.getQuotaFruitore() == null) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_QUOTA_ASSENTE, params);
			}
			checkQuotaOpzionale(rl.getQuota());
			checkQuotaOpzionale(rl.getQuotaFruitore());
			if(rl.getQuota() != null && rl.getQuotaFruitore() != null && rl.getQuotaFruitore() > rl.getQuota()) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_QUOTA_FRUITORE_SUPERIORE, params);
			}
			if(quote.put(periodo, rl) != null) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_DUPLICATE, params);
			}
		}

		List<ApiConfigRateLimitingEntity> rimosse = new ArrayList<>();
		for(ApiConfigRateLimitingEntity e: config.getRateLimiting()) {
			RateLimitingApi rl = quote.remove(e.getPeriodo());
			if(rl != null) {
				if(rl.getQuotaFruitore() != null && !rl.getQuotaFruitore().equals(e.getQuotaFruitore())) {
					checkFruitoriOltreQuota(api, ambiente, e.getPeriodo(), rl.getQuotaFruitore());
				}
				e.setQuota(rl.getQuota());
				e.setQuotaFruitore(rl.getQuotaFruitore());
			} else {
				checkFruitori(api, ambiente, e.getPeriodo());
				rimosse.add(e);
			}
		}

		config.getRateLimiting().removeAll(rimosse);
		this.apiConfigRateLimitingRepository.deleteAll(rimosse);

		// Ordine dei periodi stabile, indipendente da quello della richiesta
		for(RateLimitingPeriodo periodo: RateLimitingPeriodo.values()) {
			RateLimitingApi rl = quote.get(periodo);
			if(rl != null) {
				ApiConfigRateLimitingEntity e = new ApiConfigRateLimitingEntity();
				e.setApiConfig(config);
				e.setPeriodo(periodo);
				e.setQuota(rl.getQuota());
				e.setQuotaFruitore(rl.getQuotaFruitore());
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

	private void checkFruitoriOltreQuota(ApiEntity api, AmbienteEnum ambiente, RateLimitingPeriodo periodo, Integer quotaFruitore) {
		if(api.getId() == null) {
			return;
		}
		long fruitori = this.adesioneRateLimitingRepository.countFruitoriOltreQuota(api.getId(), ambiente, periodo, quotaFruitore, getStatoArchiviatoAdesione());
		if(fruitori > 0) {
			throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_QUOTA_FRUITORE_ASSEGNATE,
					Map.of("periodo", toString(periodo), "ambiente", toString(ambiente), "quotaFruitore", String.valueOf(quotaFruitore),
							"numeroAdesioni", String.valueOf(fruitori)));
		}
	}

	/**
	 * Verifica le quote sullo stato finale dell'API, dopo che sono stati applicati ruolo e profili:
	 * previste solo per le API erogate dal soggetto del dominio, con i soli periodi e le sole quote
	 * ammessi dalla regola dei profili.
	 */
	public void checkRateLimiting(ApiEntity api) {

		List<ApiConfigRateLimitingEntity> quote = getQuote(api);

		if(quote.isEmpty()) {
			return;
		}

		if(!RUOLO.EROGATO_SOGGETTO_DOMINIO.equals(api.getRuolo())) {
			throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_RUOLO,
					Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione())));
		}

		RateLimitingRegole.Regola regola = this.rateLimitingRegole.getRegola(api);
		for(ApiConfigRateLimitingEntity q: quote) {
			if(!regola.periodi().contains(q.getPeriodo())) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_PERIODO,
						Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "periodo", toString(q.getPeriodo())));
			}
			if(q.getQuota() != null && regola.quotaTotale() == null) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_QUOTA_NON_PREVISTA,
						Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "quota", QUOTA_TOTALE));
			}
			if(q.getQuotaFruitore() != null && regola.quotaFruitore() == null) {
				throw new BadRequestException(ErrorCode.API_400_RATE_LIMITING_QUOTA_NON_PREVISTA,
						Map.of("nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "quota", QUOTA_FRUITORE));
			}
		}
	}

	/** Quote dichiarate dall'API, da confrontare prima e dopo una modifica. */
	public QuoteApi getQuoteApi(ApiEntity api) {
		Map<String, Integer> totale = new HashMap<>();
		Map<String, Integer> fruitore = new HashMap<>();
		Optional.ofNullable(api.getCollaudo()).ifPresent(c -> addQuote(c, AmbienteEnum.COLLAUDO, totale, fruitore));
		Optional.ofNullable(api.getProduzione()).ifPresent(c -> addQuote(c, AmbienteEnum.PRODUZIONE, totale, fruitore));
		return new QuoteApi(totale, fruitore);
	}

	private void addQuote(ApiConfigEntity config, AmbienteEnum ambiente, Map<String, Integer> totale, Map<String, Integer> fruitore) {
		for(ApiConfigRateLimitingEntity e: config.getRateLimiting()) {
			String chiave = ambiente + "/" + e.getPeriodo();
			if(e.getQuota() != null) {
				totale.put(chiave, e.getQuota());
			}
			if(e.getQuotaFruitore() != null) {
				fruitore.put(chiave, e.getQuotaFruitore());
			}
		}
	}

	/**
	 * Una quota modificata rispetto a prima deve essere abilitata ai ruoli dell'utente sul servizio
	 * (ruoli_abilitati della regola). La verifica riguarda le sole quote cambiate: la console reinvia
	 * la configurazione completa dell'API anche quando si modifica altro.
	 */
	public void authorizeModifica(ApiEntity api, QuoteApi prima) {
		QuoteApi dopo = getQuoteApi(api);
		RateLimitingRegole.Regola regola = this.rateLimitingRegole.getRegola(api);
		if(!prima.totale().equals(dopo.totale()) && regola.quotaTotale() != null) {
			checkRuoliAbilitati(regola.quotaTotale().ruoliAbilitati(), api.getServizio(), QUOTA_TOTALE);
		}
		if(!prima.fruitore().equals(dopo.fruitore()) && regola.quotaFruitore() != null) {
			checkRuoliAbilitati(regola.quotaFruitore().ruoliAbilitati(), api.getServizio(), QUOTA_FRUITORE);
		}
	}

	/** Stessa semantica dei ruoli_abilitati dei gruppi di proprieta` custom: null tutti, vuota nessuno. */
	private void checkRuoliAbilitati(List<Ruolo> ruoliAbilitati, ServizioEntity servizio, String quota) {
		if(ruoliAbilitati == null) {
			return;
		}
		boolean abilitato = this.servizioAuthorization.getGrant(servizio).getRuoli().stream().anyMatch(ruoliAbilitati::contains);
		if(!abilitato) {
			throw new NotAuthorizedException(ErrorCode.AUT_403_RATE_LIMITING_RUOLI_ABILITATI, Map.of("quota", quota));
		}
	}

	private List<ApiConfigRateLimitingEntity> getQuote(ApiEntity api) {
		List<ApiConfigRateLimitingEntity> quote = new ArrayList<>();
		Optional.ofNullable(api.getCollaudo()).ifPresent(c -> quote.addAll(c.getRateLimiting()));
		Optional.ofNullable(api.getProduzione()).ifPresent(c -> quote.addAll(c.getRateLimiting()));
		return quote;
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
			ApiConfigRateLimitingEntity quotaServizio = Optional.ofNullable(config).stream()
					.flatMap(c -> c.getRateLimiting().stream())
					.filter(q -> q.getPeriodo().equals(periodo))
					.findAny()
					.orElseThrow(() -> new BadRequestException(ErrorCode.ADE_400_RATE_LIMITING_PERIODO,
						Map.of("periodo", toString(periodo), "nome", api.getNome(), "versione", String.valueOf(api.getVersione()), "ambiente", toString(ambiente))));

			if(quotaServizio.getQuotaFruitore() != null && rl.getQuota() > quotaServizio.getQuotaFruitore()) {
				throw new BadRequestException(ErrorCode.ADE_400_RATE_LIMITING_QUOTA_FRUITORE,
						Map.of("quota", String.valueOf(rl.getQuota()), "quotaFruitore", String.valueOf(quotaServizio.getQuotaFruitore()),
								"periodo", toString(periodo), "nome", api.getNome(), "versione", String.valueOf(api.getVersione())));
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

	/**
	 * Quote assegnate ai fruitori delle adesioni non archiviate del servizio, per API, ambiente e
	 * periodo, con la parte delle adesioni autorizzate per l'ambiente.
	 */
	public record QuoteAssegnate(Long idApi, AmbienteEnum ambiente, RateLimitingPeriodo periodo, long quota, int numeroFruitori,
			long quotaAutorizzata, int numeroFruitoriAutorizzati) {}

	public List<QuoteAssegnate> getQuoteAssegnate(ServizioEntity servizio) {
		return aggrega(this.adesioneRateLimitingRepository.getQuoteAssegnate(servizio.getId(), getStatoArchiviatoAdesione()));
	}

	/**
	 * Quote assegnate ai fruitori delle altre adesioni non archiviate del servizio in un ambiente,
	 * per la verifica delle quote dell'adesione indicata.
	 */
	public List<QuoteAssegnate> getQuoteAssegnateAltreAdesioni(AdesioneEntity adesione, AmbienteEnum ambiente) {
		return aggrega(this.adesioneRateLimitingRepository.getQuoteAssegnateAltreAdesioni(adesione.getServizio().getId(),
				getStatoArchiviatoAdesione(), ambiente, adesione.getId()));
	}

	/** Somma per API, ambiente e periodo le quote raggruppate per stato, distinguendo le autorizzate. */
	private List<QuoteAssegnate> aggrega(List<QuotaAssegnata> quoteAssegnate) {
		Map<String, QuoteAssegnate> quote = new LinkedHashMap<>();
		for(QuotaAssegnata q: quoteAssegnate) {
			boolean autorizzata = this.rateLimitingRegole.getStatiAutorizzati(q.getAmbiente()).contains(q.getStato());
			long quota = q.getQuota();
			int numeroFruitori = q.getNumeroFruitori().intValue();
			quote.merge(q.getIdApi() + "/" + q.getAmbiente() + "/" + q.getPeriodo(),
					new QuoteAssegnate(q.getIdApi(), q.getAmbiente(), q.getPeriodo(), quota, numeroFruitori,
							autorizzata ? quota : 0, autorizzata ? numeroFruitori : 0),
					(a, b) -> new QuoteAssegnate(a.idApi(), a.ambiente(), a.periodo(), a.quota() + b.quota(), a.numeroFruitori() + b.numeroFruitori(),
							a.quotaAutorizzata() + b.quotaAutorizzata(), a.numeroFruitoriAutorizzati() + b.numeroFruitoriAutorizzati()));
		}
		return new ArrayList<>(quote.values());
	}

	/**
	 * Adesioni non archiviate del servizio; autorizzate valorizzato: solo quelle autorizzate per
	 * l'ambiente, o solo quelle non ancora autorizzate.
	 */
	public Page<AdesioneEntity> getAdesioniNonArchiviate(ServizioEntity servizio, AmbienteEnum ambiente, Boolean autorizzate, int page, int size) {
		PageRequest pageRequest = PageRequest.of(page, size, Sort.by("id"));
		List<String> statiAutorizzati = this.rateLimitingRegole.getStatiAutorizzati(ambiente);

		if(autorizzate == null || (!autorizzate && statiAutorizzati.isEmpty())) {
			return this.adesioneRepository.findByServizioNonArchiviate(servizio.getId(), getStatoArchiviatoAdesione(), pageRequest);
		}
		if(statiAutorizzati.isEmpty()) {
			return Page.empty(pageRequest);
		}
		return autorizzate
				? this.adesioneRepository.findByServizioNonArchiviateInStati(servizio.getId(), getStatoArchiviatoAdesione(), statiAutorizzati, pageRequest)
				: this.adesioneRepository.findByServizioNonArchiviateNotInStati(servizio.getId(), getStatoArchiviatoAdesione(), statiAutorizzati, pageRequest);
	}

	/** L'adesione e` in uno degli stati in cui le quote dell'ambiente sono autorizzate. */
	public boolean isAutorizzata(AdesioneEntity adesione, AmbienteEnum ambiente) {
		return this.rateLimitingRegole.getStatiAutorizzati(ambiente).contains(adesione.getStato());
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

	private void checkQuotaOpzionale(Integer quota) {
		if(quota != null) {
			checkQuota(quota);
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
