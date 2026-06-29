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
import org.govway.catalogo.core.dto.DTOClient;
import org.govway.catalogo.core.dto.DTOSoggetto;
import org.govway.catalogo.core.dto.OauthClientCredentialsClient;

import config.Applicativo;
import config.AuthenticationToken;
import config.ControlloAccessiAutorizzazione;
import config.ControlloAccessiGestioneToken;
import config.ServizioApplicativo;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class ScenarioClientCredentials implements ConfigurazioneScenario{

	private Invokers invokers;
	private boolean ignoreConflict;
	private boolean enableKeycloakGovwayConfiguration;
	private boolean enableKeycloakBackendConfiguration;
	private boolean enableKeycloakClientCreation;

	public ScenarioClientCredentials(Invokers invokers, Properties properties) {
		this.invokers = invokers;

		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));

		String enableKeycloak = ConfigurazioneScenario.getProperty(properties, "enableKeycloakBackendConfiguration");
		this.enableKeycloakBackendConfiguration = Boolean.valueOf(Objects.requireNonNullElse(enableKeycloak, Boolean.FALSE.toString()));

		String enableGovway = ConfigurazioneScenario.getProperty(properties, "enableGovwayClientCredentials");
		this.enableKeycloakGovwayConfiguration = Boolean.valueOf(Objects.requireNonNullElse(enableGovway, Boolean.FALSE.toString()));

		String enableKcCreation = ConfigurazioneScenario.getProperty(properties, "enableKeycloakClientCreation");
		this.enableKeycloakClientCreation = Boolean.valueOf(Objects.requireNonNullElse(enableKcCreation, Boolean.TRUE.toString()));
	}
	
	@Override
	public String getError(DTOClient client, GruppoServizio apis) {
		if (!(client instanceof OauthClientCredentialsClient)) {
			return "Client non OAuth Client Credentials";
		}

		return null;
	}

	/**
	 * Soggetto sotto cui registrare/cercare l'applicativo (client/richiedente): aderente per le
	 * erogazioni, fruitore per le fruizioni. Coerente con gli altri scenari (TLS, PDND, Sign).
	 */
	private DTOSoggetto getSoggettoApplicativo(GruppoServizio api) {
		return api.isFruizione() ? api.getSoggettoFruitore() : api.getSoggettoAderente();
	}

	@Override
	public Map<String, String> configureClient(DTOClient clientRaw, List<GruppoServizio> apis) throws ConfigurazioneException {
		OauthClientCredentialsClient client = (OauthClientCredentialsClient) clientRaw;

		try {
			if (this.enableKeycloakClientCreation && !this.invokers.getKeycloak().clientExists(client.getClientId())) {
				this.invokers.getKeycloak().createClient(client.getClientId(), client.getNome(), client.getDescrizione());
			}

			if (this.enableKeycloakGovwayConfiguration) {
				
				// ottengo la token policy dalle erogazioni
				String policy = null;
				
				for (GruppoServizio api : apis) {
					ControlloAccessiGestioneToken authentication = this.invokers.getConfigInvoker().getControlloAccessiGestioneToken(api);			
					if (authentication == null || authentication.getPolicy() == null)
						continue;
					policy = authentication.getPolicy();
				}
				if (policy == null)
					throw new IOException("impossibile individuare la token policy configurata");
				
				DTOSoggetto soggetto = apis.isEmpty() ? null : getSoggettoApplicativo(apis.get(0));

				// modiDominio = "interno" se l'organizzazione del soggetto usato e' referente, altrimenti "esterno"
				String modiDominio = (soggetto != null && soggetto.isReferente()) ? "interno" : "esterno";

				ServizioApplicativo sa = new ServizioApplicativo()
						.setModalitaAccesso("token")
						.setNomeApplicativo(client.getNome())
						.setDescrizione(client.getDescrizione())
						.setTokenPolicy(policy)
						.setTokenIdentificativo(client.getClientId())
						.setModiDominio(modiDominio);

				Response response = this.invokers.getConfigInvoker().postServizioApplicativo(sa, soggetto);
				
				this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
			}
			
			if (this.enableKeycloakBackendConfiguration)
				return Map.of("client-secret", this.invokers.getKeycloak().getSecret(client.getClientId()));
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage());
		}
		
		return Map.of();
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio api) throws ConfigurazioneException {
		
		try {
			// L'applicativo e' stato creato in configureClient sotto il soggetto fruitore (fruizione)
			// o aderente (erogazione): la GET deve usare lo stesso soggetto e profilo per ritrovarlo.
			DTOSoggetto soggettoApplicativo = getSoggettoApplicativo(api);

			Applicativo applicativo = invokers.getConfigInvoker().getServizioApplicativo(
					client.getNome(),
					soggettoApplicativo.getNomeGateway(),
					soggettoApplicativo.getTipoGateway());

			AuthenticationToken authToken = applicativo.getCredenziali();
			
			// controllo che l'autenticazione gestione token sia abilitata e la policy coincida con quella dell'applicativo
			ControlloAccessiGestioneToken authentication = this.invokers.getConfigInvoker().getControlloAccessiGestioneToken(api);			
			if (authentication == null || authentication.getPolicy() == null)
				throw new IOException("autenticazione token non configurata sull'erogazione");
			
			String policy = authentication.getPolicy();
			if (!authToken.getTokenPolicy().equals(policy))
				throw new IOException("la token policy configurata sull'erogazione non coincide con quella del client");
			
			// controllo l'autorizzazione che sia configurata correttamente
			ControlloAccessiAutorizzazione authorization = this.invokers.getConfigInvoker().getControlloAccessiAutorizzazione(api);
			
			if (authorization == null 
					|| authorization.getAutorizzazione() == null 
					|| authorization.getAutorizzazione().getTipo() == null
					|| !authorization.getAutorizzazione().getTipo().equals("abilitato"))
				throw new IOException("autorizzazione non abilitata");
	
			if (!authorization.getAutorizzazione().getTokenRichiedente().booleanValue())
				throw new IOException("autorizzazione non impostata in modalita token richiedente");

			// L'applicativo risiede sotto il soggetto aderente/fruitore, che puo' differire dal
			// soggetto dell'erogazione: va indicato esplicitamente nel binding per essere risolto.
			Response response = this.invokers.getConfigInvoker().postApplicativoToServizioToken(api, client.getNome(), soggettoApplicativo.getNomeGateway());
			
			this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage());
		}
		return Map.of();
	}

}
