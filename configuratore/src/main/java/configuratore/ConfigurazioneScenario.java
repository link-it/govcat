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

import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.govway.catalogo.core.configurazione.ConfigurazioneException;
import org.govway.catalogo.core.dto.DTOClient;


/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public interface ConfigurazioneScenario {

	public static String getProperty(Properties p, String key) {
		return p.getProperty(ConfigurazioneScenario.class.getCanonicalName() + "." + key);
	}
	
	
	/**
	 * Controlla che il profilo di autenticazione si valido per il seguente scenario
	 * @param client: dati del profilo di autenticazione
	 * @param api: servizio su cui configurare lo scenario 
	 * @return booleano che avverte se il profilo di autenticazioen combacia con lo scenario
	 */
	public boolean check(DTOClient client, GruppoServizio api);
	
	/**
	 * configura un client
	 * @param client: client da configurare
	 * @param apis: lista di servizi che utilizzano il seguente client
	 * @return ritorna una mappa con una lista di segreti
	 * @throws ConfigurazioneException
	 */
	public Map<String, String> configureClient(DTOClient rawClient, List<GruppoServizio> gruppiServizio) throws ConfigurazioneException;
	
	/**
	 * configurare un Servizio
	 * @param client
	 * @param apis
	 * @return
	 * @throws ConfigurazioneException
	 */
	public Map<String, String> configureAPI(DTOClient rawClient, GruppoServizio gruppoServizio) throws ConfigurazioneException;
	
}
