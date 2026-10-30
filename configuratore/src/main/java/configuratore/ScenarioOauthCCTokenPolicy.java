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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.Set;

import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.dto.DTOClient;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.OauthClientCredentialsClient;
import org.govway.catalogo.core.dto.PdndClient;

import config.Applicativo;
import config.AuthenticationToken;
import config.ControlloAccessiAutorizzazione;
import config.ControlloAccessiGestioneToken;
import config.ServizioApplicativo;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * Applicabilità: adesioni a una API il cui profilo di autenticazione dichiara, tramite
 * proprieta_token_policy, quale proprietà custom dell'API contiene la token policy GovWay da
 * associare all'applicativo. È lo scenario dei profili OAuth Client Credentials che non ricavano
 * la policy dall'erogazione: la policy è un dato del catalogo, gestito sull'API.
 *
 * Configurazione:
 *  - censimento di un applicativo (prende il nome del client) con modalità di accesso token, la
 *    token policy letta dall'API e il clientId fornito come identificativo;
 *  - verifica che sull'erogazione sia configurata la gestione token con la stessa policy e che
 *    l'autorizzazione sia puntuale per token richiedente;
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati per token.
 *
 * A differenza di {@link ScenarioClientCredentials} non crea nulla su keycloak: il client è già
 * censito sull'identity provider e il catalogo ne conosce solo il clientId.
 */
public class ScenarioOauthCCTokenPolicy implements ConfigurazioneScenario {

	private Invokers invokers;

	private boolean ignoreConflict;

	public ScenarioOauthCCTokenPolicy(Invokers invokers, Properties properties) {
		this.invokers = invokers;

		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}

	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		if (getClientId(client) == null) {
			return "Il client deve essere di tipo PDND o OAuth Client Credentials";
		}

		if (api.getTokenPolicy() == null) {
			return "token policy non valorizzata sull'API per il profilo " + api.getProfiloAutenticazione()
					+ ": verificare proprieta_token_policy del profilo e la proprietà custom dell'API";
		}

		return null;
	}

	/**
	 * Identificativo del client da associare alla token policy. I profili che usano questo scenario
	 * portano il solo clientId, sia con auth_type pdnd sia con auth_type oauth_client_credentials.
	 *
	 * @return clientId, nullo se il client non è di un tipo gestito
	 */
	private static String getClientId(DTOClient client) {
		if (client instanceof PdndClient pdndClient) {
			return pdndClient.getClientId();
		}
		if (client instanceof OauthClientCredentialsClient oauthClient) {
			return oauthClient.getClientId();
		}
		return null;
	}

	/**
	 * Soggetto sotto cui registrare/cercare l'applicativo: aderente per le erogazioni, fruitore per
	 * le fruizioni. Coerente con {@link ScenarioClientCredentials}: configureClient e configureAPI
	 * devono usare lo stesso soggetto, altrimenti l'applicativo non viene ritrovato.
	 */
	private DTOSoggetto getSoggettoApplicativo(GruppoServizio api) throws ConfigurazioneException {
		DTOSoggetto soggetto = api.isFruizione() ? api.getSoggettoFruitore() : api.getSoggettoAderente();

		if (soggetto == null) {
			throw new ConfigurazioneException("soggetto "
					+ (api.isFruizione() ? "fruitore" : "aderente")
					+ " non valorizzato: impossibile individuare dove censire l'applicativo");
		}

		return soggetto;
	}

	/**
	 * Token policy comune a tutti i servizi che usano il client: l'applicativo è uno solo, quindi
	 * non può avere policy diverse. Valori discordanti sono un errore di configurazione dell'API.
	 */
	private String getTokenPolicy(List<GruppoServizio> gruppiServizio) throws ConfigurazioneException {
		Set<String> policies = new LinkedHashSet<>();

		for (GruppoServizio gruppoServizio : gruppiServizio) {
			if (gruppoServizio.getTokenPolicy() != null) {
				policies.add(gruppoServizio.getTokenPolicy());
			}
		}

		if (policies.isEmpty()) {
			throw new ConfigurazioneException("token policy non valorizzata su nessuna delle API associate al client");
		}

		if (policies.size() > 1) {
			throw new ConfigurazioneException("le API associate al client dichiarano token policy diverse ("
					+ String.join(", ", policies) + "): l'applicativo ne ammette una sola");
		}

		return policies.iterator().next();
	}

	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio)
			throws ConfigurazioneException {

		String clientId = getClientId(rawClient);
		if (clientId == null) {
			throw new ConfigurazioneException("client di tipo " + rawClient.getClass().getSimpleName() + " non gestito dallo scenario");
		}

		if (gruppiServizio.isEmpty()) {
			return Map.of();
		}

		String tokenPolicy = getTokenPolicy(gruppiServizio);

		DTOSoggetto soggetto = getSoggettoApplicativo(gruppiServizio.get(0));

		// modiDominio = "interno" se l'organizzazione del soggetto usato e' referente, altrimenti "esterno"
		String modiDominio = soggetto.isReferente() ? "interno" : "esterno";

		ServizioApplicativo sa = new ServizioApplicativo()
				.setModalitaAccesso("token")
				.setNomeApplicativo(rawClient.getNome())
				.setDescrizione(rawClient.getDescrizione())
				.setTokenPolicy(tokenPolicy)
				.setTokenIdentificativo(clientId)
				.setModiDominio(modiDominio);

		try (Response response = this.invokers.getConfigInvoker().postServizioApplicativo(sa, soggetto)) {
			this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
		} catch (TemplateException | IOException e) {
			throw new ConfigurazioneException(e.getMessage(), e);
		}

		return Map.of("client_id", clientId);
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio gruppoServizio)
			throws ConfigurazioneException {

		try {
			// L'applicativo e' stato creato in configureClient sotto il soggetto fruitore (fruizione)
			// o aderente (erogazione): la GET deve usare lo stesso soggetto e profilo per ritrovarlo.
			DTOSoggetto soggettoApplicativo = getSoggettoApplicativo(gruppoServizio);

			Applicativo applicativo = this.invokers.getConfigInvoker().getServizioApplicativo(
					client.getNome(),
					soggettoApplicativo.getNomeGateway(),
					soggettoApplicativo.getTipoGateway());

			AuthenticationToken authToken = applicativo != null ? applicativo.getCredenziali() : null;
			if (authToken == null || authToken.getTokenPolicy() == null) {
				throw new IOException("token policy non configurata sull'applicativo " + client.getNome());
			}

			// controllo che la gestione token sia configurata e che la policy coincida con quella dell'applicativo
			ControlloAccessiGestioneToken authentication = this.invokers.getConfigInvoker().getControlloAccessiGestioneToken(gruppoServizio);
			if (authentication == null || authentication.getPolicy() == null) {
				throw new IOException("autenticazione token non configurata sull'erogazione");
			}

			if (!authToken.getTokenPolicy().equals(authentication.getPolicy())) {
				throw new IOException("la token policy configurata sull'erogazione (" + authentication.getPolicy()
						+ ") non coincide con quella del client (" + authToken.getTokenPolicy() + ")");
			}

			// controllo l'autorizzazione che sia configurata correttamente
			ControlloAccessiAutorizzazione authorization = this.invokers.getConfigInvoker().getControlloAccessiAutorizzazione(gruppoServizio);

			if (authorization == null
					|| authorization.getAutorizzazione() == null
					|| authorization.getAutorizzazione().getTipo() == null
					|| !authorization.getAutorizzazione().getTipo().equals("abilitato")) {
				throw new IOException("autorizzazione non abilitata");
			}

			if (!Boolean.TRUE.equals(authorization.getAutorizzazione().getTokenRichiedente())) {
				throw new IOException("autorizzazione non impostata in modalita token richiedente");
			}

			// L'applicativo risiede sotto il soggetto aderente/fruitore, che puo' differire dal
			// soggetto dell'erogazione: va indicato esplicitamente nel binding per essere risolto.
			try (Response response = this.invokers.getConfigInvoker().postApplicativoToServizioToken(
					gruppoServizio, client.getNome(), soggettoApplicativo.getNomeGateway())) {
				this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
			}
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage(), e);
		}

		return Map.of();
	}

}
