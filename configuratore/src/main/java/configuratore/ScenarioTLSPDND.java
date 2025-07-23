/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.dto.DTOClient;
import org.govway.catalogo.core.dto.HttpsClient;
import org.govway.catalogo.core.dto.HttpsPdndClient;
import org.govway.catalogo.core.dto.PdndClient;


/**
 * Applicabilità: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata
 *   per attendersi un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02), un'autenticazione token tramite
 *   policy 'PDND' (pattern messaggio ID_AUTH_* via PDND) ed una autorizzazione puntuale sia per autorizzazione canale
 *   che per criterio di autorizzazione messaggio.
 * Configurazione:
 *  - censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene associato il certificato X.509 TLS;
 *  - censimento di un applicativo (prende il nome del client) a cui viene associato il clientId fornito e la token policy 'PDND'
 *  - aggiunta del soggetto nella lista dei soggetti autorizzati puntualmente nell'autorizzazione canale;
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.
 *  
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class ScenarioTLSPDND implements ConfigurazioneScenario {
	private ScenarioTLSModI scenarioTLS;
	private ScenarioPDND scenarioPDND;
	
	
	public ScenarioTLSPDND(Invokers invokers, Properties properties) {
		this.scenarioPDND = new ScenarioPDND(invokers, properties);
		this.scenarioTLS = new ScenarioTLSModI(invokers, properties);
	}
	
	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		if (!(client instanceof HttpsPdndClient)) {
			return "Il client deve essere di tipo HTTPS PDND";
		}
		HttpsPdndClient castClient = (HttpsPdndClient) client;

		String errorPDND = this.scenarioPDND.getError(this.extractPdndClient(castClient), api);
		if(errorPDND != null) {
			return "Scenario PDND: " + errorPDND;
		}
		String errorTLS = this.scenarioTLS.getError(this.extractPdndClient(castClient), api);
		if(errorTLS != null) {
			return "Scenario TLS: " +errorTLS;
		}
		
		return null;
		
	}

	private HttpsClient extractHttpsClient(HttpsPdndClient client) {
		return new HttpsClient(
				client.getNome(), 
				client.getDescrizione(), 
				client.getAuthType(), 
				client.getIndirizzoIp(), 
				client.getOutCertificate(), 
				client.getOutTipo());
	}
	
	private PdndClient extractPdndClient(HttpsPdndClient client) {
		return new PdndClient(
				client.getNome(), 
				client.getDescrizione(), 
				client.getAuthType(), 
				client.getIndirizzoIp(), 
				client.getClientId().toString());
	}
	
	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio)
			throws ConfigurazioneException {
		HttpsPdndClient client = (HttpsPdndClient) rawClient;
		
		Map<String, String> rv = new HashMap<>();
		rv.putAll(this.scenarioPDND.configureClient(this.extractPdndClient(client), gruppiServizio));
		rv.putAll(this.scenarioTLS.configureClient(this.extractHttpsClient(client), gruppiServizio));
		return rv;
	}

	@Override
	public Map<String, String> configureAPI(DTOClient rawClient, GruppoServizio gruppoServizio)
			throws ConfigurazioneException {
		HttpsPdndClient client = (HttpsPdndClient) rawClient;
		
		Map<String, String> rv = new HashMap<>();
		rv.putAll(this.scenarioPDND.configureAPI(this.extractPdndClient(client), gruppoServizio));
		rv.putAll(this.scenarioTLS.configureAPI(this.extractHttpsClient(client), gruppoServizio));
		return rv;
	}

}
