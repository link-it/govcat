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
package configuratore;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;

import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;
import org.govway.catalogo.core.dto.DTOClient;
import org.govway.catalogo.core.dto.DTOQuotaRateLimiting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import config.RateLimitingPolicy;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * Applicabilità: fruizioni di e-service PDND a cui l'adesore accede con autenticazione trasporto
 * 'https'. Si comporta come {@link ScenarioTLS} e in più configura, a partire dalle proprietà
 * custom dell'adesione, i dati specifici della fruizione PDND.
 *
 * Configurazione:
 *  - tutto quanto fa lo scenario mtls (censimento del soggetto, dell'applicativo con il
 *    certificato X.509 e aggiunta alla lista degli applicativi autorizzati);
 *  - una policy di rate limiting sulla fruizione, filtrata sull'applicativo dell'adesore, con la
 *    quota giornaliera indicata sull'adesione;
 *  - la proprietà con la finalità PDND della fruizione.
 *
 * NOTA: la finalità è una proprietà della fruizione, non dell'applicativo. Con più adesori sulla
 * stessa fruizione vale quella configurata per prima: le successive ottengono un conflitto, che
 * viene ignorato quando ignoreConflict è attivo.
 */
public class ScenarioMtlsFruizioniPdnd implements ConfigurazioneScenario {

	/** Nome della proprietà con cui govway riceve la finalità PDND della fruizione. */
	private static final String PROPRIETA_PURPOSE_ID = ".purposeId";

	// Suffissi delle properties del configuratore. Coincidono per caso con il nome della
	// proprieta' di govway qui sopra: sono due cose distinte e vanno modificate separatamente.
	private static final String SUFFISSO_PURPOSE_ID = ".purposeId";
	private static final String SUFFISSO_RATE_LIMITING = ".rateLimiting";

	private final Invokers invokers;
	private final ScenarioTLS scenarioTLS;
	private final Properties properties;

	private final boolean ignoreConflict;

	private final Logger logger = LoggerFactory.getLogger(getClass());

	public ScenarioMtlsFruizioniPdnd(Invokers invokers, Properties properties) {
		this.invokers = invokers;
		this.properties = properties;
		this.scenarioTLS = new ScenarioTLS(invokers, properties);

		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}

	/**
	 * Chiave "gruppo.proprieta" dell'estensione dell'adesione da cui leggere il dato, dichiarata
	 * nelle properties del configuratore per ambiente, es.
	 * {@code configuratore.ScenarioMtlsFruizioniPdnd.collaudo.purposeId=PDNDCollaudo.finalita}.
	 * Dalla Issue 446 le property sono deprecate: la finalità si legge dalla proprietà indicata in
	 * adesione.rate_limiting.finalita del configurazione.json e le quote dal rate limiting
	 * dell'adesione; le property valgono solo in mancanza di questi.
	 *
	 * @return chiave configurata, nulla se il deployment non abilita il dato
	 */
	private String getChiaveEstensione(AmbienteEnum ambiente, String suffisso) {
		if (ambiente == null) {
			return null;
		}

		return this.properties.getProperty(ScenarioMtlsFruizioniPdnd.class.getCanonicalName()
				+ "." + ambiente.toString().toLowerCase() + suffisso);
	}

	/**
	 * Valore dell'estensione dell'adesione riferita dalla property indicata, nullo se la property
	 * non è configurata o se l'adesione non valorizza quell'estensione.
	 */
	private String getValoreEstensione(GruppoServizio api, String suffisso) {
		String chiave = getChiaveEstensione(api.getAmbienteConfigurazione(), suffisso);

		if (chiave == null || api.getEstensioni() == null) {
			return null;
		}

		String valore = api.getEstensioni().get(chiave);
		return valore == null || valore.isBlank() ? null : valore;
	}

	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		String errorTLS = this.scenarioTLS.getError(client, api);
		if (errorTLS != null) {
			return "Scenario TLS: " + errorTLS;
		}

		if (!api.isFruizione()) {
			return "L'API deve essere una fruizione: la finalità PDND e la quota per adesore si configurano sulla fruizione";
		}

		// La finalità è obbligatoria solo per i deployment che la dichiarano
		if (isFinalitaRichiesta(api) && getFinalita(api) == null) {
			return "finalità PDND non valorizzata sull'adesione: attesa nella proprietà " + getRiferimentoFinalita(api);
		}

		// La quota legacy si usa solo se l'adesione non ha quote di rate limiting
		String quota = api.getRateLimiting().isEmpty() ? getValoreEstensione(api, SUFFISSO_RATE_LIMITING) : null;
		if (quota != null && !quota.matches("[1-9][0-9]*")) {
			return "quota di rate limiting non numerica (" + quota + ") nell'estensione "
					+ getChiaveEstensione(api.getAmbienteConfigurazione(), SUFFISSO_RATE_LIMITING);
		}

		return null;
	}

	/** La finalità è richiesta dal configurazione.json o, in sua assenza, dalle properties (deprecate). */
	private boolean isFinalitaRichiesta(GruppoServizio api) {
		return api.isFinalitaConfigurata() || getChiaveEstensione(api.getAmbienteConfigurazione(), SUFFISSO_PURPOSE_ID) != null;
	}

	private String getFinalita(GruppoServizio api) {
		return api.isFinalitaConfigurata() ? api.getFinalita() : getValoreEstensione(api, SUFFISSO_PURPOSE_ID);
	}

	private String getRiferimentoFinalita(GruppoServizio api) {
		return api.isFinalitaConfigurata()
				? "indicata in adesione.rate_limiting.finalita"
				: getChiaveEstensione(api.getAmbienteConfigurazione(), SUFFISSO_PURPOSE_ID);
	}

	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio)
			throws ConfigurazioneException {
		return this.scenarioTLS.configureClient(rawClient, gruppiServizio);
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio gruppoServizio)
			throws ConfigurazioneException {

		this.scenarioTLS.configureAPI(client, gruppoServizio);

		configuraRateLimiting(client, gruppoServizio);
		configuraPurposeId(gruppoServizio);

		return Map.of();
	}

	/**
	 * Quote del singolo adesore: una policy sulla fruizione filtrata sull'applicativo dell'adesore
	 * per ciascun periodo del rate limiting dell'adesione (Issue 446). Se l'adesione non ha quote
	 * vale la quota giornaliera dell'estensione legacy delle properties; senza nessuna delle due non
	 * viene configurata alcuna policy.
	 */
	private void configuraRateLimiting(DTOClient client, GruppoServizio gruppoServizio) throws ConfigurazioneException {
		List<DTOQuotaRateLimiting> quote = gruppoServizio.getRateLimiting();
		if (!quote.isEmpty()) {
			for (DTOQuotaRateLimiting q : quote) {
				postRateLimitingPolicy(gruppoServizio, new RateLimitingPolicy()
						.setNome(getNomePolicy(client, q.getPeriodo()))
						.setSogliaValore(String.valueOf(q.getQuota()))
						.setIntervallo(getIntervallo(q.getPeriodo()))
						.setApplicativoFruitore(client.getNome()));
			}
			return;
		}

		String quota = getValoreEstensione(gruppoServizio, SUFFISSO_RATE_LIMITING);

		if (quota == null) {
			this.logger.info("quota di rate limiting non valorizzata per il client {}, nessuna policy configurata", client.getNome());
			return;
		}

		if (!quota.matches("[1-9][0-9]*")) {
			throw new ConfigurazioneException("quota di rate limiting non numerica: " + quota);
		}

		postRateLimitingPolicy(gruppoServizio, new RateLimitingPolicy()
				.setNome(client.getNome())
				.setSogliaValore(quota)
				.setApplicativoFruitore(client.getNome()));
	}

	/**
	 * Nome della policy dell'applicativo per il periodo: quella giornaliera mantiene il nome
	 * dell'applicativo, come la policy configurata dalla quota legacy, le altre lo estendono con il
	 * periodo per restare distinte.
	 */
	static String getNomePolicy(DTOClient client, DTOQuotaRateLimiting.PERIODO periodo) {
		return DTOQuotaRateLimiting.PERIODO.GIORNO.equals(periodo) ? client.getNome() : client.getNome() + "_" + periodo.name().toLowerCase();
	}

	/** Intervallo della policy GovWay corrispondente al periodo della quota. */
	static String getIntervallo(DTOQuotaRateLimiting.PERIODO periodo) {
		switch (periodo) {
		case MINUTO: return "minuti";
		case ORA: return "orario";
		default: return "giornaliero";
		}
	}

	private void postRateLimitingPolicy(GruppoServizio gruppoServizio, RateLimitingPolicy policy) throws ConfigurazioneException {
		try (Response response = this.invokers.getConfigInvoker().postRateLimitingPolicy(gruppoServizio, policy)) {
			this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage(), e);
		}
	}

	/**
	 * Finalità PDND della fruizione. Senza finalità sull'adesione non viene configurata alcuna
	 * proprietà: il caso è già segnalato da getError nei deployment che la dichiarano.
	 */
	private void configuraPurposeId(GruppoServizio gruppoServizio) throws ConfigurazioneException {
		String finalita = getFinalita(gruppoServizio);

		if (finalita == null) {
			this.logger.info("finalità PDND non valorizzata per il servizio {}, nessuna proprietà configurata", gruppoServizio);
			return;
		}

		try (Response response = this.invokers.getConfigInvoker()
				.postProprietaConfigurazione(gruppoServizio, PROPRIETA_PURPOSE_ID, finalita)) {
			this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage(), e);
		}
	}

}
