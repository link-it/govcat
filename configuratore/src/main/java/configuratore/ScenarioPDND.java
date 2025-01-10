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
import org.govway.catalogo.core.dto.PdndClient;

import config.ControlloAccessiAutenticazione;
import config.ControlloAccessiAutorizzazione;
import config.GovwayConfigInvoker;
import config.ServizioApplicativo;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * Applicabilità: si applica SOLO ad una erogazione su GovWay con profilo di 
 * interoperabilità 'ModI' pre-configurata per attendersi un'autenticazione 
 * canale 'https' opzionale (pattern ID_AUTH_CHANNEL_01), un'autenticazione 
 * token tramite policy 'PDND' (pattern messaggio ID_AUTH_* via PDND) ed una 
 * autorizzazione puntuale per criterio di autorizzazione messaggio.
 * 
 * Configurazione:
 *  - censimento di un soggetto (prende il nome dal soggetto del catalogo);
 *  - censimento di un applicativo (prende il nome del client) a cui viene 
 *    associato il clientId fornito e la token policy 'PDND';
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati 
 *    puntualmente nell'autorizzazione messaggio.
 *    
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class ScenarioPDND implements ConfigurazioneScenario {
	private Invokers invokers;
	
	private boolean ignoreConflict;
	private boolean configureGovway = true;
	
	public ScenarioPDND(Invokers invokers, Properties properties) {
		this.invokers = invokers;
		
		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}
	
	public ScenarioPDND configureGovway(boolean value) {
		this.configureGovway = value;
		return this;
	}
	
	@Override
	public boolean check(DTOClient client, GruppoServizio api) {
		return true;
	}

	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio)
			throws ConfigurazioneException {
		
		PdndClient client = (PdndClient) rawClient;
		Map<String, String> ret = Map.of("client_id", client.getClientId().toString());
		if (!this.configureGovway)
			return ret;
		
		ServizioApplicativo sa = new ServizioApplicativo()
				.setModalitaAccesso("token")
				.setNomeApplicativo(client.getNome())
				.setDescrizione(client.getDescrizione())
				.setModiDominio("esterno")
				.setTokenPolicy("PDND")
				.setTokenIdentificativo(client.getClientId().toString());
		
		DTOSoggetto soggetto = null;
		if (!gruppiServizio.isEmpty()) {
			soggetto = gruppiServizio.get(0).getSoggettoAderente();
		}
		
		Response response;
		try {
			response = this.invokers.getConfigInvoker().postServizioApplicativo(sa, soggetto);
		} catch(TemplateException | IOException e) {
			e.printStackTrace();
			throw new ConfigurazioneException();
		}
		
		if (!response.isSuccessful() && (response.code() != 409 || !this.ignoreConflict))
			throw new ConfigurazioneException();
		return ret;
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio gruppoServizio)
			throws ConfigurazioneException {
		GovwayConfigInvoker configInvoker = invokers.getConfigInvoker();
		if (!this.configureGovway)
			return Map.of();
		
		try {
			// controllo che l'autenticazione sia https
			ControlloAccessiAutenticazione authentication = configInvoker.getControlloAccessiAutenticazione(gruppoServizio);
			
			if (authentication == null 
					|| authentication.getAutenticazione() == null
					|| authentication.getAutenticazione().getTipo() == null
					|| !authentication.getAutenticazione().getTipo().equals("https"))
				throw new IOException("autenticazione configurata non di tipo https");
			
			// controllo l'autorizzazione che sia configurata correttamente
			ControlloAccessiAutorizzazione authorization = configInvoker.getControlloAccessiAutorizzazione(gruppoServizio);
			
			if (authorization == null 
					|| authorization.getAutorizzazione() == null 
					|| authorization.getAutorizzazione().getTipo() == null
					|| !authorization.getAutorizzazione().getTipo().equals("abilitato"))
				throw new IOException("autorizzazione non abilitata");
	
			//if (!authorization.getAutorizzazione().getRichiedente().booleanValue())
			//	throw new IOException("autorizzazione non impostata in modalita richiedente");
	
			// infine associo il servizio applicativo ai richiedenti
			Response response = configInvoker.postApplicativoToServizio(gruppoServizio, client.getNome(), gruppoServizio.getSoggettoAderente().getNomeGateway());
			
			if (!response.isSuccessful() && (!this.ignoreConflict || response.code() != 409))
				throw new IOException("errore nel configurare l'erogazione, code: " + response.code());
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException();
		}
		return Map.of();
	}

}
