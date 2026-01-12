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
import org.govway.catalogo.core.dto.HttpsClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import config.ControlloAccessiAutenticazione;
import config.ControlloAccessiAutorizzazione;
import config.Credenziali;
import config.GovwayConfigInvoker;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * Applicabilità: si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità
 * 'ModI' pre-configurata per attendersi un'autenticazione canale 'https'
 * (pattern ID_AUTH_CHANNEL_02) ed una autorizzazione puntuale sul canale.
 * 
 * Configurazione:
 *  - censimento di un soggetto (prende il nome dal soggetto del catalogo) a cui viene 
 *    associato il certificato X.509.
 *  - aggiunta del soggetto nella lista degli applicativi autorizzati puntualmente sul 
 *    canale. 
 *  NOTA: non serve registrare l'applicativo e il nome del client rimane inutilizzato 
 *  per quanto concerne la configurazione su govway.
 *  
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class ScenarioTLSModI implements ConfigurazioneScenario {
	private Invokers invokers;
	
	private Logger logger = LoggerFactory.getLogger(getClass());

	private boolean ignoreConflict;
	
	public ScenarioTLSModI(Invokers invokers, Properties properties) {
		this.invokers = invokers;
		
		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}
	
	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		boolean check = api.isModI() && !api.isFruizione();
		if(!check) {
			return "L'API deve essere una fruizione ModI";
		}
		return null;
	}

	@Override
	public Map<String, String> configureClient(DTOClient clientRaw, List<GruppoServizio> apis)
			throws ConfigurazioneException {
		HttpsClient client = (HttpsClient) clientRaw;
	
		DTOSoggetto soggetto = null;
		if (!apis.isEmpty()) {
			soggetto = new DTOSoggetto(apis.get(0).getSoggettoAderente().getNomeGateway(),
					apis.get(0).getSoggettoAderente().getTipoGateway());
		}
		
		try (Response res = this.invokers.getConfigInvoker().createSoggetto(soggetto)){
			this.invokers.getConfigInvoker().checkResponse(res, this.ignoreConflict);
		} catch(TemplateException | IOException e) {
			this.logger.error("errore nell'aggiunta del soggetto {}@{}", soggetto.getNomeGateway(), soggetto.getTipoGateway(), e);
			throw new ConfigurazioneException(e.getMessage());
		}
		
		Credenziali credenziali = new Credenziali();
		credenziali.setCertificato(client.getCertificato());
		credenziali.setModalitaAccesso("https");
		credenziali.setTipoCertificato("CER");
		
		try (Response response = this.invokers.getConfigInvoker().postCredenzialiSoggetto(soggetto, credenziali)) {
			this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage());
		}
		
		return Map.of();
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio api)
			throws ConfigurazioneException {
		GovwayConfigInvoker configInvoker = invokers.getConfigInvoker();
		
		try {
			// controllo che l'autenticazione sia https
			ControlloAccessiAutenticazione authentication = configInvoker.getControlloAccessiAutenticazione(api);
			
			if (authentication == null 
					|| authentication.getAutenticazione() == null
					|| authentication.getAutenticazione().getTipo() == null
					|| !authentication.getAutenticazione().getTipo().equals("https"))
				throw new IOException("autenticazione configurata non di tipo https");
			
			// controllo l'autorizzazione che sia configurata correttamente
			ControlloAccessiAutorizzazione authorization = configInvoker.getControlloAccessiAutorizzazione(api);
			
			if (authorization == null 
					|| authorization.getAutorizzazione() == null 
					|| authorization.getAutorizzazione().getTipo() == null
					|| !authorization.getAutorizzazione().getTipo().equals("abilitato"))
				throw new IOException("autorizzazione non abilitata");
	
			if (!authorization.getAutorizzazione().getRichiedente().booleanValue())
				throw new IOException("autorizzazione non impostata in modalita richiedente");
	
			// infine associo il servizio applicativo ai richiedenti
			try (Response response = configInvoker.postSoggettoAutorizzato(api, api.getSoggettoAderente().getNomeGateway())) {
				this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
			}
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage());
		}
		return Map.of();
	}
}
