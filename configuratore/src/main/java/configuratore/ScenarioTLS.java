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
import config.GovwayConfigInvoker;
import config.ServizioApplicativo;
import freemarker.template.TemplateException;
import okhttp3.Response;


/**
 * Applicabilità: L'erogazione/fruizione su GovWay deve essere pre-configurata per 
 * attendersi un'autenticazione trasporto 'https' ed una autorizzazione puntuale.
 * In questo scenario tipicamente l'erogazione o la fruizione dell'API su GovWay 
 * sarà con un profilo 'API Gateway', ma potrebbe essere anche una fruizione 'ModI'.
 * Sicuramente NON PUO' essere una erogazione 'ModI'. 
 * 
 * Configurazione:
 *  - censimento di un soggetto (prende il nome dal soggetto del catalogo);
 *  - censimento di un applicativo (prende il nome del client) a cui viene associato il certificato X.509;
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente.
 *  
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */

public class ScenarioTLS implements ConfigurazioneScenario{

	private Invokers invokers;
	
	private boolean ignoreConflict;
	
	private Logger logger = LoggerFactory.getLogger(getClass());
	
	public ScenarioTLS(Invokers invokers, Properties properties) {
		this.invokers = invokers;
		
		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}
	
	@Override
	public String getError(DTOClient client, GruppoServizio api) {
		
		if (!(client instanceof HttpsClient)) {
			return "Il client deve essere di tipo HTTPS";
		}
		
		if (!api.isModI() && !api.getProfilo().equals("APIGateway")) {
			return "L'API deve essere di tipo APIGateway o ModI";
		}
		
		if (api.isModI() && !api.isFruizione()) {
			return "L'API ModI può essere solo una fruizione";
		}
		
		return null;
	}

	@Override
	public Map<String, String> configureClient(DTOClient clientRaw, List<GruppoServizio> apis)
			throws ConfigurazioneException {
		HttpsClient client = (HttpsClient) clientRaw;
		
		ServizioApplicativo sa = new ServizioApplicativo()
				.setModalitaAccesso("https")
				.setNomeApplicativo(client.getNome())
				.setCertificato(client.getCertificato())
				.setDescrizione(client.getDescrizione());
		
		DTOSoggetto soggetto = null;
		if (!apis.isEmpty()) {
			if (apis.get(0).isFruizione()) {
				soggetto = apis.get(0).getSoggettoFruitore();
			} else {
				soggetto = apis.get(0).getSoggettoAderente();
			}
		} else {
			return Map.of();
		}
		
		
		
		try (Response res = this.invokers.getConfigInvoker().createSoggetto(soggetto)){
			this.invokers.getConfigInvoker().checkResponse(res, this.ignoreConflict);
		} catch(TemplateException | IOException e) {
			this.logger.error("errore nell'aggiunta del soggetto {}@{}", soggetto.getNomeGateway(), soggetto.getTipoGateway(), e);
			throw new ConfigurazioneException(e.getMessage());
		}
		
		
		try(Response res = this.invokers.getConfigInvoker().postServizioApplicativo(sa, soggetto)) {
			this.invokers.getConfigInvoker().checkResponse(res, this.ignoreConflict);
		} catch(TemplateException | IOException e) {
			this.logger.error("errore nell'aggiunta del servizio applicativo {}", sa.getNomeApplicativo(), e);
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
			try (Response response = configInvoker.postApplicativoToServizio(api, client.getNome(), null)) {
				this.invokers.getConfigInvoker().checkResponse(response, this.ignoreConflict);
			}
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException(e.getMessage());
		}
		return Map.of();
	}

}
