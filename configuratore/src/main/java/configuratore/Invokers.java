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
import java.util.Map;

import org.govway.catalogo.core.dto.DTOAdesione.AmbienteEnum;

import config.GovwayConfigInvoker;
import keycloak.KeycloakInvoker;

/**
 * @author Tommaso Burlon (tommaso.burlon@link.it)
 * @author $Author$
 * @version $Rev$, $Date$
 */
public class Invokers {
	private Map<AmbienteEnum, KeycloakInvoker> keycloak;
	private GovwayConfigInvoker config;
	
	public Invokers(Map<AmbienteEnum, KeycloakInvoker> keycloak, GovwayConfigInvoker config) {
		this.keycloak = keycloak == null ? Map.of() : Map.copyOf(keycloak);
		this.config = config;
	}
	
	/**
	 * Keycloak dell'ambiente dell'adesione in configurazione: collaudo e produzione sono
	 * istanze distinte, configurate separatamente nelle properties del configuratore.
	 */
	public KeycloakInvoker getKeycloak(AmbienteEnum ambiente) throws IOException {
		if (ambiente == null)
			throw new IOException("ambiente dell'adesione non valorizzato, impossibile individuare keycloak");
		
		KeycloakInvoker invoker = this.keycloak.get(ambiente);
		
		if (invoker == null)
			throw new IOException("keycloak non configurato per l'ambiente " + ambiente);
		
		return invoker;
	}
	
	public GovwayConfigInvoker getConfigInvoker() {
		return this.config;
	}
}