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
import org.govway.catalogo.core.dto.SignClient;

import config.ControlloAccessiAutenticazione;
import config.ControlloAccessiAutorizzazione;
import config.GovwayConfigInvoker;
import config.ServizioApplicativo;
import freemarker.template.TemplateException;
import okhttp3.Response;

/**
 * Applicabilità: 
 *   si applica SOLO ad una erogazione su GovWay con profilo di interoperabilità 'ModI' pre-configurata per attendersi
 *   un'autenticazione canale 'https' (pattern ID_AUTH_CHANNEL_02 + pattern sicurezza messaggio ID_AUTH_* o INTEGRITY_*)
 *   ed una autorizzazione puntuale sul messaggio.
 * Configurazione:     
 *  - censimento di un applicativo (prende il nome del client) a cui viene associato il certificato X.509 di firma;
 *  - aggiunta dell'applicativo nella lista degli applicativi autorizzati puntualmente nell'autorizzazione messaggio.
 *    
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class ScenarioSign implements ConfigurazioneScenario {

	private Invokers invokers;
	
	private boolean ignoreConflict;
	
	public ScenarioSign(Invokers invokers, Properties properties) {
		this.invokers = invokers;
		
		String ignore = ConfigurazioneScenario.getProperty(properties, "ignoreConflict");
		this.ignoreConflict = Boolean.valueOf(Objects.requireNonNullElse(ignore, Boolean.FALSE.toString()));
	}
	
	@Override
	public boolean check(DTOClient client, GruppoServizio api) {
		return !api.isFruizione() && api.getProfilo().equals("ModI");
	}

	@Override
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> apis)
			throws ConfigurazioneException {
		SignClient client = (SignClient) rawClient;
		
		ServizioApplicativo sa = new ServizioApplicativo()
				.setModalitaAccesso("https")
				.setNomeApplicativo(client.getNome())
				.setCertificato(client.getCertificato())
				.setDescrizione(client.getDescrizione())
				.setModiDominio("esterno");
		
		DTOSoggetto soggetto = null;
		if (!apis.isEmpty()) {
			soggetto = apis.get(0).getSoggettoAderente();
		}
		
		try (Response response = this.invokers.getConfigInvoker().postServizioApplicativo(sa, soggetto)) {
			if (!response.isSuccessful() && (response.code() != 409 || !this.ignoreConflict))
				throw new ConfigurazioneException();
		} catch(TemplateException | IOException e) {
			e.printStackTrace();
			throw new ConfigurazioneException();
		}
		
		return Map.of();
	}

	@Override
	public Map<String, String> configureAPI(DTOClient client, GruppoServizio gruppoServizio) throws ConfigurazioneException {
		
		GovwayConfigInvoker configInvoker = invokers.getConfigInvoker();
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
	
			if (!authorization.getAutorizzazione().getRichiedente().booleanValue())
				throw new IOException("autorizzazione non impostata in modalita richiedente");
	
			// infine associo il servizio applicativo ai richiedenti
			try (Response response = configInvoker.postApplicativoToServizio(gruppoServizio, client.getNome(), gruppoServizio.getSoggettoAderente().getNomeGateway())) {
				if (!response.isSuccessful() && (!this.ignoreConflict || response.code() != 409))
					throw new IOException("errore nel configurare l'erogazione, code: " + response.code());
			}
		} catch (IOException | TemplateException e) {
			throw new ConfigurazioneException();
		}
		return Map.of();
	}

}
