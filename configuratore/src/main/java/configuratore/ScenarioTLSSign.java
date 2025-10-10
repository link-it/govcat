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
import org.govway.catalogo.core.dto.HttpsSignClient;
import org.govway.catalogo.core.dto.SignClient;

/**
 * Applicabilità: 
 *   si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi
 *   un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02 + pattern sicurezza messaggio ID_AUTH_* o INTEGRITY_*)
 *   ed una autorizzazione puntuale sia sul canale che sul messaggio.
 * Configurazione:     
 * 	- censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene associato il certificato X.509 TLS;
 *  - censimento di un applicativo (prende il nome del client) a cui viene associato il certificato X.509 di firma;
 *  - aggiunta del soggetto nella lista dei soggetti autorizzati puntualmente nell'autorizzazione canale;
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.
 *    
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class ScenarioTLSSign implements ConfigurazioneScenario {

	private ScenarioTLSModI scenarioTLS;
	private ScenarioSign scenarioSign;
	
	
	public ScenarioTLSSign(Invokers invokers, Properties properties) {
		this.scenarioSign = new ScenarioSign(invokers, properties);
		this.scenarioTLS = new ScenarioTLSModI(invokers, properties);
	}
	
	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		
		String errorSign = this.scenarioSign.getError(client, api);
		if(errorSign != null) {
			return  "Scenario Sign: " + errorSign;
		}
		String errorTLS = this.scenarioTLS.getError(client, api);
		if(errorTLS != null) {
			return "Scenario TLS: " + errorTLS;
		}
		
		return null;
	}

	private HttpsClient extractHttpsClient(HttpsSignClient client) {
		return new HttpsClient(
				client.getNome(), 
				client.getDescrizione(), 
				client.getAuthType(), 
				client.getIndirizzoIp(), 
				client.getOutCertificate(), 
				client.getOutTipo());
	}
	
	private SignClient extractSignClient(HttpsSignClient client) {
		return new SignClient(
				client.getNome(), 
				client.getDescrizione(), 
				client.getAuthType(), 
				client.getIndirizzoIp(), 
				client.getSignCertificate(), 
				client.getSignTipo());
	}
	
	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio)
			throws ConfigurazioneException {
		HttpsSignClient httpsSignClient = (HttpsSignClient) rawClient;
		
		Map<String, String> rv = new HashMap<>();
		rv.putAll(this.scenarioTLS.configureClient(this.extractHttpsClient(httpsSignClient), gruppiServizio));
		rv.putAll(this.scenarioSign.configureClient(this.extractSignClient(httpsSignClient), gruppiServizio));
		return rv;
	}

	@Override
	public Map<String, String> configureAPI(DTOClient rawClient, GruppoServizio gruppoServizio)
			throws ConfigurazioneException {
		HttpsSignClient httpsSignClient = (HttpsSignClient) rawClient;
		
		Map<String, String> rv = new HashMap<>();
		rv.putAll(this.scenarioSign.configureAPI(this.extractSignClient(httpsSignClient), gruppoServizio));
		rv.putAll(this.scenarioTLS.configureAPI(this.extractHttpsClient(httpsSignClient), gruppoServizio));
		return rv;
	}

}
